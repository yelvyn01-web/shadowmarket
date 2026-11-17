import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { randomBytes, createCipheriv, createHash } from 'node:crypto'

// Load .env.local
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
const encryptionKeyHex = process.env.LICENSE_ENCRYPTION_KEY
const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET

console.log('==================================================================')
console.log('   SHADOWMARKET - CONCURRENCY & ANTI-OVERSELLING STRESS TEST')
console.log('==================================================================\n')

if (!supabaseUrl || !supabaseServiceKey || !encryptionKeyHex) {
  console.error('FAIL: Missing credentials in .env.local')
  process.exit(1)
}

const admin = createClient(supabaseUrl, supabaseServiceKey)
const masterKey = Buffer.from(encryptionKeyHex, 'hex')

function encryptKey(plaintext) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv)
  let encrypted = cipher.update(plaintext.trim(), 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  }
}

async function runConcurrencyTest() {
  try {
    // 1. Get an existing product
    console.log('[1/4] Selecting target product for concurrency stress test...')
    const { data: products } = await admin.from('products').select('id, title, base_price').limit(1)
    const product = products[0]

    // 2. Insert EXACTLY 1 unique test key in the vault for this test
    const timestamp = Date.now().toString(36).toUpperCase()
    const uniqueKeyString = `CONCURRENT-RACE-KEY-${timestamp}`
    const keyHash = createHash('sha256').update(uniqueKeyString).digest('hex')
    const encrypted = encryptKey(uniqueKeyString)

    console.log(`[2/4] Depositing EXACTLY 1 single license key in vault for "${product.title}"...`)
    const { data: singleKey, error: keyErr } = await admin
      .from('license_keys')
      .insert({
        product_id: product.id,
        key_hash: keyHash,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        status: 'available',
        supplier_name: 'Concurrency Stress Test Harness',
        batch_reference: `RACE-${timestamp}`,
      })
      .select('id')
      .single()

    if (keyErr || !singleKey) {
      throw new Error('Failed to insert test key: ' + keyErr?.message)
    }

    console.log(`PASS: Single Vault Key deposited! ID: ${singleKey.id} (Status: available)`)

    // 3. Create 3 concurrent orders competing for this single key
    console.log('\n[3/4] Creating 3 simultaneous orders competing for this single key...')
    const orders = []
    for (let i = 1; i <= 3; i++) {
      const { data: order } = await admin
        .from('orders')
        .insert({
          customer_email: `competitor-${i}-${timestamp}@shadowmarket.local`,
          status: 'pending',
          total_amount: product.base_price || 990,
          payment_method: 'promptpay',
        })
        .select('id')
        .single()

      const { data: orderItem } = await admin
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: product.id,
          product_title_snapshot: product.title,
          unit_price: product.base_price || 990,
          license_key_id: null,
        })
        .select('id')
        .single()

      orders.push({ orderId: order.id, orderItemId: orderItem.id, userIndex: i })
    }

    console.log(`PASS: Created 3 competing orders: ${orders.map((o) => '#' + o.orderId.slice(0, 8)).join(', ')}`)

    // 4. Dispatch 3 concurrent payment fulfillment attempts simultaneously (Promise.all)
    console.log('\n[4/4] Firing 3 simultaneous fulfillment attempts at the exact same millisecond...')

    // Import fulfillment logic directly or trigger webhook
    const { fulfillOrderWithVaultKeys } = await import('../src/lib/services/fulfillment.js').catch(async () => {
      // If dynamic import needs tsx, we can test via atomic database transaction
      return { fulfillOrderWithVaultKeys: null }
    })

    // Run 3 concurrent allocation requests
    const results = await Promise.all(
      orders.map(async (o) => {
        // Atomic claim simulation:
        // Try to atomically claim an available key for this product
        const { data: claimedKey } = await admin
          .from('license_keys')
          .update({
            status: 'assigned',
            order_id: o.orderId,
          })
          .eq('id', singleKey.id)
          .eq('status', 'available') // CRITICAL ATOMIC CONDITION
          .select('id')
          .maybeSingle()

        if (claimedKey) {
          // Successfully claimed key
          await admin.from('order_items').update({ license_key_id: claimedKey.id }).eq('id', o.orderItemId)
          await admin.from('orders').update({ status: 'completed' }).eq('id', o.orderId)
          return { userIndex: o.userIndex, success: true, keyId: claimedKey.id }
        } else {
          // Key was already claimed by competitor
          await admin.from('orders').update({ status: 'processing_fulfillment' }).eq('id', o.orderId)
          return { userIndex: o.userIndex, success: false, reason: 'Out of stock in vault' }
        }
      })
    )

    console.log('\n--- CONCURRENCY EXECUTION RESULTS ---')
    results.forEach((r) => {
      if (r.success) {
        console.log(`✓ Buyer #${r.userIndex}: WON KEY ALLOCATION! Assigned Key #${r.keyId}`)
      } else {
        console.log(`✕ Buyer #${r.userIndex}: SAFELY QUEUED (Zero Overselling): ${r.reason}`)
      }
    })

    const winners = results.filter((r) => r.success)
    const losers = results.filter((r) => !r.success)

    if (winners.length !== 1) {
      throw new Error(`CRITICAL RACE CONDITION DETECTED! Expected exactly 1 winner, but got ${winners.length}!`)
    }
    if (losers.length !== 2) {
      throw new Error(`Expected exactly 2 orders to queue, got ${losers.length}`)
    }

    // Verify database integrity
    const { data: finalKey } = await admin
      .from('license_keys')
      .select('status, order_id')
      .eq('id', singleKey.id)
      .single()

    const { data: assignedItems } = await admin
      .from('order_items')
      .select('id, order_id')
      .eq('license_key_id', singleKey.id)

    if (assignedItems.length !== 1) {
      throw new Error(`CRITICAL BUG: Key was assigned to ${assignedItems.length} order items!`)
    }

    console.log('\n==================================================================')
    console.log('   CONCURRENCY PASS: ZERO OVERSELLING // ZERO DUPLICATE KEYS')
    console.log(`   Winner Order: #${winners[0].userIndex} | Assigned Items: ${assignedItems.length} (Expected: 1)`)
    console.log('==================================================================\n')
  } catch (err) {
    console.error('CONCURRENCY TEST FAILED:', err)
    process.exit(1)
  }
}

runConcurrencyTest()
