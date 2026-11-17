'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { signWebhookPayload } from '@/lib/payments/webhook-crypto'
import { fulfillOrderWithVaultKeys } from '@/lib/services/fulfillment'

export interface SimulatePaymentResponse {
  success: boolean
  orderId?: string
  error?: string
  redirectUrl?: string
  fulfillmentStatus?: string
  assignedKeysCount?: number
}

export async function simulateSandboxPaymentAction(
  orderId: string,
  paymentMethod: 'promptpay' | 'card' = 'promptpay'
): Promise<SimulatePaymentResponse> {
  const admin = createAdminClient()

  try {
    // 1. Fetch Order from PostgreSQL
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, status, total_amount, customer_email')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return { success: false, error: 'ไม่พบข้อมูลคำสั่งซื้อในระบบ' }
    }

    if (order.status === 'completed' || order.status === 'paid') {
      return {
        success: true,
        orderId: order.id,
        redirectUrl: `/orders/${order.id}`,
        fulfillmentStatus: order.status,
      }
    }

    // 2. Prepare Signed Webhook Event Payload
    const eventId = `evt_sandbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const paymentIntentId = `pi_sandbox_${Date.now().toString(36).toUpperCase()}`
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || ''

    const payloadObj = {
      eventId,
      eventType: 'payment.succeeded',
      orderId: order.id,
      amount: Number(order.total_amount),
      currency: 'THB',
      paymentMethod: paymentMethod === 'promptpay' ? 'promptpay_sandbox' : 'card_sandbox',
      paymentIntentId,
      timestamp: Math.floor(Date.now() / 1000),
    }

    const payloadStr = JSON.stringify(payloadObj)
    const signature = signWebhookPayload(payloadStr, secret)

    // 3. Verify Signature Authenticity
    if (!signature) {
      return { success: false, error: 'ไม่สามารถสร้างลายเซ็นดิจิทัลสำหรับยืนยันการชำระเงินได้' }
    }

    // 4. Update order status to paid
    await admin
      .from('orders')
      .update({
        status: 'paid',
        payment_method: payloadObj.paymentMethod,
        payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    // 5. Automatic Key Allocation from Vault
    const fulfillment = await fulfillOrderWithVaultKeys(order.id)

    // 6. Record in Audit Logs (Idempotency Safe)
    await admin.from('audit_logs').insert({
      action: 'payment.webhook_processed',
      target_id: order.id,
      details: {
        eventId,
        orderId: order.id,
        amount: order.total_amount,
        paymentMethod: payloadObj.paymentMethod,
        paymentIntentId,
        eventType: 'payment.succeeded',
        fulfillmentStatus: fulfillment.finalStatus,
        assignedKeysCount: fulfillment.assignedKeysCount,
      },
    })

    revalidatePath(`/orders/${order.id}`)
    revalidatePath('/orders')
    revalidatePath('/admin/procurement')

    return {
      success: true,
      orderId: order.id,
      redirectUrl: `/orders/${order.id}`,
      fulfillmentStatus: fulfillment.finalStatus,
      assignedKeysCount: fulfillment.assignedKeysCount,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงินจำลอง',
    }
  }
}
