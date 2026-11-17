# ShadowMarket - Project Status Tracker

> **Current Phase**: Milestone 6 Completed (Payment Sandbox & Webhooks Lifecycle)  
> **Status**: Ready for Owner Review & Approval  
> **Next Phase**: Milestone 7 (Secure License Delivery & Customer Vault Decryption)

---

## 1. Milestone Progress Overview

| Milestone | Phase Name | Status | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **M1** | **Foundations, Skills & Roadmap** | **COMPLETED** | Environment inspection, 10 specialized skills, project rules & anti-cheat bans, architecture & roadmap docs. |
| **M2** | **Storefront & UI Design System** | **COMPLETED** | Next.js App Router, Tailwind CSS Cyber-Industrial theme, 5 responsive pages, shared design system, sandbox preview. |
| **M3** | **Database & Authentication** | **COMPLETED** | Supabase connected (Singapore `sin1`), AES-256-GCM engine tested, RLS SQL migration executed, login/register with triggers. |
| **M4** | **Cart & Order Management Pipeline** | **COMPLETED** | Server Actions with Zod validation, PostgreSQL orders & order_items tables, atomic stock deduction, `/orders` & `/orders/[id]` receipts. |
| **M5** | **Procurement & Batch Key Encryption** | **COMPLETED** | AES-256-GCM military-grade encryption, SHA-256 duplicate collision detection, Admin Procurement Dashboard (`/admin/procurement`), Key Vault inventory, Manual Fulfillment Queue. |
| **M6** | **Payment Sandbox & Webhooks** | **COMPLETED** | Payment sandbox simulator (Test cards & Mock PromptPay QR), cryptographic HMAC-SHA256 signature verification, idempotent webhook route handler (`/api/webhooks/payment`), automated FIFO license key allocation from vault. |
| **M7** | **Secure License Delivery** | *Pending Approval* | Authenticated key reveal with decryption Server Action, copy-to-clipboard, printable official invoice view, license view audit logging. |
| **M8** | **Testing & Security Audit** | *Upcoming* | Vitest unit/integration tests, concurrency tests (anti-overselling), Playwright E2E smoke test, OWASP Top 10 audit. |
| **M9** | **Production Deployment & Launch** | *Upcoming* | Vercel production hosting, domain DNS & SSL, final verification, owner sign-off and public launch. |

---

## 2. Milestone 6 Detailed Achievements

- [x] **Cryptographic Webhook Signature Verification (`src/lib/payments/webhook-crypto.ts`)**:
  - Implemented `signWebhookPayload` using `HMAC-SHA256`.
  - Implemented `verifyWebhookSignature` using `crypto.timingSafeEqual` to prevent timing attack vulnerabilities.
  - Zero financial risk: `PAYMENT_SANDBOX_MODE=true` with no real bank accounts or credentials requested.
- [x] **Secure Webhook Route Handler (`src/app/api/webhooks/payment/route.ts`)**:
  - Dynamic route handler accepting cryptographically signed payment events (`x-shadowmarket-signature` or `stripe-signature`).
  - Rejects tampered or unauthenticated signatures with `400 Bad Request`.
  - **Idempotency Protection**: Checks `audit_logs` where `action = 'payment.webhook_processed'` and `details->>'eventId' = eventId`. Duplicate requests are recognized and acknowledged safely without duplicate fulfillment.
  - Transitions order status to `paid`.
- [x] **Automated Vault License Allocation (`src/lib/services/fulfillment.ts`)**:
  - Implements FIFO (First In, First Out) atomic key allocation from the `license_keys` vault.
  - Claims available key: updates status to `assigned`, links `order_id` and `user_id`.
  - Links assigned key to `order_items` record.
  - If all items have keys: transitions order status to `completed`.
  - If vault is out of stock for any item: transitions order status to `processing_fulfillment` so it appears in the Owner's Manual Fulfillment Queue.
- [x] **Interactive Sandbox Payment Modal (`src/components/shop/SandboxPaymentModal.tsx`)**:
  - Tab 1: **Thai PromptPay QR Sandbox**: Cyber-Industrial QR code display, merchant name (`SHADOWMARKET CO., LTD.`), amount in THB, 15-minute countdown timer, simulate payment button.
  - Tab 2: **Test Card (Stripe)**: Pre-filled test credentials (`4242 4242 4242 4242`, `12/28`, `888`), PCI-DSS notice.
  - Real-time Webhook trigger with instant key allocation feedback.
- [x] **Order Receipt Integration (`src/app/orders/[id]/page.tsx` & `src/app/checkout/page.tsx`)**:
  - Customers can simulate payment directly during checkout or from their order ledger `/orders/[id]` when an order is in `pending` status.
  - Orders transitioning through `processing_fulfillment` display a dedicated status banner.
- [x] **Automated Test Verification**:
  - All 6 lifecycle tests in `scripts/test_payment_lifecycle.mjs` passed 100% against live Supabase PostgreSQL:
    1. Found available vault key.
    2. Created pending order.
    3. Rejected invalid HMAC signature with 400 Bad Request.
    4. Accepted valid HMAC signature and triggered webhook.
    5. Order transitioned to `completed` and key assigned atomically.
    6. Verified idempotency protection on duplicate webhook delivery.
- [x] **Build Verification**:
  - `npm run build` compiled 100% cleanly for all 12 routes.

---

## 3. Next Steps (Milestone 7: Secure License Delivery & Customer Vault Decryption)

Upon store owner approval, we will proceed to **Milestone 7**:
1. Implement the **Authenticated License Decryption Server Action** (`redeemLicenseKeyAction`) which decrypts keys *only* after authenticating order ownership.
2. Build the **Interactive Key Reveal UI** on `/orders/[id]` with masking, 1-click reveal, copy-to-clipboard, and software activation instructions.
3. Add **Audit Logging** (`license.viewed`) each time a customer reveals a license key for fraud detection.
4. Build the **Printable Official Digital Invoice** (Clean invoice layout for printing or saving as PDF).
