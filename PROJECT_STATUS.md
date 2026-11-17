# ShadowMarket - Project Status Tracker

> **Current Phase**: Milestone 5 Completed (Procurement & Batch Key Encryption Management)  
> **Status**: Ready for Owner Review & Approval  
> **Next Phase**: Milestone 6 (Payment Sandbox & Webhook Lifecycle)

---

## 1. Milestone Progress Overview

| Milestone | Phase Name | Status | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **M1** | **Foundations, Skills & Roadmap** | **COMPLETED** | Environment inspection, 10 specialized skills, project rules & anti-cheat bans, architecture & roadmap docs. |
| **M2** | **Storefront & UI Design System** | **COMPLETED** | Next.js App Router, Tailwind CSS Cyber-Industrial theme, 5 responsive pages, shared design system, sandbox preview. |
| **M3** | **Database & Authentication** | **COMPLETED** | Supabase connected (Singapore `sin1`), AES-256-GCM engine tested, RLS SQL migration executed, login/register with triggers. |
| **M4** | **Cart & Order Management Pipeline** | **COMPLETED** | Server Actions with Zod validation, PostgreSQL orders & order_items tables, atomic stock deduction, `/orders` & `/orders/[id]` receipts. |
| **M5** | **Procurement & Batch Key Encryption** | **COMPLETED** | AES-256-GCM military-grade encryption, SHA-256 duplicate collision detection, Admin Procurement Dashboard (`/admin/procurement`), Key Vault inventory, Manual Fulfillment Queue. |
| **M6** | **Payment Sandbox & Webhooks** | *Pending Approval* | Payment sandbox simulator (Test cards & Mock PromptPay QR), idempotent webhook handler with HMAC signatures. |
| **M7** | **Secure License Delivery** | *Upcoming* | Order history view, obfuscated key reveal UI, copy-to-clipboard, PDF invoice, key reveal audit logs. |
| **M8** | **Testing & Security Audit** | *Upcoming* | Vitest unit/integration tests, concurrency tests (anti-overselling), Playwright E2E smoke test, OWASP Top 10 audit. |
| **M9** | **Production Deployment & Launch** | *Upcoming* | Vercel production hosting, domain DNS & SSL, final verification, owner sign-off and public launch. |

---

## 2. Milestone 5 Detailed Achievements

- [x] **AES-256-GCM Encryption Engine (`src/lib/crypto/license-crypto.ts`)**:
  - Implemented 256-bit military-grade encryption with 96-bit random IV and 128-bit authentication tag (`auth_tag`).
  - Implemented SHA-256 key hashing for zero-plaintext duplicate detection.
  - Zero plaintext at rest: direct database inspection yields only cryptographic ciphertext.
- [x] **Procurement Server Actions (`src/actions/procurement.ts`)**:
  - `importBatchKeysAction`: Validates product, normalizes keys, detects duplicate hashes, encrypts new keys, inserts to `license_keys`, atomically updates product stock, and records `audit_logs`.
  - `getLicenseInventoryAction`: Queries masked key inventory with supplier, cost, and batch metadata.
  - `getManualFulfillmentQueueAction`: Retrieves pending/unfulfilled orders requiring custom license procurement.
  - `fulfillManualOrderAction`: Securely fulfills a pending order with encrypted key, updates order to `completed`, and records audit trail.
- [x] **Admin Procurement Command Dashboard (`/admin/procurement`)**:
  - **Tab 1: นำเข้าคีย์เป็นชุด (Batch Key Ingestion)**: Bulk textarea input, product selector, supplier and cost tracking, automatic batch code generator, real-time success & duplicate rejection feedback.
  - **Tab 2: คลังคีย์นิรภัย (Key Vault Inventory)**: Real-time stock counts, total vault asset value, masked keys (`••••-••••-••••-XXXX`), status filters (`available`, `assigned`, `redeemed`).
  - **Tab 3: คิวจัดซื้อตามสั่ง (Manual Fulfillment Queue)**: Direct customer fulfillment modal with strict legal compliance affirmation checkbox (No Cheats / No Hacks).
- [x] **Navigation & Access**:
  - Added dedicated Admin Procurement button (`คลังคีย์ Admin`) in both Desktop Navbar and Mobile Drawer.
- [x] **Live Database & Cryptographic Verification**:
  - Automated tests verified: 3 keys inserted with AES-256-GCM, sample record in PostgreSQL verified, SHA-256 collision successfully rejected duplicates, decryption integrity confirmed 100% exact match, atomic stock updated, and audit log recorded.
- [x] **Build & Responsive Verification**:
  - `npm run build` compiled 100% cleanly for all 11 routes.
  - Responsive layouts verified on Desktop (1280px) and Mobile (390px).

---

## 3. Next Steps (Milestone 6: Payment Sandbox & Webhooks)

Upon store owner approval, we will proceed to **Milestone 6**:
1. Implement the **Payment Sandbox Simulator** for Mock PromptPay QR code generation and Stripe Test Mode cards.
2. Build the **Secure Webhook Handler** (`/api/webhooks/payment`) with HMAC signature verification.
3. Implement **Idempotency Protection** to prevent double-charging or double-fulfillment on duplicate webhook events.
4. Automatically allocate an available encrypted license key from the vault to the order upon payment confirmation.
