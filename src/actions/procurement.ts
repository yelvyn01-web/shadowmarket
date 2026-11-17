'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptLicenseKey, hashLicenseKey } from '@/lib/crypto/license-crypto'
import { requireAdmin } from '@/lib/auth/roles'

const BatchImportSchema = z.object({
  productId: z.string().uuid({ message: 'กรุณาเลือกรหัสสินค้าที่ถูกต้อง' }),
  rawKeys: z.string().min(3, { message: 'กรุณากรอกรหัสคีย์อย่างน้อย 1 รายการ' }),
  supplierName: z.string().min(2, { message: 'กรุณาระบุชื่อผู้จัดจำหน่าย/ซัพพลายเออร์' }),
  costPrice: z.number().min(0),
  batchReference: z.string().optional(),
})

export type BatchImportResponse = {
  success: boolean
  error?: string
  importedCount?: number
  duplicateCount?: number
  duplicates?: string[]
}

export async function importBatchKeysAction(formData: FormData): Promise<BatchImportResponse> {
  const productId = formData.get('productId') as string
  const rawKeys = formData.get('rawKeys') as string
  const supplierName = formData.get('supplierName') as string
  const costPrice = Number(formData.get('costPrice') || 0)
  const batchReference = (formData.get('batchReference') as string) || `BATCH-${Date.now().toString(36).toUpperCase()}`

  const parsed = BatchImportSchema.safeParse({
    productId,
    rawKeys,
    supplierName,
    costPrice,
    batchReference,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }
  }

  try {
    await requireAdmin()
    const admin = createAdminClient()

    // 1. Verify Product Exists
    const { data: product, error: pErr } = await admin
      .from('products')
      .select('id, title, stock_quantity')
      .eq('id', productId)
      .single()

    if (pErr || !product) {
      return { success: false, error: 'ไม่พบสินค้าที่เลือกในระบบ' }
    }

    // 2. Parse and normalize keys
    const lines = rawKeys
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    if (lines.length === 0) {
      return { success: false, error: 'ไม่พบรายการคีย์ที่ถูกต้อง' }
    }

    const duplicates: string[] = []
    const toInsert: any[] = []

    for (const key of lines) {
      const keyHash = hashLicenseKey(key)

      // Check collision
      const { data: existing } = await admin
        .from('license_keys')
        .select('id')
        .eq('key_hash', keyHash)
        .maybeSingle()

      if (existing) {
        duplicates.push(key)
        continue
      }

      // Encrypt with AES-256-GCM
      const encrypted = encryptLicenseKey(key)

      toInsert.push({
        product_id: product.id,
        key_hash: keyHash,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        status: 'available',
        supplier_name: supplierName,
        cost_price: costPrice,
        batch_reference: batchReference,
        created_at: new Date().toISOString(),
      })
    }

    // 3. Insert non-duplicate encrypted keys
    if (toInsert.length > 0) {
      const { error: insertErr } = await admin.from('license_keys').insert(toInsert)
      if (insertErr) {
        return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกคีย์: ' + insertErr.message }
      }

      // Update product stock quantity
      await admin
        .from('products')
        .update({
          stock_quantity: product.stock_quantity + toInsert.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
    }

    // 4. Audit Log
    await admin.from('audit_logs').insert({
      action: 'procurement.batch_imported',
      details: {
        productId: product.id,
        productTitle: product.title,
        batchReference,
        importedCount: toInsert.length,
        duplicateCount: duplicates.length,
        supplierName,
      },
    })

    revalidatePath('/admin/procurement')
    revalidatePath('/products')
    revalidatePath('/')

    return {
      success: true,
      importedCount: toInsert.length,
      duplicateCount: duplicates.length,
      duplicates,
    }
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในระบบจัดซื้อ' }
  }
}

export async function getLicenseInventoryAction() {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('license_keys')
      .select(`
        id,
        status,
        supplier_name,
        cost_price,
        batch_reference,
        created_at,
        products (
          id,
          title,
          platform
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getManualFulfillmentQueueAction() {
  try {
    await requireAdmin()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('orders')
      .select(`
        id,
        status,
        customer_email,
        total_amount,
        created_at,
        order_items (
          id,
          product_id,
          product_title_snapshot,
          unit_price,
          license_key_id
        )
      `)
      .in('status', ['pending', 'processing_fulfillment'])
      .order('created_at', { ascending: true })

    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function fulfillManualOrderAction(input: {
  orderId: string
  orderItemId: string
  productId: string
  plaintextKey: string
}): Promise<{ success: boolean; error?: string }> {
  const { orderId, orderItemId, productId, plaintextKey } = input

  if (!plaintextKey || plaintextKey.trim().length < 4) {
    return { success: false, error: 'กรุณากรอกรหัสคีย์ที่ถูกต้อง' }
  }

  try {
    await requireAdmin()
    const admin = createAdminClient()
    const keyHash = hashLicenseKey(plaintextKey)

    // 1. Check duplicate
    const { data: existing } = await admin
      .from('license_keys')
      .select('id')
      .eq('key_hash', keyHash)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'คีย์นี้มีอยู่ในระบบแล้ว (พบการซ้ำซ้อน)' }
    }

    // 2. Encrypt Key
    const encrypted = encryptLicenseKey(plaintextKey)

    // 3. Insert Key as 'assigned'
    const { data: keyRecord, error: keyErr } = await admin
      .from('license_keys')
      .insert({
        product_id: productId,
        key_hash: keyHash,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        status: 'assigned',
        order_id: orderId,
        supplier_name: 'Manual Procurement Fulfillment',
        batch_reference: `MANUAL-${orderId.slice(0, 8)}`,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (keyErr || !keyRecord) {
      return { success: false, error: 'ไม่สามารถบันทึกคีย์เข้ารหัสได้' }
    }

    // 4. Update order_items with license_key_id
    await admin
      .from('order_items')
      .update({ license_key_id: keyRecord.id })
      .eq('id', orderItemId)

    // 5. Update order status to 'completed'
    await admin
      .from('orders')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // 6. Audit Log
    await admin.from('audit_logs').insert({
      action: 'license.manual_fulfilled',
      target_id: orderId,
      details: {
        orderItemId,
        productId,
        keyId: keyRecord.id,
      },
    })

    revalidatePath('/admin/procurement')
    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/orders')

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการจัดส่งคีย์' }
  }
}
