# ShadowMarket - Project Status Tracker

> **Current Phase**: Milestone 4 Completed (Cart & Order Management Pipeline)  
> **Status**: Ready for Owner Review & Approval  
> **Next Phase**: Milestone 5 (Procurement & Batch Key Encryption Management)

---

## 1. Milestone Progress Overview

| Milestone | Phase Name | Status | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **M1** | **Foundations, Skills & Roadmap** | **COMPLETED** | Environment inspection, 10 specialized skills, project rules & anti-cheat bans, architecture & roadmap docs. |
| **M2** | **Storefront & UI Design System** | **COMPLETED** | Next.js App Router, Tailwind CSS Cyber-Industrial theme, 5 responsive pages, shared design system, sandbox preview. |
| **M3** | **Database & Authentication** | **COMPLETED** | Supabase connected (Singapore `sin1`), AES-256-GCM engine tested, RLS SQL migration executed, login/register with triggers. |
| **M4** | **Cart & Order Management Pipeline** | **COMPLETED** | Server Actions with Zod validation, PostgreSQL orders & order_items tables, atomic stock deduction, `/orders` & `/orders/[id]` receipts. |
| **M5** | **Procurement & Batch Key Encryption** | *Pending Approval* | AES-256-GCM key ingestion, batch importer with SHA-256 duplicate checks, admin procurement queue for on-demand licenses. |
| **M6** | **Payment Sandbox & Webhooks** | *Upcoming* | Payment sandbox simulator (Test cards & Mock PromptPay QR), idempotent webhook handler with HMAC signatures. |
| **M7** | **Secure License Delivery** | *Upcoming* | Order history view, obfuscated key reveal UI, copy-to-clipboard, PDF invoice, key reveal audit logs. |
| **M8** | **Testing & Security Audit** | *Upcoming* | Vitest unit/integration tests, concurrency tests (anti-overselling), Playwright E2E smoke test, OWASP Top 10 audit. |
| **M9** | **Production Deployment & Launch** | *Upcoming* | Vercel production hosting, domain DNS & SSL, final verification, owner sign-off and public launch. |

---

## 2. Milestone 4 Detailed Achievements

- [x] **End-to-End Database Order Integration**:
  - `src/actions/orders.ts`: Implemented `createOrderAction` with strict Zod validation.
  - Prices calculated exclusively from Supabase PostgreSQL (client-side prices completely ignored).
  - Orders inserted into `orders` table (status: `pending`).
  - Items inserted into `order_items` table with historical snapshot of product title and price.
- [x] **Atomic Inventory Deduction**:
  - Stock quantity safely decremented in database to prevent overselling.
- [x] **Customer Order Tracking & Receipt Views**:
  - `src/app/orders/page.tsx`: Order ledger displaying customer order history with status pills and timestamps.
  - `src/app/orders/[id]/page.tsx`: Official digital invoice and receipt view with itemized pricing, customer email, and encrypted license vault display.
- [x] **Live Database Verification**:
  - Successfully created real test order `#186e26e0-a1fa-4ab1-8247-8852d0ae2c92` for `vip-customer@shadowmarket.local` (amount: ฿1,290) verified directly inside Supabase PostgreSQL!
- [x] **Build Verification**:
  - `npm run build` passed with zero errors for all 10 routes.

---

## 3. Next Steps (Upon Owner Approval)

Once approved by the store owner, we will proceed to **Milestone 5 (Procurement & Batch Key Encryption)**:
1. Implement the Store Owner's **Admin Procurement Dashboard** (`/admin/procurement`).
2. Build the **Batch Key Ingestion Engine** (CSV / Text bulk import) with SHA-256 duplicate collision detection.
3. Encrypt all imported license keys using **AES-256-GCM** before saving to `license_keys` table.
4. Build the **Manual Procurement Queue** for on-demand software licenses (e.g., AWS credits).
