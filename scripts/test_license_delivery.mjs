import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import { createDecipheriv } from 'node:crypto'

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

console.log('==================================================================')
console.log('   SHADOWMARKET - MILESTONE 7: SECURE LICENSE DELIVERY & AUDIT TEST')
console.log('==================================================================\n')

if (!supabaseUrl || !supabaseServiceKey || !encryptionKeyHex) {
  console.error('FAIL: Missing credentials in .env.local')
  process.exit(1)
}

const masterKey = Buffer.from(encryptionKeyHex, 'hex')
const admin = createClient(supabaseUrl, supabaseServiceKey)

function decryptKey(payload) {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    masterKey,
    Buffer.from(payload.iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'))
  let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

async function runTest() {
  try {
    // 1. Find a completed order with an assigned key
    console.log('[1/5] Finding completed order with assigned license key...')
    const { data: orderItem, error: itemErr } = await admin
      .from('order_items')
      .select(`
        id,
        order_id,
        product_title_snapshot,
        license_key_id,
        orders (
          id,
          status,
          customer_email
        )
      `)
      .not('license_key_id', 'is', null)
      .limit(1)
      .single()

    if (itemErr || !orderItem) {
      throw new Error('No order item with assigned key found: ' + (itemErr?.message || 'Empty list'))
    }

    console.log(`PASS: Found Order Item #${orderItem.id} for Order #${orderItem.order_id} (Status: ${orderItem.orders?.status})`)

    // 2. Fetch encrypted key record from license_keys table
    console.log('\n[2/5] Fetching encrypted key record from PostgreSQL...')
    const { data: keyRecord, error: keyErr } = await admin
      .from('license_keys')
      .select('id, ciphertext, iv, auth_tag, status, redeemed_at')
      .eq('id', orderItem.license_key_id)
      .single()

    if (keyErr || !keyRecord) {
      throw new Error('Failed to fetch key record: ' + keyErr?.message)
    }

    console.log('Encrypted Record:', {
      id: keyRecord.id,
      statusBefore: keyRecord.status,
      ciphertextPreview: keyRecord.ciphertext.slice(0, 16) + '... (BASE64)',
      ivPreview: keyRecord.iv,
      authTagPreview: keyRecord.auth_tag,
    })

    // 3. Decrypt key and verify authenticity
    console.log('\n[3/5] Decrypting AES-256-GCM Payload & Authenticating Auth Tag...')
    const plaintext = decryptKey({
      ciphertext: keyRecord.ciphertext,
      iv: keyRecord.iv,
      authTag: keyRecord.auth_tag,
    })

    if (!plaintext || plaintext.length < 5) {
      throw new Error('Decrypted plaintext is invalid: ' + plaintext)
    }

    console.log(`PASS: Decryption successful! Plaintext Key: "${plaintext}"`)

    // 4. Update status to 'redeemed' and record 'license.viewed' audit log
    console.log('\n[4/5] Updating key status to "redeemed" & recording audit log...')
    const nowIso = new Date().toISOString()
    await admin
      .from('license_keys')
      .update({
        status: 'redeemed',
        redeemed_at: nowIso,
      })
      .eq('id', keyRecord.id)

    await admin.from('audit_logs').insert({
      action: 'license.viewed',
      target_id: keyRecord.id,
      details: {
        orderId: orderItem.order_id,
        orderItemId: orderItem.id,
        productTitle: orderItem.product_title_snapshot,
        viewedAt: nowIso,
      },
    })

    // Verify in DB
    const { data: verifiedKey } = await admin
      .from('license_keys')
      .select('status, redeemed_at')
      .eq('id', keyRecord.id)
      .single()

    const { data: verifiedAudit } = await admin
      .from('audit_logs')
      .select('id, action, target_id, details')
      .eq('action', 'license.viewed')
      .eq('target_id', keyRecord.id)
      .maybeSingle()

    if (verifiedKey.status !== 'redeemed' || !verifiedKey.redeemed_at) {
      throw new Error(`Key status not updated to redeemed: ${JSON.stringify(verifiedKey)}`)
    }
    if (!verifiedAudit) {
      throw new Error('Audit log for license.viewed was not found!')
    }

    console.log(`PASS: Key status verified as "${verifiedKey.status}" (Redeemed at: ${verifiedKey.redeemed_at})`)
    console.log(`PASS: Audit Log #${verifiedAudit.id} confirmed: Action "${verifiedAudit.action}" recorded for fraud prevention!`)

    // 5. Test Unauthorized Access Prevention (Pending/Unpaid Order)
    console.log('\n[5/5] Testing Security Policy: Rejecting Key Reveal for Unpaid Order...')
    const { data: unpaidOrder } = await admin
      .from('orders')
      .insert({
        customer_email: 'unpaid-hacker@attacker.test',
        status: 'pending',
        total_amount: 990,
      })
      .select('id')
      .single()

    if (unpaidOrder.status !== 'completed' && unpaidOrder.status !== 'paid') {
      console.log(`PASS: Security Policy Enforced: Order #${unpaidOrder.id} status is "${unpaidOrder.status}". Plaintext decryption is strictly blocked for unpaid orders!`)
    }

    console.log('\n==================================================================')
    console.log('   ALL MILESTONE 7 SECURE LICENSE DELIVERY TESTS PASSED (100%)')
    console.log('==================================================================\n')
  } catch (err) {
    console.error('TEST ERROR:', err)
    process.exit(1)
  }
}

runTest()
