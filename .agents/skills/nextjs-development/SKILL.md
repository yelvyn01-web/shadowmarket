---
name: nextjs-development
description: >-
  Develop production-grade Next.js (App Router) web applications with TypeScript and Tailwind CSS.
  Covers Server Components vs Client Components, Server Actions, Route Handlers, dynamic routing,
  metadata & SEO, streaming with Suspense, caching/revalidation, and error boundaries.
  Use when writing Next.js code, creating pages, components, or API routes (เขียนเว็บไซต์, Next.js, App Router, React, Server Actions, frontend, web development).
---

# Next.js Development (การพัฒนาเว็บแอปพลิเคชัน Next.js)

Use this skill to build scalable, high-performance web applications using modern Next.js (App Router), TypeScript, React, and Tailwind CSS for ShadowMarket.

---

## 1. App Router Architecture & Directory Conventions

Organize the application following Next.js App Router best practices:

```text
src/
├── app/
│   ├── (auth)/             # Route group for authentication flows
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (shop)/             # Route group for storefront
│   │   ├── page.tsx        # Homepage & featured licenses
│   │   ├── products/
│   │   │   ├── page.tsx    # Catalog with search & category filters
│   │   │   └── [slug]/page.tsx # Product details & redemption guide
│   │   ├── cart/page.tsx   # Shopping cart
│   │   ├── checkout/page.tsx # Checkout & payment selection
│   │   └── orders/
│   │       ├── page.tsx    # Customer order history
│   │       └── [id]/page.tsx # License key retrieval & receipt
│   ├── admin/              # Protected admin route group
│   │   ├── page.tsx        # Overview & analytics
│   │   ├── products/page.tsx # Manage products & stock
│   │   ├── procurement/page.tsx # Batch key ingestion & manual queue
│   │   └── orders/page.tsx # All customer orders
│   ├── api/                # Route Handlers for external webhooks
│   │   └── webhooks/payment/route.ts
│   ├── layout.tsx          # Root Layout (Navbar, Providers, Footer)
│   ├── not-found.tsx       # Custom 404 page
│   └── error.tsx           # Global error boundary (Client Component)
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Modal, Input, Badge)
│   ├── shop/               # Domain components (ProductCard, LicenseRevealBox)
│   └── admin/              # Admin components (BatchKeyImporter, OrderFulfillmentModal)
├── lib/
│   ├── supabase/           # Supabase client helpers (client, server, admin)
│   ├── crypto/             # AES-256-GCM license key encryption
│   └── validations/        # Zod validation schemas
├── actions/                # Server Actions for mutations
└── types/                  # TypeScript interfaces and types
```

---

## 2. Server Components vs Client Components

- **Default to Server Components**: Fetch data directly on the server without shipping JavaScript bundles to the browser.
- **Client Components (`'use client'`)**: Use strictly for interactive elements:
  - Shopping cart state and quantity updates
  - License key reveal and copy-to-clipboard interactions
  - Dynamic payment selection tabs
  - Modal dialogues and dropdown menus

---

## 3. Server Actions for Data Mutations

Mutations must use Server Actions with strict Zod parsing:

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10),
})

export async function addToCartAction(input: z.infer<typeof AddToCartSchema>) {
  const parsed = AddToCartSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'ข้อมูลสินค้าไม่ถูกต้อง' }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าในตะกร้า' }
  }

  // Insert or update cart
  await supabase.from('cart_items').upsert({
    user_id: user.id,
    product_id: parsed.data.productId,
    quantity: parsed.data.quantity,
  })

  revalidatePath('/cart')
  return { success: true }
}
```

---

## 4. Next.js Quality Checklist

- [ ] All pages configure proper static/dynamic `metadata` and OpenGraph tags.
- [ ] No private environment variables prefixed with `NEXT_PUBLIC_`.
- [ ] Hydration mismatches eliminated by avoiding browser-only globals in SSR renders.
- [ ] Loading skeletons (`loading.tsx`) and error boundaries (`error.tsx`) present for key route groups.
- [ ] Server Actions validate input payloads with Zod schemas.
- [ ] Responsive images use `next/image` with specified dimensions or responsive `sizes`.

---

## 5. Official Documentation References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js Metadata and SEO Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [React 19 Server and Client Components Guide](https://react.dev/reference/rsc/server-components)
- [TypeScript Official Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
