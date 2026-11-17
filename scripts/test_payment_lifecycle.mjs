import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'node:crypto'
import fs from 'node:fs'

// Load .env.local manually
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8')
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      process.env[key] = val
    }
  }
} catch (e) {
  console.warn('Could not load .env.local:', e.message)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET

console.log('==================================================================')
console.log('   SHADOWMARKET - MILESTONE 6: PAYMENT & WEBHOOK LIFECYCLE TEST')
console.log('==================================================================\n')

if (!supabaseUrl || !supabaseServiceKey || !webhookSecret) {
  console.error('FAIL: Missing credentials in .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)

function signPayload(payload, secret) {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload, 'utf8')
  return `sha256=${hmac.digest('hex')}`
}

async function runTest() {
  try {
    // 1. Find product with available license keys in vault
    console.log('[1/6] Searching for product with available vault keys...')
    const { data: availableKeys, error: keyErr } = await admin
      .from('license_keys')
      .select('id, product_id, status, products(id, title, base_price)')
      .eq('status', 'available')
      .limit(1)

    if (keyErr || !availableKeys || availableKeys.length === 0) {
      throw new Error('No available keys in vault to test allocation: ' + (keyErr?.message || 'Empty list'))
    }

    const targetKey = availableKeys[0]
    const targetProduct = targetKey.products
    console.log(`PASS: Found target product "${targetProduct.title}" with available key ID: ${targetKey.id}`)

    // 2. Create a pending test order
    console.log('\n[2/6] Creating pending order in PostgreSQL...')
    const testEmail = `test-payment-${Date.now()}@shadowmarket.local`
    const { data: newOrder, error: oErr } = await admin
      .from('orders')
      .insert({
        customer_email: testEmail,
        status: 'pending',
        total_amount: targetProduct.base_price || 990,
        payment_method: 'promptpay',
        notes: 'Milestone 6 Automated Webhook Test',
      })
      .select('id')
      .single()

    if (oErr || !newOrder) {
      throw new Error('Failed to create order: ' + oErr?.message)
    }

    // Insert order_item
    const { data: orderItem, error: itemErr } = await admin
      .from('order_items')
      .insert({
        order_id: newOrder.id,
        product_id: targetProduct.id,
        product_title_snapshot: targetProduct.title,
        unit_price: targetProduct.base_price || 990,
        license_key_id: null, // Initially unassigned
      })
      .select('id')
      .single()

    if (itemErr || !orderItem) {
      throw new Error('Failed to create order item: ' + itemErr?.message)
    }

    console.log(`PASS: Created Order #${newOrder.id} (Status: pending) with OrderItem #${orderItem.id} (Key: null)`)

    // 3. Test Invalid HMAC Signature Rejection
    console.log('\n[3/6] Testing Webhook Signature Security (Rejecting Tampered Signature)...')
    const testEventId = `evt_test_${Date.now()}`
    const webhookPayload = JSON.stringify({
      eventId: testEventId,
      eventType: 'payment.succeeded',
      orderId: newOrder.id,
      amount: targetProduct.base_price || 990,
      currency: 'THB',
      paymentMethod: 'promptpay_sandbox',
      paymentIntentId: `pi_test_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
    })

    const invalidSignature = 'sha256=invalid_tampered_signature_hex_0000000000000000'
    const resInvalid = await fetch('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shadowmarket-signature': invalidSignature,
      },
      body: webhookPayload,
    })

    if (resInvalid.status === 400) {
      console.log('PASS: Webhook endpoint successfully rejected invalid HMAC signature with 400 Bad Request!')
    } else {
      throw new Error(`Expected 400 Bad Request for invalid signature, got: ${resInvalid.status}`)
    }

    // 4. Test Valid HMAC Signature Processing & Vault Key Allocation
    console.log('\n[4/6] Testing Valid Webhook Signature & Automatic Key Allocation (FIFO)...')
    const validSignature = signPayload(webhookPayload, webhookSecret)
    const resValid = await fetch('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shadowmarket-signature': validSignature,
      },
      body: webhookPayload,
    })

    const validJson = await resValid.json()
    if (resValid.status === 200 && validJson.success) {
      console.log('PASS: Webhook processed successfully! Response:', validJson)
    } else {
      throw new Error(`Webhook failed: ${resValid.status} - ${JSON.stringify(validJson)}`)
    }

    // 5. Verify PostgreSQL State (Order -> completed, Key -> assigned, Item -> key_id)
    console.log('\n[5/6] Verifying Database State Transition in PostgreSQL...')
    const { data: updatedOrder } = await admin
      .from('orders')
      .select('id, status, payment_intent_id')
      .eq('id', newOrder.id)
      .single()

    const { data: updatedItem } = await admin
      .from('order_items')
      .select('id, license_key_id')
      .eq('id', orderItem.id)
      .single()

    const { data: updatedKey } = await admin
      .from('license_keys')
      .select('id, status, order_id')
      .eq('id', updatedItem.license_key_id)
      .single()

    if (updatedOrder.status !== 'completed') {
      throw new Error(`Expected order status 'completed', got: ${updatedOrder.status}`)
    }
    if (!updatedItem.license_key_id) {
      throw new Error('OrderItem has no license_key_id assigned!')
    }
    if (updatedKey.status !== 'assigned' || updatedKey.order_id !== newOrder.id) {
      throw new Error(`Key assignment failed. Status: ${updatedKey.status}, OrderId: ${updatedKey.order_id}`)
    }

    console.log('PASS: Order Status transitioned to "completed"!')
    console.log(`PASS: Vault Key #${updatedKey.id} claimed and assigned to Order #${updatedKey.order_id}`)
    console.log(`PASS: OrderItem #${updatedItem.id} successfully linked to License Key #${updatedItem.license_key_id}`)

    // 6. Test Idempotency (Sending the same webhook event a 2nd time)
    console.log('\n[6/6] Testing Idempotency Protection (Duplicate Webhook Delivery)...')
    const resDuplicate = await fetch('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shadowmarket-signature': validSignature,
      },
      body: webhookPayload,
    })

    const duplicateJson = await resDuplicate.json()
    if (resDuplicate.status === 200 && duplicateJson.note?.toLowerCase().includes('already processed')) {
      console.log('PASS: Idempotency protection active! Duplicate event safely identified and handled:', duplicateJson.note)
    } else {
      throw new Error(`Idempotency check failed: ${JSON.stringify(duplicateJson)}`)
    }

    console.log('\n==================================================================')
    console.log('   ALL MILESTONE 6 PAYMENT & WEBHOOK LIFECYCLE TESTS PASSED (100%)')
    console.log('==================================================================\n')
  } catch (err) {
    console.error('TEST ERROR:', err)
    process.exit(1)
  }
}

runTest()
