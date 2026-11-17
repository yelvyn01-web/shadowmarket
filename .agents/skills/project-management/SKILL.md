---
name: project-management
description: >-
  Plan, scope, and track software projects, architecture roadmaps, and agile milestones for ShadowMarket.
  Covers Product Requirements Documents (PRD), milestone mapping, sprint planning, task breakdown,
  risk management, Definition of Done (DoD), and project status tracking.
  Use when planning, structuring milestones, creating roadmaps, or tracking project progress (วางแผนโครงการ, จัดการงาน, roadmap, PRD, backlog, sprint, Project Management).
---

# Project Management & Planning (การบริหารโครงการและการวางแผน)

Use this skill to systematically scope, plan, schedule, and track the development of ShadowMarket from technical discovery through production deployment.

---

## 1. Project Scoping & Product Requirements Document (PRD)

When managing the digital license platform, structure the PRD as follows:

1. **Executive Summary**:
   - Platform Name: ShadowMarket
   - Objective: Provide a secure, legal digital software license and key reselling platform.
   - Core Policy: 100% legal licenses authorized for resale. Zero game cheats, anti-cheat bypasses, or illicit cracking tools.
2. **User Personas & Journeys**:
   - **Customer**: Browse catalog -> search & filter -> view product details & legal license terms -> checkout via secure payment -> receive instantly revealed encrypted key or wait for manual procurement -> access purchase history.
   - **Store Owner / Admin (Non-Technical)**: Access simple dashboard -> manage products -> import license batches -> fulfill manual procurement queue -> review earnings and orders -> maintain system status.
3. **Scope Milestones (Phased Delivery)**:
   - **Milestone 1**: Environment inspection, specialized skills setup, governance rules, and master architecture & roadmap.
   - **Milestone 2**: Next.js App Router storefront foundation, Tailwind CSS dark/light design system, and responsive UI components.
   - **Milestone 3**: Supabase PostgreSQL database schema, RLS policies, automated auth triggers, and customer authentication.
   - **Milestone 4**: Order processing pipeline, shopping cart state, and order lifecycle management.
   - **Milestone 5**: Manual procurement dashboard, batch key import, and AES-256-GCM license encryption service.
   - **Milestone 6**: Payment sandbox integration (Stripe & PromptPay mock/test gateways) and idempotent webhook verification.
   - **Milestone 7**: Secure license delivery, reveal safeguards, audit logging, and customer receipt generation.
   - **Milestone 8**: End-to-end testing (Vitest, Playwright), OWASP security audit, and penetration testing.
   - **Milestone 9**: Production deployment preparation (Vercel, Supabase production, domain DNS, SSL), owner sign-off, and launch.

---

## 2. Risk Assessment & Mitigation Framework

| Risk | Likelihood | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Inventory Overselling** | Medium | Critical | Use atomic PostgreSQL transactions (`FOR UPDATE SKIP LOCKED`) so concurrent checkouts never claim the same key. |
| **Secret Key Leakage** | Low | Critical | Strict build-time checks: zero secret keys prefixed with `NEXT_PUBLIC_`; `.env` excluded from Git via `.gitignore`. |
| **Unverified Payment Claim** | Medium | High | Orders only transition to `paid` upon cryptographic signature verification of server-to-server webhooks. |
| **Non-Technical Operator Error** | High | Medium | All admin interfaces provide clear Thai instructions, confirmations before irreversible actions, and safety guardrails. |
| **Legal / Compliance Breach** | Low | Critical | Strict platform policy: reject cheat software, verify authorized distribution channels for all catalog listings. |

---

## 3. Definition of Done (DoD) Checklist

A milestone or feature is strictly **Done** only when:
- [ ] Requirements specified in PRD are completely implemented.
- [ ] Strict TypeScript typing enforced (zero `any` types; `tsc --noEmit` passes).
- [ ] Automated tests (unit, integration, and E2E) pass with 100% success.
- [ ] Row Level Security (RLS) is active and verified for all database tables.
- [ ] Responsive design verified across mobile, tablet, and desktop viewports.
- [ ] Sensitive secrets and license keys are encrypted and never exposed in client bundles.
- [ ] `PROJECT_STATUS.md` is updated with milestone completion status.
- [ ] Results and required manual actions are reported to the owner in simple Thai.

---

## 4. Official Documentation References

- [Agile Alliance - Agile Glossary & Principles](https://www.agilealliance.org/agile101/)
- [Next.js Project Structure Guide](https://nextjs.org/docs/app/getting-started/project-structure)
- [Supabase Architecture & Development Best Practices](https://supabase.com/docs/guides/getting-started/architecture)
- [OWASP Software Assurance Maturity Model (SAMM)](https://owaspsamm.org/)
- [Vercel Production Readiness Guide](https://vercel.com/docs/deployments/production-readiness)
