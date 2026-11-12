# AI Context — POS Software (Rasoio)

Short handoff note. Read this first.

## Stack
Next.js 15 (App Router, server components + route handlers), React 19, TypeScript, Mongoose 8 + MongoDB Atlas,
zod, Tailwind v4, lucide-react. Multi-tenant: one `Restaurant` = one workspace, keyed by `slug`.
Auth: tenant users (bcrypt `passwordHash`, JWT cookie `auth_token`) and platform admins (`PlatformUser`, cookie `sa_token`).

Run: `npm run dev` (currently on port 3001) · typecheck: `npx tsc --noEmit`.

## What was built (most recent work)

### 1. Sarvam AI for menu import + bill template cloning
Flow: upload image/PDF → **Sarvam Vision OCR** → text → **Sarvam chat** → structured JSON.

| File | Role |
|---|---|
| `lib/ai/sarvam.ts` | Sarvam client: `api-subscription-key` auth, chat completions (model→endpoint routing), Document AI `job/parse` → poll `job/{id}/status` → `job/{id}/results?format=md` (JSON fallback), `job/extract` |
| `lib/ai/chat-json.ts` | Provider router: Sarvam → OpenRouter → error. Per-task models + fallback chain |
| `lib/ocr/document-ocr.ts` | One OCR entry: Sarvam Vision → OCR.Space fallback |
| `lib/ocr/receipt-ai-template.ts` | AI bill template (zod-validated) → falls back to rule engine |
| `lib/ocr/menu-extraction-engine.ts` | Takes a generic `ai` runner (legacy `openRouter` still accepted) |
| `app/api/menu/import/upload/route.ts` | Multi-file menu import (returns `ocr`, `ai`, `extracted`, `log`) |
| `app/api/menu/ocr/import/route.ts` | Single-image import + writes menu to DB |
| `app/api/bill/clone/upload/route.ts` | Bill clone → `structured`, `layout`, `demoHtml`, `ai` |

Routes export `maxDuration = 120` (Document AI jobs are async).

### 2. Model strategy (verified live against our own prompts)
- **menu + bill → `glm5.3-flash`** (`/v2`): ~1s, exact bill numbers, 1M context, ₹13.5/45 per 1M tokens.
- **fallback → `sarvam-105b`** — used automatically if the configured model is rejected.
- **docs/OCR → no model param** (Sarvam default).

### 3. Admin/ops helpers
- `scripts/reset-owner-password.js` (`npm run owner:reset`) — list tenants / reset a tenant user password (bcrypt-10, clears reset+OTP tokens, `--disable-2fa`).
- `npm run sa:create` — creates/resets the super admin from `SA_*` env.
- `app/super-admin/(protected)/tenants/new/` + `components/super-admin/new-tenant-form.tsx` — create tenant **and** its owner; `POST /api/super-admin/tenants` now accepts optional `ownerEmail/ownerPassword/ownerName/twoFactorEnabled`.
- `tenants/[id]/page.tsx` guards non-ObjectId paths (`isValidObjectId` → redirect) so `/tenants/new` no longer throws `Cast to ObjectId`.

## Env (Sarvam)
```
SARVAM_API_KEY=...                  # required
# SARVAM_CHAT_MODEL=glm5.3-flash     # default for all tasks
# SARVAM_MENU_MODEL=glm5.3-flash
# SARVAM_BILL_MODEL=glm5.3-flash
# SARVAM_OCR_LANGUAGE=en-IN          # Sarvam defaults to INDIC if omitted
# SARVAM_REASONING_EFFORT=none       # "none" disables thinking
# SARVAM_MAX_TOKENS=2048
# SARVAM_DOC_MODEL=                  # LEAVE UNSET
# SARVAM_BASE_URL=https://api.sarvam.ai
```
Optional legacy fallbacks: `OCR_SPACE_API_KEY`, `OPENROUTER_API_KEY` + `OPENROUTER_MODEL`.

## Gotchas (do not regress)
1. `sarvam-105b` **only works on `/v1`**; on `/v2` it ignores `reasoning_effort` and returns `content: null` (`finish_reason=length`).
2. Reasoning is ON by default (`low`); to disable you must send **`reasoning_effort: null` explicitly** (omitting ≠ off).
3. `model: "sarvam-vision"` on the parse pipeline returns **400 `MODEL_INVALID`** — never set `SARVAM_DOC_MODEL`.
4. `deepseekv4.1-flash-1017` produced unparseable JSON for bills — not a default.
5. Sarvam parse accepts PDF/JPEG/PNG only (WEBP falls back to OCR.Space).
6. Always keep the rule-engine fallback: AI output is zod-validated and `null`-on-failure.

## Verify quickly
```bash
npx tsc --noEmit                                  # must be 0
node scripts/reset-owner-password.js --list       # tenants + owners + 2FA flag
```
Then: upload a menu photo (onboarding / menu builder) and a bill (Settings → Bill clone);
check responses contain `ocr.provider`, `ai.provider`, `ai.model`.

---

# Hotel Rooms + Banquet (added)

## Module flags
`Restaurant.enabledModules: ("pos" | "rooms" | "banquet")[]` (default `["pos"]`).
The POS dashboard (`/dashboard`) shows a **module launcher** (`components/layout/module-launcher.tsx`): POS (current),
**Rooms → `/hotel`** and **Banquet → `/banquet`, both `target="_blank"`**. It renders only when the tenant has 2+ modules.
Gate everything through **`lib/modules.ts`**: `enabledModulesOf()` · `hasModule()` · `requireModule(tenant, "rooms")` ·
`requireModuleForTenant(restaurantId, "rooms")` (routes). Sidebar (`components/layout/app-shell.tsx`) filters nav by
module; pages `redirect("/dashboard")` when disabled; every hotel route calls `requireModuleForTenant`.
Super-admin can set modules on create (`/super-admin/tenants/new`) and edit them on `tenants/[id]`.

## Models (`models/`)
| Model | Key fields |
|---|---|
| `RoomType` | name, baseRate, maxOccupancy, amenities[], gstPercent |
| `Room` | number (unique/tenant), floor, roomTypeId, status `available\|occupied\|dirty\|maintenance` |
| `Reservation` | guestId→**Customer**, roomId, checkIn/checkOut (UTC midnight, `[in, out)`), status, source, advancePaid, holdExpiresAt, rateSnapshot, gstPercentSnapshot |
| `Folio` + `FolioCharge` | folioId, reservationId, type `room\|fnb\|extra\|tax`, amount, stayDate, orderId, postedAt |
| `HousekeepingTask` | roomId, status `pending\|in_progress\|done`, assignee |
| `Hall` | name, capacity, baseRate, setupTypes[] |
| `BanquetBooking` | hallId, date, slot `morning\|evening\|full_day`, guestCount, menuPackage{items,perPlate}, status, advancePaid, balance, holdExpiresAt |

Guests reuse `Customer` (unique `restaurantId+phone`) — extended with `idType`/`idNumber` (one CRM for POS + hotel).

## Availability (`lib/hotel/availability.ts` — single source of truth)
- `isRoomAvailable()` / `availableRoomIds()`: half-open overlap on `[checkIn, checkOut)` against `confirmed|checked_in`
  plus **unexpired** tentative holds; optional `session` for transactional reads.
- `isHallAvailable()`: `full_day` blocks both slots; other slots clash with same slot or `full_day`.
- `expireStaleHolds()` cancels expired tentatives (called on list pages).
- Create flows run **check + insert inside `withTransaction()`** (`lib/db/transaction.ts`) and fall back to a plain run on
  standalone Mongo (replica-set-only feature), so dev never breaks.

## Folio + bills (`lib/hotel/folio.ts`, `lib/hotel/bill-html.ts`)
- Check-in → `postRoomNights()` (one `room` charge per night, idempotent by stay date).
- Check-out → `postRoomNights()` catch-up + `postRoomTax()` (GST = room total × room-type %) + `settleFolio()` + pending
  housekeeping task + room `dirty`.
- `POST /api/hotel/charge-to-room` posts an `fnb` charge to the in-house reservation. POS exposes it as payment method
  **Room** (room number input); it skips `/payments` and never writes a `Payment` doc.
- `GET /api/hotel/folios/{reservationId}/bill` → 80mm consolidated bill HTML (room + F&B + GST + advance/balance).
- `GET /api/hotel/banquet-bookings/{id}/quote` → quotation HTML.

## Module sidebars
`AppShellClient` renders a persistent desktop sidebar (`lg:`) plus the mobile drawer, and **switches the nav set by
route** (`activeNavigation`):
- POS paths → full POS nav + `Hotel` / `Banquet` links.
- `/hotel`, `/rooms`, `/housekeeping` → **Hotel** nav: Overview · Rooms · Housekeeping · Setup (+ Banquet, POS).
- `/banquet` → **Banquet** nav: Calendar · Halls (+ Hotel, POS).
Nav sets are built in `components/layout/app-shell.tsx` (`navigation`, `hotelNavigation`, `banquetNavigation`).
**Modules must be read from the `Restaurant` document** (`Restaurant.findById(...).select("enabledModules")`) — the
dashboard bundle DTO does not include `enabledModules`.

## Routes
**`/hotel`** is the hotel home (sidebar entry **Hotel**): KPI row (occupancy, in-house, arrivals, departures, dirty
rooms, events 7d) + today's movements + upcoming events, with a tab bar (Overview · Rooms · Housekeeping · Banquet —
tabs filtered by enabled modules). `/hotel/rooms`, `/hotel/rooms/setup`, `/hotel/housekeeping`, `/hotel/banquet`
redirect to the screens below.

`/rooms` (calendar + reservation/check-in/out) · `/rooms/setup` (room types + rooms) · `/housekeeping` (board) ·
`/banquet` (hall × date grid, bookings, halls).
APIs: `/api/hotel/{room-types, rooms, reservations, folios, housekeeping, halls, banquet-bookings, charge-to-room}` —
all zod-validated (`lib/validators/hotel.ts`), tenant-scoped, role-checked.

## Roles
`USER_ROLES` extended with `front_desk` and `housekeeping` (additive). Allowed sets: reservations/folios →
owner, manager, front_desk (+cashier for folio reads); setup/halls → owner, manager; housekeeping board → +housekeeping.

## Seed
`npm run hotel:seed` → tenant `hotel-demo`, owner `hotel@demo.local` / `DemoPass123!`; 2 room types, 5 rooms,
2 halls, 2 guests, 2 reservations (1 in-house with a folio), 1 housekeeping task, 1 banquet booking.

## Hardening pass (Step 1 of the hotel roadmap)
**Inventory (the real double-booking guard).** `models/HotelLedger.ts` holds `RoomNight` (unique
`restaurantId+roomId+date`) and `HallSlot` (unique `restaurantId+hallId+date+slot`; `full_day` writes both
morning+evening). Reservations/bookings insert their nights/slots **inside** `withTransaction()`
(`lib/hotel/inventory.ts`); cancel / no-show / checkout release them; `isRoomAvailable`/`isHallAvailable` stay as
advisory reads for the UI. A duplicate key is mapped to `409` (`InventoryConflictError`).
`withTransaction()` now **refuses the non-transactional fallback in production** (dev still degrades gracefully).

**Money at rest is integer paise.** `lib/hotel/money.ts` (`toPaise`/`toRupees`/`percentOf`) — API responses and UI
still speak rupees; only the DB and `lib/hotel/*` use paise. `FolioCharge.amountPaise` + `taxPaise` + `taxPercent`.

**Ledger.** `HotelPayment` (`amountPaise`, `method`, `type` advance|payment|refund, `reference`, `createdBy`,
optional `idempotencyKey` unique per tenant). Folio balance = charges − net collected. Routes:
`POST/GET /api/hotel/payments`. `reservation.advancePaid` is now a **paise cache** for list display, not the ledger.

**GST per night.** `lib/hotel/tax.ts` picks the slab from `Restaurant.settings.gstSlabs`
(`[{ uptoPaise, percent }]`, defaults ₹7,500 → 12% / above → 18%; *verify against current law*). Each room-night
charge stores its own `taxPaise`/`taxPercent` so a stay that crosses a slab boundary is taxed correctly.

**Invoices.** `InvoiceCounter` (tenant + scope + financial year) with atomic `$inc`; `lib/hotel/invoice.ts`
allocates inside the checkout transaction → `INV/2026-27/00001`. Stored on `Folio.invoiceNumber` (unique per tenant).

**Checkout gate.** Blocked with `409 Folio balance is X` while the balance is > 0; a manager can pass
`{ "override": true }` (owner/manager only). The whole transition — status, inventory release, charges, invoice,
folio settle, room status, housekeeping task — is one transaction, so a refusal changes nothing.

**Other.** Guest phone is optional (`Customer.phone` partial-unique); responses mask phone/ID for every role except
owner/manager (`lib/hotel/mask.ts`). Hold expiry moved to a cron route:
`GET /api/hotel/cron/expire-holds` (header `x-cron-secret` or `?secret=`, env `HOTEL_CRON_SECRET`; no secret → 503).
Every reservation/payment/folio change writes an `AuditLog` row (`lib/hotel/audit.ts`, never blocks).

**Tests:** `npm test` → `node --test --experimental-strip-types tests/hotel.test.ts` (11 pure tests: money, dates,
same-day turnover, per-night slabs, cancellation/refund math, invoice numbering). `tests/` is excluded from `tsc`.

## Steps 2–7 (built on top of the hardening pass)

**Front desk (Step 2).** `lib/hotel/booking.ts` is the only creation path (single, group, public) — it prices the
stay, upserts the guest, claims inventory and ledgers the advance. `PATCH /api/hotel/reservations/[id]` now also
accepts `move` (remaining nights re-priced, future room charges re-posted), `extend` (new check-out, extra nights
quoted), `waiveFees`, and applies the **cancellation policy** (`lib/hotel/cancellation.ts`) on cancel/no-show with a
`refund` row in `HotelPayment`. `PUT` edits guest/pax/notes. Early check-in and late check-out fees post as `extra`
charges from `settings.earlyCheckInFeePaise` / `lateCheckOutFeePaise`. Group bookings:
`POST /api/hotel/reservations/group` (`folioMode: "single"` → `folioReservationId` puts every room on one folio).
Guests: `GET/POST /api/hotel/guests`, `GET /api/hotel/guests/[id]` (stay history, lifetime value).

**Rates (Step 3).** `RatePlan` (room type, date range, weekdays, extra adult/child, meal plan EP/CP/MAP/AP,
discount code + %, min nights, priority) + `lib/hotel/rates.ts` (`quoteStay`). Every night is priced independently
and `RoomNight.ratePaise` holds the final nightly tariff. Quote endpoint: `POST /api/hotel/quote` (staff) — the
public page uses the same engine. Rate-plan CRUD: `/api/hotel/rate-plans` (+`/import`).

**Public booking + payments (Step 4).** `/book/[slug]` → `GET /api/public/[slug]/availability`,
`POST /api/public/[slug]/book` (20-minute tentative hold + Razorpay order), `POST /api/public/[slug]/verify`
(signature check → `confirmed` + ledger row), `POST /api/webhooks/razorpay` (raw-body signature, idempotent per
payment id). Without Razorpay keys the page books pay-at-hotel. Public endpoints are rate-limited per IP and every
query is scoped by the slug's tenant.

**Reports + night audit (Step 5).** `GET /api/hotel/reports` (+`?format=csv`) → occupancy %, ADR, RevPAR, revenue by
day/source/type, payments by method, arrivals/departures/no-shows/cancellations. `GET/POST /api/hotel/night-audit`
posts missing room charges for in-house stays, then writes a locked `BusinessDate` (totals + cash per user); a second
close of the same date is refused.

**Banquet completeness (Step 6).** Booking money is **paise** (`hallRatePaise`, `subtotalPaise`, `gstPaise`,
`totalAmountPaise`), add-ons live on the booking, GST is configurable per event, cancellation refunds go through
`HotelPayment` (booking-scoped), and `GET /api/hotel/banquet-bookings/[id]/document?doc=quotation|invoice|run_sheet`
renders the printable documents (invoice numbers share the `banquet` series).

**Messaging + AI + maintenance (Step 7).** `lib/messaging/index.ts` (WhatsApp Cloud API → SMS fallback, silent no-op
without keys) fires on booking/payment events. `POST /api/hotel/guests/scan` prefills a guest from an ID photo and
`POST /api/hotel/rate-plans/import` turns a rate card into plans (both OCR → `chatJson`, zod-validated,
`null` on failure, manual entry unchanged). `MaintenanceTicket` + `/api/hotel/maintenance`: an open ticket sets the
room to `maintenance`, booking a maintenance room is refused, and closing the last ticket frees the room.

## Screens added
`/rates` (plans + rate-card import) · `/maintenance` (tickets) · `/reports` (KPIs, daily table, CSV, night-audit
close) · `/book/[slug]` (public) — all in the hotel sidebar.

## Not built yet
Split payments at checkout (multiple rows already supported by the ledger) · seasonal rate calendar UI · public
banquet enquiries · per-user shift reconciliation beyond cash totals.


## Gotchas (hotel)
1. Dates are **UTC midnight date-only**; display uses the property timezone. Never store local-time Dates.
2. `Reservation.guestId` points at `Customer`, not a new Guest collection.
3. Check-in/out must stay in one transaction with the availability check — don't split the guard from the insert.
4. `reasoning_effort`/Sarvam rules still apply (see above); AI helpers are untouched by these modules.
5. Rooms/Banquet-only tenants skip `/onboarding` (gate is `pos`-module scoped). Keep it that way or they loop.
6. Room charges are idempotent per night (`stayDate`); re-running check-in must not double-bill.
7. Never trust `isRoomAvailable` alone — the `RoomNight`/`HallSlot` unique index is the guard; keep both in one transaction.
8. Money in the DB is **paise**; convert only at the API/UI edge (`toRupees`). Do not add rupee fields.
9. After changing a model, **restart `npm run dev`**: `models.X || model(...)` keeps the old compiled schema, so new
   fields are silently dropped by strict mode (this cost a debugging round on `Folio.invoiceNumber`).
10. `npm run hotel:seed` also performs the light index migration (drops the old required-unique customer phone index,
    creates the inventory/invoice partial-unique indexes) — run it once on any existing database.

