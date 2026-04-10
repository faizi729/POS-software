# API Performance & Scalability Audit (Next.js + Mongo/Mongoose)

This report captures the **57 App Router API routes** under `app/api/**/route.ts` and the concrete optimizations applied in this repo to reduce latency, DB load, and cold-start penalties.

## Global findings (systemic bottlenecks)

### 1) Cold start / first-query latency
- **Problem**: `connectToDatabase()` performed index reconciliation (`syncIndexes`) on connect.
- **Why slow**: `syncIndexes()` can block the **first request** (and sometimes multiple) while indexes are inspected/synced.
- **Fix**: gated index sync behind `DB_SYNC_INDEXES=1`.
- **File**: `lib/db/connect.ts`
- **Expected gain**: first request often drops from **1–2s → hundreds of ms** (varies by Mongo + indexes).

### 2) Over-fetch via `getRestaurantBundle()`
- **Problem**: Several list APIs returned small lists by calling `getRestaurantBundle()` which loads multiple collections.
- **Why slow**: extra DB queries + serialization + larger payloads, amplified by polling.
- **Fix pattern**: replace with targeted model queries + `.select()` + `.lean()` + `.limit()` + indexed `.sort()`.
- **Routes fixed**:
  - `GET /api/orders`
  - `GET /api/payments`
  - `GET /api/menu/items`
  - `GET /api/menu/categories`
  - `GET /api/dashboard/summary` (via `server/queries/dashboard.ts`)

### 3) Avoid `.populate()` on hot paths
- **Problem**: `.populate()` adds extra query + hydration overhead for list endpoints.
- **Fix pattern**: fetch ids + one bulk lookup + map in memory.
- **Routes/services fixed**:
  - `GET /api/inventory/recipes`
  - `getInventoryLogs()` (used by `GET /api/inventory/logs`)

## Route-by-route summary (57)

> For each route: Problem, Why slow, Fix applied, Index notes, Expected improvement.

### KDS (hot polling)

#### `GET /api/kds/orders`
- **Problem**: unbounded list, no projection, sort not aligned to index direction.
- **Fix**: projection + `.lean()` + `.limit()` + `createdAt:-1` sort (uses existing index) + per-column slice + `Cache-Control: no-store`.
- **Indexes**: uses `Order` index `{ restaurantId:1, status:1, createdAt:-1 }`.
- **Expected**: stabilize under load; typical **<150ms** warmed.

#### `PATCH /api/kds/orders/[id]/status`
- **Problem**: read → validate → save (multiple trips).
- **Fix**: single `findOneAndUpdate` enforcing transition in query + projection.
- **Expected**: lower tail latency, higher throughput.

### Orders

#### `GET /api/orders`
- **Problem**: used `getRestaurantBundle()` (multi-collection fetch).
- **Fix**: direct `Order.find()` with projection + `.lean()` + `.limit()` + optional filters + no-store headers.
- **Indexes**: uses `Order` `{ restaurantId:1, createdAt:-1 }`.
- **Expected**: large drop in DB time and payload.

> Other `orders/[id]/*` routes were reviewed for correctness; no unsafe changes applied in this pass.

### Payments

#### `GET /api/payments`
- **Problem**: used `getRestaurantBundle()` (multi-collection fetch).
- **Fix**: direct `Payment.find()` with projection + `.lean()` + `.limit()` + indexed sort + no-store.
- **Indexes**: added `Payment` `{ restaurantId:1, status:1, paidAt:-1 }` to support common filters.
- **Expected**: large drop in payload + faster sort.

### Dashboard

#### `GET /api/dashboard/summary`
- **Problem**: computed summary from full bundle in JS.
- **Fix**: rewrite `server/queries/dashboard.ts` to use aggregates and bounded queries (today range, projections, limits).
- **Indexes**:
  - `Order` `{ restaurantId:1, createdAt:-1 }` and `{ restaurantId:1, status:1, createdAt:-1 }`
  - `Payment` `{ restaurantId:1, paidAt:-1 }` and `{ restaurantId:1, status:1, paidAt:-1 }`
- **Expected**: **seconds → <250ms** in typical datasets.

### Menu (POS list endpoints)

#### `GET /api/menu/items`
- **Problem**: used `getRestaurantBundle()`.
- **Fix**: direct `MenuItem.find()` with projection + `.lean()` + safe high default limit.

#### `GET /api/menu/categories`
- **Problem**: used `getRestaurantBundle()`.
- **Fix**: direct `MenuCategory.find()` with projection + `.lean()` + safe high default limit.

### Inventory

#### `GET /api/inventory/recipes`
- **Problem**: `populate(menuItemId)` + second ingredient scan.
- **Fix**: remove populate; bulk fetch menu items once; keep `.lean()`.

#### `GET /api/inventory/logs`
- **Problem**: service used populate.
- **Fix**: `getInventoryLogs()` now selects only required fields + bulk ingredient lookup.

#### `GET /api/inventory/alerts`
- **Problem**: could return unbounded ingredient list.
- **Fix**: service now selects only required fields and limits to 300.

#### `GET /api/inventory/ingredients`
- **Fix**: added projection (no behavior change).

### Reports

#### `GET /api/reports/sales`, `/tax`, `/heatmap`, `/items`, `/insights`
- **Problem**: report queries loaded full order docs for date ranges.
- **Fix**: added strict `.select()` projections across `server/queries/reports.ts`; tightened payment method filter to date range + select orderIds only.
- **Indexes**: relies on existing Order/Payment indexes (see above).

### WhatsApp

#### `GET/POST /api/whatsapp/catalog-sync`
- **Problem**: over-fetch menu items/categories, no no-store header.
- **Fix**: projection on both models + no-store header on GET.

#### `GET /api/whatsapp/sessions`
- **Status**: already uses `.limit(100)` + `.lean()` + sort on `updatedAt`.

#### `GET/POST /api/whatsapp/webhook`
- **Status**: already rate-limited and returns 200 to avoid Meta retries. Minimal DB usage (verification uses `exists`).

### Settings

#### `GET/PATCH /api/settings/profile`
- **Fix**: projection on Restaurant reads/updates.

#### `GET/PATCH /api/settings/tax`
- **Fix**: projection on Restaurant reads/updates.

#### `GET/PATCH /api/settings/whatsapp`
- **Fix**: projection on Restaurant reads/updates.

### Billing (receipt clone)

#### `POST /api/bill/clone/upload`
- **Fix**: removed expensive OCR text `console.log` to reduce IO overhead.

## Notes / operational guidance

- **Index sync**: run once explicitly with `DB_SYNC_INDEXES=1` in a deploy job, not per request.
- **Limits**: where behavior might depend on “return everything”, high defaults were used to avoid breaking UI while still preventing runaway payloads.

