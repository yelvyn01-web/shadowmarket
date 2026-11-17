---
name: payments
description: >-
  Implement secure payment systems, sandbox verification, and idempotent transaction lifecycles for ShadowMarket.
  Covers Stripe Elements, PromptPay QR simulation/sandbox, webhook HMAC signature verification,
  idempotency enforcement, PCI-DSS compliance, and zero plaintext card storage.
  Use when building or securing payment flows (ระบบรับเงิน, ชำระเงิน, Payment Gateway, Stripe, PromptPay, Webhooks, Checkout, Transactions).
---

# Secure Payments & Sandbox Verification (ระบบรับเงินที่ปลอดภัย)

Use this skill to integrate payment gateways, build sandbox verification flows, handle asynchronous webhooks with signature verification, and prevent double-charging or fraud.

---

## 1. Payment Lifecycle & State Machine

Every payment transaction for digital licenses follows a strict state machine:

```text
[Cart Ready]
     ↓
 (Create Payment Intent / Session with order_id metadata)
     ↓
[Pending / Awaiting Payment]
     ├── (Webhook Signature Verified: succeeded) ──> [Paid] ──> (Assign License) ──> [Completed]
     └── (Webhook Signature Verified: failed/timeout) ──> [Failed/Cancelled] ──> (Release Hold)
```

### Critical Rules
- **NEVER mark an order as `paid` directly from client-side redirects**. Client-side callbacks can be spoofed or interrupted.
- **Only mark orders as `paid` upon verified server-to-server webhook events** or authoritative backend status verification.
- Enforce idempotency: If the same webhook event is delivered multiple times, it must only be executed once.

---

## 2. Secure Webhook Handling (Next.js Route Handler)

```typescript
// src/app/api/webhooks/payment/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  const body = await req.text()
  const headerList = await headers()
  const signature = headerList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // Idempotency check: verify if event was already processed
  const { data: processed } = await supabaseAdmin
    .from('audit_logs')
    .select('id')
    .eq('target_id', event.id)
    .maybeSingle()

  if (processed) {
    return NextResponse.json({ received: true, note: 'Already processed' })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.orderId

    if (orderId) {
      // Transition order status to paid
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
          payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Auto-assign license key if product is instant fulfillment
      // ...
    }
  }

  // Record audit log for idempotency
  await supabaseAdmin.from('audit_logs').insert({
    action: 'payment.webhook_processed',
    target_id: event.id,
    details: { eventType: event.type },
  })

  return NextResponse.json({ received: true })
}
```

---

## 3. Sandbox / Mock Payment Gateway for Testing

To safely verify checkout without real money:
- Implement a **Sandbox Payment Simulator** enabled in development/test environments.
- Simulates PromptPay QR scan & Stripe card checkout with realistic network delay.
- Emits real webhook signatures to the internal webhook handler to test fulfillment end-to-end.

---

## 4. Payment Security & PCI-DSS Checklist

- [ ] Webhook endpoints verify cryptographic signatures before parsing body.
- [ ] Raw request payload (`req.text()`) used for HMAC signature calculation.
- [ ] Database updates from webhooks use transactions with idempotency tracking.
- [ ] Zero credit card numbers or banking credentials stored on platform servers.
- [ ] Secret keys (`STRIPE_SECRET_KEY`, `WEBHOOK_SECRET`) never exposed to client bundles.
- [ ] Sandbox test mode thoroughly validated before requesting owner live gateway approval.

---

## 5. Official Documentation References

- [Stripe Webhooks & Signature Verification Guide](https://stripe.com/docs/webhooks/signatures)
- [Stripe Checkout Session Integration](https://stripe.com/docs/payments/checkout)
- [PCI Security Standards Council - PCI-DSS Quick Reference](https://www.pcisecuritystandards.org/)
- [Next.js Route Handlers Request Body Parsing](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
