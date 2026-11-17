# ShadowMarket - Master Project Roadmap

This roadmap outlines the systematic phase-by-phase development of **ShadowMarket**.
Development proceeds strictly **one milestone at a time**. Each milestone requires owner review and sign-off before commencing the next phase.

---

## Milestone Breakdown & Timeline

```text
[Milestone 1: Foundations & Architecture] (CURRENT - COMPLETED)
  - Environment Inspection & Node/Git Verification
  - Specialized Workspace Skills (10 Areas)
  - Project Governance Rules (Safety, Anti-Cheat Prohibitions, Non-technical guidelines)
  - System Architecture & Master Roadmap
            |
            v  (Owner Approval Needed)
[Milestone 2: Storefront & UI Design System]
  - Next.js App Router Initialization
  - Tailwind CSS Cyberpunk/Modern High-Tech Theme
  - Responsive Catalog Grid, Product Cards, Key Obfuscation UI
  - Mobile-First Layout & Accessibility
            |
            v
[Milestone 3: Database & Authentication (Supabase)]
  - PostgreSQL Schema Migrations
  - Row Level Security (RLS) on all tables
  - Supabase Auth (Sign Up, Sign In, Profile Sync Triggers)
  - Role-based Access Control (Admin vs Customer)
            |
            v
[Milestone 4: Shopping Cart & Order Management Pipeline]
  - Client-side & Authenticated Cart Sync
  - Checkout Form with Zod Validation
  - Order State Machine (Pending -> Paid -> Fulfilled)
  - Concurrency & Stock Deduction Safeguards
            |
            v
[Milestone 5: License Procurement & Batch Key Encryption Service]
  - AES-256-GCM Encryption Service
  - Batch Key Importer with SHA-256 Duplicate Detection
  - Store Owner Manual Procurement Queue
  - Stock Threshold Alerts
            |
            v
[Milestone 6: Payment Sandbox & Idempotent Webhook Verification]
  - Payment Sandbox Simulator (Test Cards & Mock PromptPay QR)
  - Webhook Route Handler with HMAC Signature Verification
  - Idempotency & Replay Attack Protection
            |
            v
[Milestone 7: Secure License Delivery & Customer Dashboard]
  - Customer Order History & Receipt Generation
  - Secure "Click to Reveal" Key Interaction
  - One-click Copy with Clipboard Feedback
  - Audit Logging for Key Revelations
            |
            v
[Milestone 8: Comprehensive Testing & Security Audit]
  - Vitest Unit & Integration Tests (Encryption, Schemas, Pricing)
  - Concurrency Testing (Zero overselling during flash checkout)
  - Playwright E2E User Journey Smoke Tests
  - OWASP Top 10 Security Audit & Secret Leak Verification
            |
            v
[Milestone 9: Production Deployment & Go-Live]
  - Vercel Deployment Configuration & Security Headers
  - Supabase Production Database Setup
  - Custom Domain DNS & SSL/TLS Configuration
  - Final Owner Review & Public Launch
```

---

## Detailed Milestone Descriptions

### Milestone 1: Foundations, Skills & Architecture (Status: Complete, Awaiting Sign-off)
- **Goal**: Establish the development workspace, specialized skills, governance rules, and blueprints.
- **Deliverables**:
  - Environment inspection (Node v26.13, npm v11.20, Git v2.56).
  - 10 specialized workspace skills under `.agents/skills/`.
  - Project rules in `AGENTS.md` and `.agents/rules/`.
  - System Architecture (`docs/ARCHITECTURE.md`) and Master Roadmap (`docs/ROADMAP.md`).
  - Project status tracker (`PROJECT_STATUS.md`).
- **Owner Action**: Review architecture, confirm policies, and approve proceeding to Milestone 2.

### Milestone 2: Storefront & UI Design System (Status: Ready to Start)
- **Goal**: Initialize the Next.js App Router application and craft responsive UI components.
- **Deliverables**:
  - Next.js 15+ App Router, TypeScript, Tailwind CSS configuration.
  - High-tech dark theme with neon cyan accent.
  - Responsive header, navigation, product catalog grid, search and filter bar.
  - Product detail page with license redemption guides, platform icons, and stock badges.
  - Mobile bottom navigation bar.

### Milestone 3: Database & Authentication (Status: Pending)
- **Goal**: Set up the Supabase database schema, RLS policies, and customer authentication.
- **Deliverables**:
  - Tables: `profiles`, `categories`, `products`, `license_keys`, `orders`, `order_items`, `audit_logs`.
  - 100% RLS coverage ensuring zero unauthorized data access.
  - User registration, login, session management, and automated profile trigger.
- **Owner Action**: Create a free Supabase project and provide project URL and anon API key following our simple Thai guide.

### Milestone 4: Shopping Cart & Order Processing Pipeline (Status: Pending)
- **Goal**: Build the shopping cart and checkout pipeline.
- **Deliverables**:
  - LocalStorage + DB synchronized cart state.
  - Checkout form with Zod schema validation.
  - Order state machine (`pending`, `paid`, `processing_fulfillment`, `completed`).
  - Stock concurrency lock to prevent overselling.

### Milestone 5: License Procurement & Batch Key Encryption (Status: Pending)
- **Goal**: Implement secure digital key management for the store owner.
- **Deliverables**:
  - AES-256-GCM encryption/decryption module using Node.js crypto.
  - Admin batch key ingestion (CSV or text paste) with SHA-256 duplicate detection.
  - Manual procurement dashboard for on-demand license fulfillment.
  - Stock level indicators and low-stock alerts.

### Milestone 6: Payment Sandbox & Webhook Verification (Status: Pending)
- **Goal**: Enable safe end-to-end checkout testing without spending real money.
- **Deliverables**:
  - Sandbox Payment Simulator supporting test card checkout and simulated PromptPay QR.
  - Webhook Route Handler validating HMAC signatures and enforcing idempotency.
  - Automatic order fulfillment upon verified webhook signal.

### Milestone 7: Secure License Delivery & Customer Dashboard (Status: Pending)
- **Goal**: Deliver digital keys securely to paying customers.
- **Deliverables**:
  - Customer purchase history view (`/orders`).
  - Obfuscated key display with "Reveal Key" and "Copy to Clipboard" feedback.
  - PDF/HTML order invoice and receipt.
  - Audit logging for every key reveal event.

### Milestone 8: Comprehensive Testing & Security Audit (Status: Pending)
- **Goal**: Validate system reliability, concurrency, and security.
- **Deliverables**:
  - Vitest test suite (Unit & Integration: 100% pass).
  - Concurrency test (prevent overselling last unit).
  - Playwright E2E smoke tests.
  - OWASP Top 10 security audit report and fix confirmation.

### Milestone 9: Production Deployment & Launch (Status: Pending)
- **Goal**: Deploy ShadowMarket to production with custom domain and SSL.
- **Deliverables**:
  - Vercel production deployment with Singapore edge region.
  - Production Supabase database connection and secrets verification.
  - Custom domain DNS record setup guide.
  - Owner sign-off and public launch.
