import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export interface FulfillmentResult {
  success: boolean
  orderId: string
  finalStatus: 'completed' | 'processing_fulfillment' | 'paid' | 'failed'
  assignedKeysCount: number
  unassignedCount: number
  error?: string
}

/**
 * Automatically allocates encrypted license keys from the vault (FIFO) to paid order items.
 * If all items are satisfied, marks order as 'completed'.
 * If any item is out of stock in the vault, marks order as 'processing_fulfillment' for manual procurement.
 */
export async function fulfillOrderWithVaultKeys(orderId: string): Promise<FulfillmentResult> {
  const admin = createAdminClient()

  try {
    // 1. Fetch order and items
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        customer_email,
        order_items (
          id,
          product_id,
          product_title_snapshot,
          license_key_id
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return {
        success: false,
        orderId,
        finalStatus: 'failed',
        assignedKeysCount: 0,
        unassignedCount: 0,
        error: 'Order not found',
      }
    }

    const orderItems = order.order_items || []
    let assignedCount = 0
    let unassignedCount = 0

    // 2. Iterate each item and attempt FIFO key assignment
    for (const item of orderItems) {
      if (item.license_key_id) {
        assignedCount++
        continue
      }

      // Find earliest available key
      const { data: availableKey } = await admin
        .from('license_keys')
        .select('id')
        .eq('product_id', item.product_id)
        .eq('status', 'available')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (availableKey) {
        // Assign key to order
        const { error: keyUpdateErr } = await admin
          .from('license_keys')
          .update({
            status: 'assigned',
            order_id: order.id,
            assigned_to_user_id: order.user_id,
          })
          .eq('id', availableKey.id)
          .eq('status', 'available') // atomic guard against race conditions

        if (!keyUpdateErr) {
          // Link key to order item
          await admin
            .from('order_items')
            .update({ license_key_id: availableKey.id })
            .eq('id', item.id)

          // Record audit log
          await admin.from('audit_logs').insert({
            action: 'license.auto_assigned',
            actor_id: order.user_id,
            target_id: availableKey.id,
            details: {
              orderId: order.id,
              orderItemId: item.id,
              productId: item.product_id,
              productTitle: item.product_title_snapshot,
            },
          })

          assignedCount++
          continue
        }
      }

      // No key was available or race condition occurred
      unassignedCount++
    }

    // 3. Determine final status
    const finalStatus = unassignedCount === 0 ? 'completed' : 'processing_fulfillment'

    await admin
      .from('orders')
      .update({
        status: finalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    // 4. Revalidate cache
    try {
      revalidatePath(`/orders/${orderId}`)
      revalidatePath('/orders')
      revalidatePath('/admin/procurement')
    } catch {
      // Revalidation may be skipped outside of request context (e.g. tests)
    }

    return {
      success: true,
      orderId,
      finalStatus,
      assignedKeysCount: assignedCount,
      unassignedCount,
    }
  } catch (err: any) {
    return {
      success: false,
      orderId,
      finalStatus: 'failed',
      assignedKeysCount: 0,
      unassignedCount: 0,
      error: err?.message || 'Fulfillment process failed',
    }
  }
}
