# Rule: Architecture & Code Standards

## 1. Stack Conventions
- Next.js App Router with TypeScript (strict mode, zero `any`).
- Styling: Tailwind CSS (Mobile-first, dark/light high-tech theme).
- Database: Supabase PostgreSQL (parameterized queries, atomic transactions, no raw string interpolation).
- Validation: Zod schemas on all Server Actions and Route Handlers.
- State Mutations: Server Actions with `revalidatePath`.
- External Webhooks: Route Handlers in `app/api/webhooks/` with raw-body signature verification.

## 2. Safe File and Dependency Operations
- Never install untrusted, unverified packages or run obscure curl/powershell web scripts.
- Use official, audited npm packages only (`next`, `react`, `@supabase/supabase-js`, `zod`, `stripe`, `lucide-react`, `vitest`, `@playwright/test`).
- Always run tests and typechecks before committing or finalizing milestones.
