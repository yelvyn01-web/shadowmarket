# ShadowMarket - System Architecture Blueprint

This document specifies the technical architecture, data model, security design, and operational workflows for **ShadowMarket** — a secure digital product license reselling platform.

---

## 1. High-Level System Architecture

```text
               +-------------------------------------------------------+
               |                  Storefront & UI                      |
               |          (Next.js App Router, Tailwind CSS)           |
               +-------------------------------------------------------+
                     | (Client-side)                       | (Server Actions)
                     v                                     v
+-----------------------------+               +----------------------------------+
|  Customer Browser           |               |   Next.js Server Runtime (Node)   |
|  - Catalog & Search         |               |   - Zod Schema Validation        |
|  - Cart & Checkout          |               |   - AES-256-GCM Key Encryption   |
|  - Key Reveal & Copy UI     |               |   - Session Auth Guard           |
+-----------------------------+               |   - Rate Limiting & Audit Logger |
                                              +----------------------------------+
                                                    | (Server-to-DB)
                                                    v
+--------------------------------------------------------------------------------+
|                         Supabase Cloud Infrastructure                          |
|  +--------------------+   +-----------------------+   +---------------------+  |
|  |   Supabase Auth    |   | PostgreSQL Database   |   | Supabase Storage    |  |
|  | - Email / Password |   | - Row Level Security  |   | - Product Icons     |  |
|  | - Session JWTs     |   | - Atomic Key Locks    |   | - Invoices & Assets |  |
|  +--------------------+   +-----------------------+   +---------------------+  |
+--------------------------------------------------------------------------------+
                                       ^
                                       | Server Webhook
+--------------------------------------+-----------------------------------------+
| Payment Gateway (Sandbox / Live)                                               |
| - Stripe Checkout (Credit/Debit Card)                                          |
| - PromptPay QR Simulation                                                      |
+--------------------------------------------------------------------------------+
```

---

## 2. Core Security & Encryption Architecture

### 2.1 Digital License Key Protection (At-Rest & In-Flight)
1. **Never Plaintext in DB**:
   - Every digital license key is encrypted with **AES-256-GCM** before database insertion.
   - Database stores: `ciphertext`, `iv` (12 bytes Base64), and `auth_tag` (16 bytes Base64).
   - Database also stores `key_hash` (SHA-256) used strictly to prevent duplicate key ingestion without decrypting existing keys.
2. **Access Isolation**:
   - Regular customers have **ZERO SELECT permissions** on the `license_keys` table.
   - Decryption occurs only in a secure, authenticated Server Action after validating:
     1. User is authenticated.
     2. User owns the specific order (`order.user_id === user.id`).
     3. Order status is `paid` or `completed`.
   - Admin operations (batch import, key revoking) are gated by Supabase RLS checking `profiles.role = 'admin'`.

### 2.2 Payment Integrity & Idempotency
1. **Cryptographic Webhook Verification**:
   - Webhook calls are cryptographically validated against `STRIPE_WEBHOOK_SECRET` using raw request bodies.
2. **Idempotency Protection**:
   - All processed webhook `event.id` entries are logged in the `audit_logs` table.
   - Duplicate webhook deliveries are acknowledged safely without re-crediting or re-assigning keys.

---

## 3. Database Schema Overview

```text
+------------------+         +--------------------+         +-------------------+
|     profiles     | 1     * |       orders       | 1     * |    order_items    |
|------------------|---------|--------------------|---------|-------------------|
| id (UUID, PK)    |         | id (UUID, PK)      |         | id (UUID, PK)     |
| full_name        |         | user_id (FK)       |         | order_id (FK)     |
| role ('admin'|   |         | status             |         | product_id (FK)   |
|       'customer')|         | total_amount       |         | license_key_id(FK)|
+------------------+         | payment_method     |         | unit_price        |
                             +--------------------+         +-------------------+
                                                                      | 1
                                                                      |
                                                                      | 1
+------------------+ 1     * +--------------------+ 1     * +-------------------+
|    categories    |---------|      products      |---------|   license_keys    |
|------------------|         |--------------------|         |-------------------|
| id (UUID, PK)    |         | id (UUID, PK)      |         | id (UUID, PK)     |
| name             |         | category_id (FK)   |         | product_id (FK)   |
| slug             |         | title, slug        |         | key_hash (UNIQUE) |
+------------------+         | fulfillment_type   |         | ciphertext        |
                             | ('instant'|'manual')         | iv, auth_tag      |
                             | base_price, stock  |         | status            |
                             +--------------------+         +-------------------+
```

---

## 4. Key Workflows

### 4.1 Automated Instant License Order
1. Customer selects in-stock automated license product and completes checkout.
2. Payment gateway processes transaction and dispatches webhook.
3. Webhook handler verifies signature, transitions order to `paid`.
4. Atomic database function reserves oldest available key (`FOR UPDATE SKIP LOCKED`) and links to `order_item`.
5. Customer order page displays order receipt and provides "Reveal Key" button.
6. Customer clicks "Reveal Key" -> Server Action decrypts and displays key.

### 4.2 Manual Procurement & Fulfillment Order
1. Customer purchases specialized license marked `fulfillment_type: 'manual'`.
2. Payment verified -> order status set to `processing_fulfillment`.
3. Order appears on Store Owner's Procurement Dashboard with customer details and required license SKU.
4. Store Owner acquires the authorized license from official distributor.
5. Store Owner pastes license key into secure fulfillment modal in Admin Dashboard.
6. Server encrypts key with AES-256-GCM, assigns it to order item, and marks order `completed`.
7. Customer receives notification and accesses license key.

---

## 5. Technology Stack & Tools

- **Frontend & App Framework**: Next.js 15+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons), Radix UI (Primitives)
- **Backend & Database**: Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security)
- **Encryption**: Node.js `crypto` (AES-256-GCM, SHA-256)
- **Validation**: Zod
- **Testing**: Vitest, Playwright E2E
- **Deployment**: Vercel & GitHub Actions CI/CD
