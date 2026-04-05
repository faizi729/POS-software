You are a senior product engineer and UI/UX designer.

Your task is to help me PLAN and EXECUTE a modern restaurant POS system (SaaS-ready, multi-tenant) using Next.js (App Router), Tailwind CSS, and MongoDB.

IMPORTANT:

- Do NOT give generic answers
- Do NOT skip structure
- Think like a production-level system designer

---

## OBJECTIVE

Build a clean, fast, and modern POS system with:

- Menu management
- Order creation and tracking
- Payment handling
- Dashboard with daily stats

Later phases will include:

- Website ordering
- WhatsApp integration

---

# PHASE 1: SYSTEM PLANNING

Break down the system into:

### 1. Core Modules

- Menu
- Orders
- Payments
- Dashboard

### 2. Data Models (MongoDB)

Design optimized schemas for:

- Restaurant
- Menu Items
- Orders
- Users

Include:

- relationships
- indexing suggestions
- scalability considerations

---

### 3. API Design (Next.js App Router)

Define RESTful APIs:

- clean naming
- proper structure
- validation logic

---

### 4. Folder Structure

Give a clean scalable structure like:

- /app
- /dashboard
- /menu
- /orders
- /components
- /lib
- /models
- /api

Explain why each folder exists.

---

# PHASE 2: UI/UX DESIGN

Design a non-generic, modern interface.

## Design Rules

- Clean spacing with an 8px grid system
- Proper typography hierarchy
- Balanced line height and letter spacing
- Consistent padding and margins
- Professional color palette

---

## Typography System

Define:

- font family
- heading sizes
- body sizes
- line heights
- letter spacing

Examples:

- H1, H2, H3
- body
- labels

---

## UI Components

Design reusable components:

- Button
- Card
- Table
- Input
- Modal
- Badge

Each must include:

- spacing
- hover states
- active states

---

## Layout Design

Create layouts for:

### 1. Dashboard

- KPI cards
- clean grid
- minimal clutter

### 2. Order Screen

- fast interaction
- item selection panel
- cart panel
- sticky total section

### 3. Menu Management

- table and grid view
- quick add and edit

---

# PHASE 3: EXECUTION PLAN

Give a step-by-step build plan:

### Step 1

Setup project

### Step 2

Database models

### Step 3

Menu APIs

### Step 4

Order system

### Step 5

UI integration

### Step 6

Payment integration

For each step include:

- what to build
- why it matters
- expected output

---

# PERFORMANCE AND UX

- Fast loading UI
- Minimal re-renders
- Good state management
- Smooth interactions

---

# FINAL RULES

- Think like a SaaS product, not a college project
- Prioritize simplicity and speed
- Avoid overengineering
- Make the UI feel premium

---

# Implementation Status

## Implemented

### Core Modules

- Menu management page with live list, search, quick add, and availability toggle
- Order creation flow with cart state, category filtering, totals, and payment submission
- Payment listing and payment creation routes
- Dashboard with KPI cards, top items, payment mix, and recent orders

### Data Layer

- Mongo connection helper is implemented
- Mongoose models exist for Restaurant, User, MenuCategory, MenuItem, Order, and Payment
- Seed bootstrap creates a restaurant, owner user, categories, menu items, sample orders, and payments when the database is empty
- Shared Mongo repository powers the app pages and APIs

### API Surface

- GET and POST `/api/menu/categories`
- GET and POST `/api/menu/items`
- POST `/api/menu/items/[id]/toggle-availability`
- GET and POST `/api/orders`
- POST `/api/orders/[id]/submit`
- POST `/api/orders/[id]/cancel`
- POST `/api/orders/[id]/payments`
- GET and POST `/api/payments`
- GET `/api/dashboard/summary`

### UI System

- Reusable Button, Card, Table, Input, Modal, and Badge components
- Premium dashboard shell and layout
- Menu, Orders, Payments, and Login screens
- Typography, spacing, and color tokens in the global design layer

## Partially Implemented

### SaaS and Auth

- Session utility exists
- Role utility exists
- Current auth is still seeded and simplified, not production authentication

### Mongo Product Depth

- CRUD backbone is connected to Mongo
- Full edit flows, archival behavior, advanced querying, and audit logging are still pending

### POS Depth

- Basic order and payment flow works
- Split payments, modifiers, notes, kitchen workflow, refunds, and richer status transitions are still pending

## Not Implemented Yet

- Website ordering
- WhatsApp integration
- Inventory linkage
- Billing and subscription layer
- Advanced analytics and exports
- Kitchen display system

## Current Verification State

- Dependencies installed
- `npm run typecheck` passes
- The app now targets Mongo-backed repositories instead of file-based demo storage
- Production build was not part of the latest verification pass
