import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/payments/webhook-crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { fulfillOrderWithVaultKeys } from '@/lib/services/fulfillment'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature =
      req.headers.get('x-shadowmarket-signature') ||
      req.headers.get('stripe-signature')

    const webhookSecret =
      process.env.PAYMENT_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET ||
      ''

    // 1. Verify HMAC-SHA256 signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature. Request rejected.' },
        { status: 400 }
      )
    }

    // 2. Parse Event Payload
    const event = JSON.parse(rawBody)
    const { eventId, eventType, orderId, paymentIntentId, paymentMethod, amount } = event

    if (!eventId || !orderId) {
      return NextResponse.json(
        { error: 'Missing eventId or orderId in payload' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // 3. Idempotency Check: Prevent duplicate event processing
    const { data: existingLog } = await admin
      .from('audit_logs')
      .select('id')
      .eq('action', 'payment.webhook_processed')
      .contains('details', { eventId })
      .maybeSingle()

    if (existingLog) {
      return NextResponse.json({
        received: true,
        note: 'Event already processed (idempotent safe)',
        eventId,
        orderId,
      })
    }

    // 4. Process Payment Success Event
    if (eventType === 'payment.succeeded' || eventType === 'checkout.session.completed') {
      // Transition order status to paid
      const { error: updateErr } = await admin
        .from('orders')
        .update({
          status: 'paid',
          payment_method: paymentMethod || 'promptpay_sandbox',
          payment_intent_id: paymentIntentId || `pi_${eventId}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updateErr) {
        return NextResponse.json(
          { error: 'Failed to update order status: ' + updateErr.message },
          { status: 500 }
        )
      }

      // 5. Automatic Vault Key Allocation (FIFO)
      const fulfillment = await fulfillOrderWithVaultKeys(orderId)

      // 6. Record Audit Log for Idempotency
      await admin.from('audit_logs').insert({
        action: 'payment.webhook_processed',
        target_id: orderId, // Valid UUID
        details: {
          eventId,
          orderId,
          amount,
          paymentMethod,
          paymentIntentId,
          eventType,
          fulfillmentStatus: fulfillment.finalStatus,
          assignedKeysCount: fulfillment.assignedKeysCount,
        },
      })

      return NextResponse.json({
        received: true,
        success: true,
        orderId,
        fulfillmentStatus: fulfillment.finalStatus,
        assignedKeys: fulfillment.assignedKeysCount,
      })
    }

    // For any unhandled event types
    return NextResponse.json({ received: true, note: 'Unhandled event type: ' + eventType })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Webhook processing internal error' },
      { status: 500 }
    )
  }
}
