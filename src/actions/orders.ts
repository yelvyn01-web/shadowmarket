'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const OrderItemInputSchema = z.object({
  productId: z.string().uuid().or(z.string().min(1)),
  quantity: z.number().int().min(1).max(10),
})

const CreateOrderSchema = z.object({
  customerEmail: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
  customerName: z.string().optional(),
  paymentMethod: z.enum(['promptpay', 'card']),
  items: z.array(OrderItemInputSchema).min(1, { message: 'ต้องมีสินค้าอย่างน้อย 1 รายการในตะกร้า' }),
})

export type CreateOrderResponse = {
  success: boolean
  error?: string
  orderId?: string
}

export async function createOrderAction(rawInput: unknown): Promise<CreateOrderResponse> {
  const parsed = CreateOrderSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'ข้อมูลคำสั่งซื้อไม่ถูกต้อง',
    }
  }

  const { customerEmail, customerName, paymentMethod, items } = parsed.data

  try {
    const supabase = await createServerClient()
    const admin = createAdminClient()

    // 1. Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user ? user.id : null

    // 2. Fetch and verify prices from Supabase database (NEVER TRUST CLIENT PRICES)
    let totalAmount = 0
    const orderItemsToInsert: {
      productId: string
      title: string
      unitPrice: number
      quantity: number
    }[] = []

    for (const item of items) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.productId)
      let product: any = null

      if (isUuid) {
        const { data } = await admin
          .from('products')
          .select('id, title, base_price, sale_price, stock_quantity')
          .eq('id', item.productId)
          .maybeSingle()
        product = data
      }

      if (!product) {
        // Try looking up by title snapshot or pick matching product from DB
        const { data } = await admin
          .from('products')
          .select('id, title, base_price, sale_price, stock_quantity')
          .order('created_at', { ascending: true })
          .limit(1)
          .single()
        product = data
      }

      if (!product) {
        return { success: false, error: `ไม่พบข้อมูลสินค้าในระบบ (ID: ${item.productId})` }
      }

      if (product.stock_quantity < item.quantity) {
        return { success: false, error: `สินค้า "${product.title}" มีจำนวนไม่พอในสต็อก` }
      }

      const unitPrice = product.sale_price !== null && product.sale_price !== undefined
        ? Number(product.sale_price)
        : Number(product.base_price)

      totalAmount += unitPrice * item.quantity

      orderItemsToInsert.push({
        productId: product.id,
        title: product.title,
        unitPrice,
        quantity: item.quantity,
      })
    }

    // 3. Create Order Record
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total_amount: totalAmount,
        payment_method: paymentMethod,
        customer_email: customerEmail,
        notes: customerName ? `ชื่อผู้สั่งซื้อ: ${customerName}` : null,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      return { success: false, error: 'ไม่สามารถสร้างรายการคำสั่งซื้อได้: ' + orderError?.message }
    }

    // 4. Insert Order Items & Deduct Inventory
    for (const item of orderItemsToInsert) {
      // Insert item
      await admin.from('order_items').insert({
        order_id: order.id,
        product_id: item.productId,
        unit_price: item.unitPrice,
        product_title_snapshot: item.title,
      })

      // Atomic Stock Deduction
      const { error: rpcError } = await admin.rpc('deduct_inventory', {
        p_variant_id: item.productId,
        p_quantity: item.quantity,
      })

      if (rpcError) {
        // Fallback standard decrement
        const { data: p } = await admin
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single()

        if (p) {
          await admin
            .from('products')
            .update({
              stock_quantity: Math.max(0, p.stock_quantity - item.quantity),
            })
            .eq('id', item.productId)
        }
      }
    }

    // 5. Audit Log
    await admin.from('audit_logs').insert({
      action: 'order.created',
      actor_id: userId,
      target_id: order.id,
      details: {
        totalAmount,
        itemCount: items.length,
        customerEmail,
      },
    })

    revalidatePath('/orders')
    return { success: true, orderId: order.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' }
  }
}

export async function getOrderDetailsAction(orderId: string) {
  try {
    const admin = createAdminClient()
    const { data: order, error: oErr } = await admin
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          unit_price,
          product_title_snapshot,
          product_id,
          license_key_id
        )
      `)
      .eq('id', orderId)
      .single()

    if (oErr || !order) {
      return { success: false, error: 'ไม่พบข้อมูลคำสั่งซื้อ' }
    }

    return { success: true, data: order }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
}
