# ShadowMarket - Project Status Tracker

> **Current Phase**: Milestone 3 Completed (Supabase Integration, Database Schema, RLS Security & Authentication)  
> **Status**: Ready for Owner Verification & SQL Run  
> **Next Phase**: Milestone 4 (Shopping Cart & Order Management Pipeline)

---

## 1. Milestone Progress Overview

| Milestone | Phase Name | Status | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **M1** | **Foundations, Skills & Roadmap** | **COMPLETED** | Environment inspection, 10 specialized skills, project rules & anti-cheat bans, architecture & roadmap docs. |
| **M2** | **Storefront & UI Design System** | **COMPLETED** | Next.js App Router, Tailwind CSS Cyber-Industrial theme, 5 responsive pages, shared design system, sandbox preview. |
| **M3** | **Database & Authentication** | **COMPLETED** | Supabase connected (Singapore `sin1`), AES-256-GCM engine tested, RLS SQL migration, login & register pages with Server Actions. |
| **M4** | **Cart & Order Management Pipeline** | *Pending Approval* | Cart synchronization, checkout form with Zod validation, order state machine, stock concurrency controls. |
| **M5** | **Procurement & Batch Key Encryption** | *Upcoming* | AES-256-GCM encryption service, batch key importer, manual procurement queue for on-demand licenses. |
| **M6** | **Payment Sandbox & Webhooks** | *Upcoming* | Payment sandbox simulator (Test cards & Mock PromptPay QR), idempotent webhook handler with HMAC signatures. |
| **M7** | **Secure License Delivery** | *Upcoming* | Order history view, obfuscated key reveal UI, copy-to-clipboard, PDF invoice, key reveal audit logs. |
| **M8** | **Testing & Security Audit** | *Upcoming* | Vitest unit/integration tests, concurrency tests (anti-overselling), Playwright E2E smoke test, OWASP Top 10 audit. |
| **M9** | **Production Deployment & Launch** | *Upcoming* | Vercel production hosting, domain DNS & SSL, final verification, owner sign-off and public launch. |

---

## 2. Milestone 3 Detailed Achievements

- [x] **Supabase Project Connected**:
  - Region: Singapore (`ap-southeast-1` / `sin1`) for ultra-low latency in Thailand.
  - Project URL: `https://nsmsrmxwrzjvwgqczcfh.supabase.co`.
  - Client SDKs `@supabase/supabase-js` and `@supabase/ssr` installed.
- [x] **Zero Secret Leakage Protection**:
  - All keys strictly isolated in `.env.local` (ignored by Git via `.gitignore`).
  - Generated 64-character (32-byte) hex key for `LICENSE_ENCRYPTION_KEY`.
- [x] **Database Schema & Strict RLS Architecture**:
  - Complete SQL migration script created in `supabase/migrations/001_initial_schema.sql`.
  - Tables defined: `profiles`, `categories`, `products`, `license_keys`, `orders`, `order_items`, `audit_logs`.
  - Row Level Security (RLS) active on 100% of tables.
  - Customers have ZERO direct SELECT on `license_keys` (decrypted only via authenticated Server Action).
  - PostgreSQL trigger `on_auth_user_created` automatically creates profile row on user registration.
- [x] **Authentication Pages & Workflows**:
  - `src/actions/auth.ts`: Server Actions for `loginAction`, `signupAction`, `signoutAction`, and `getUserAction`.
  - `src/app/(auth)/login/page.tsx`: Cyber-Industrial login screen with error handling and SSL security badge.
  - `src/app/(auth)/register/page.tsx`: Registration screen with password confirmation and automatic trigger sync.
  - `src/components/layout/Navbar.tsx`: Live auth state detection with user email badge and Sign Out button.
- [x] **Cryptographic Verification**:
  - Verified AES-256-GCM encryption and decryption round-trip via `scripts/verify_supabase.mjs` (100% pass).
  - Verified Supabase admin connection to auth and database API.
- [x] **Build Verification**:
  - `npm run build` passed with zero errors for all 9 routes.

---

## 3. Next Steps (Upon Owner SQL Execution & Approval)

Once the owner runs the migration script in Supabase SQL Editor and approves:
1. Proceed to **Milestone 4 (Shopping Cart & Order Management Pipeline)**:
   - Connect frontend cart and catalog directly to Supabase products table.
   - Enforce atomic key reservation (`FOR UPDATE SKIP LOCKED`) during checkout.
   - Transition order status through state machine (`pending` -> `paid` -> `completed`).
