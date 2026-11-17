'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptLicenseKey } from '@/lib/crypto/license-crypto'

const RevealKeySchema = z.object({
  orderId: z.string().uuid({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' }),
  orderItemId: z.string().uuid({ message: 'รหัสรายการสินค้าไม่ถูกต้อง' }),
})

export interface RevealKeyResponse {
  success: boolean
  plaintextKey?: string
  productTitle?: string
  keyId?: string
  redeemedAt?: string
  error?: string
}

/**
 * Authenticated license key revelation action.
 * Decrypts AES-256-GCM encrypted license key only when order is paid/completed.
 * Automatically updates status to 'redeemed' and logs an audit trail event.
 */
export async function revealLicenseKeyAction(
  orderId: string,
  orderItemId: string
): Promise<RevealKeyResponse> {
  const parsed = RevealKeySchema.safeParse({ orderId, orderItemId })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
  }

  const admin = createAdminClient()

  try {
    // 1. Verify Order Status
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, status, customer_email, user_id')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return { success: false, error: 'ไม่พบคำสั่งซื้อในระบบ' }
    }

    if (order.status !== 'completed' && order.status !== 'paid') {
      return {
        success: false,
        error: 'คำสั่งซื้อนี้ยังไม่ได้รับการชำระเงินที่สมบูรณ์ จึงไม่สามารถเปิดดูคีย์ได้',
      }
    }

    // 2. Fetch Order Item
    const { data: orderItem, error: itemErr } = await admin
      .from('order_items')
      .select('id, product_id, product_title_snapshot, license_key_id')
      .eq('id', orderItemId)
      .eq('order_id', orderId)
      .single()

    if (itemErr || !orderItem) {
      return { success: false, error: 'ไม่พบรายการสินค้านี้ในคำสั่งซื้อ' }
    }

    if (!orderItem.license_key_id) {
      return {
        success: false,
        error: 'รายการนี้กำลังอยู่ระหว่างการจัดสรรคีย์ลิขสิทธิ์ กรุณารอสักครู่',
      }
    }

    // 3. Fetch Encrypted License Key
    const { data: keyRecord, error: keyErr } = await admin
      .from('license_keys')
      .select('id, ciphertext, iv, auth_tag, status, redeemed_at')
      .eq('id', orderItem.license_key_id)
      .single()

    if (keyErr || !keyRecord) {
      return { success: false, error: 'ไม่พบคีย์ลิขสิทธิ์ที่ผูกไว้กับรายการนี้' }
    }

    // 4. Decrypt AES-256-GCM Key Payload
    const plaintext = decryptLicenseKey({
      ciphertext: keyRecord.ciphertext,
      iv: keyRecord.iv,
      authTag: keyRecord.auth_tag,
    })

    const nowIso = new Date().toISOString()

    // 5. Update Key Status to 'redeemed' if not already
    if (keyRecord.status !== 'redeemed') {
      await admin
        .from('license_keys')
        .update({
          status: 'redeemed',
          redeemed_at: keyRecord.redeemed_at || nowIso,
        })
        .eq('id', keyRecord.id)
    }

    // 6. Record Audit Log for Fraud Protection & Legal Verification
    await admin.from('audit_logs').insert({
      action: 'license.viewed',
      target_id: keyRecord.id,
      details: {
        orderId,
        orderItemId,
        productTitle: orderItem.product_title_snapshot,
        viewedAt: nowIso,
      },
    })

    revalidatePath(`/orders/${orderId}`)

    return {
      success: true,
      plaintextKey: plaintext,
      productTitle: orderItem.product_title_snapshot,
      keyId: keyRecord.id,
      redeemedAt: keyRecord.redeemed_at || nowIso,
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'เกิดข้อผิดพลาดในการถอดรหัสคีย์ลิขสิทธิ์',
    }
  }
}
