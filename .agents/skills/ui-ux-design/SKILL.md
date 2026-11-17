---
name: ui-ux-design
description: >-
  Design responsive, accessible, and high-converting UI/UX for web and e-commerce applications.
  Covers wireframing, design tokens, component hierarchy, Tailwind CSS styling, responsive layout (mobile-first),
  accessibility (WCAG 2.1 AA), and micro-interactions.
  Use when designing web pages, UI components, styling, or layouts (ออกแบบเว็บไซต์, UI, UX, design system, wireframe, styling, Tailwind).
---

# UI/UX Design (การออกแบบเว็บไซต์และประสบการณ์ผู้ใช้งาน)

Use this skill to create modern, responsive, user-friendly, and accessible user interfaces and user experiences for ShadowMarket, tailored for digital license and software sales.

---

## 1. Design System & Design Tokens

Establish consistent foundational tokens for ShadowMarket:

### Color Palette (Cyberpunk / Modern High-Tech Theme)
- **Background**:
  - Dark Mode (Default): `#0B0F19` (`bg-slate-950`) / Surface: `#111827` (`bg-slate-900`) / Card: `#1E293B` (`bg-slate-800/80`)
  - Light Mode (Clean): `#F8FAFC` (`bg-slate-50`) / Card: `#FFFFFF`
- **Primary Accent**:
  - Neon Cyan / Indigo: `#06B6D4` (`cyan-500`) / `#6366F1` (`indigo-500`) for primary buttons and focus states.
- **Semantic Status**:
  - Available / Paid: `#10B981` (`emerald-500`)
  - Low Stock / Reserved: `#F59E0B` (`amber-500`)
  - Out of Stock / Revoked: `#EF4444` (`rose-500`)
  - Processing / On-Demand: `#3B82F6` (`blue-500`)

### Typography
- Headings: `font-sans font-extrabold tracking-tight`
- License Key Display: `font-mono tracking-wider font-semibold` for clear distinguishability of alphanumeric characters (e.g., distinguishing `0` and `O`, `1` and `I`).

---

## 2. Digital Product UX Patterns

1. **License Key Reveal Pattern**:
   - Keys are initially obfuscated (`••••-••••-••••-XXXX`).
   - Customer clicks "Reveal Key" (คลิกเพื่อแสดงคีย์) with a quick confirmation.
   - One-click "Copy to Clipboard" with instant visual feedback (tooltip changes from "คัดลอก" to "คัดลอกแล้ว!").
2. **Instant vs Manual Fulfillment Badges**:
   - **จัดส่งทันที (Instant Auto-Delivery)**: Marked with a green lightning icon; key delivered immediately upon payment.
   - **สั่งซื้อตามความต้องการ (On-Demand / Manual Procurement)**: Marked with a blue clock icon; clear delivery timeframe (e.g., "จัดส่งทางอีเมลภายใน 1-2 ชั่วโมง").
3. **Platform Compatibility & System Requirements**:
   - Clear badges for OS (Windows, macOS, Linux, Steam, Epic Games, Microsoft Store).
   - Clear region lock notices (e.g., "Global", "Thailand / SEA Only").

---

## 3. Accessibility & Inclusivity (WCAG 2.1 AA)

- **Contrast**: Minimum 4.5:1 contrast ratio for normal text against high-tech dark backgrounds.
- **Keyboard Navigation**: Interactive elements have distinct `:focus-visible` rings (`ring-2 ring-cyan-500 ring-offset-2`).
- **Semantic Elements**: All buttons use `<button>`, links use `<Link>`, and modal dialogues manage focus traps correctly.

---

## 4. UI/UX Quality Checklist

- [ ] Mobile-first responsive layout tested across mobile (375px), tablet (768px), and desktop (1280px).
- [ ] License keys render in monospaced font with one-click copy and reveal security.
- [ ] Stock status badges (In Stock, Low Stock, Out of Stock, On-Demand) are prominently visible.
- [ ] Empty states designed for Cart, Order History, and Admin Queues.
- [ ] Dark mode contrast verified with zero unreadable text on dark surfaces.
- [ ] Touch targets are at least 44px × 44px on mobile screens.

---

## 5. Official Documentation References

- [Tailwind CSS Official Documentation](https://tailwindcss.com/docs)
- [Radix UI Accessible Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons Directory](https://lucide.dev/icons/)
- [WCAG 2.1 AA Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
