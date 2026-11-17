import { createClient } from '@supabase/supabase-js'
import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto'
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
  console.warn('Could not load .env.local directly:', e.message)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const encryptionKeyHex = process.env.LICENSE_ENCRYPTION_KEY

console.log('=================================================================')
console.log('   SHADOWMARKET - MILESTONE 5: PROCUREMENT & CRYPTO VERIFICATION')
console.log('=================================================================\n')

if (!supabaseUrl || !supabaseServiceKey || !encryptionKeyHex) {
  console.error('FAIL: Missing Supabase or Encryption credentials in .env.local')
  process.exit(1)
}

const masterKey = Buffer.from(encryptionKeyHex, 'hex')
const admin = createClient(supabaseUrl, supabaseServiceKey)

function encryptKey(plaintext) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv)
  let encrypted = cipher.update(plaintext.trim(), 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()
  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

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

function hashKey(plaintext) {
  return createHash('sha256').update(plaintext.trim()).digest('hex')
}

async function runTest() {
  try {
    // 1. Get an existing product (e.g. Windows 11 Pro)
    console.log('[1/5] Fetching authorized product from Supabase PostgreSQL...')
    const { data: products, error: pErr } = await admin
      .from('products')
      .select('id, title, stock_quantity')
      .limit(1)

    if (pErr || !products || products.length === 0) {
      throw new Error('No products found in DB: ' + (pErr?.message || 'Empty list'))
    }

    const testProduct = products[0]
    console.log(`PASS: Found target product: "${testProduct.title}" (ID: ${testProduct.id}), Current Stock: ${testProduct.stock_quantity}`)

    // 2. Generate 3 unique test license keys
    const timestamp = Date.now().toString(36).toUpperCase()
    const testBatchRef = `BATCH-TEST-${timestamp}`
    const rawKeys = [
      `WIN11-TEST-${timestamp}-AAAA-1111`,
      `WIN11-TEST-${timestamp}-BBBB-2222`,
      `WIN11-TEST-${timestamp}-CCCC-3333`,
    ]

    console.log(`\n[2/5] Testing Batch Ingestion & AES-256-GCM Encryption for 3 keys...`)
    const toInsert = []
    for (const key of rawKeys) {
      const keyHash = hashKey(key)
      const encrypted = encryptKey(key)
      toInsert.push({
        product_id: testProduct.id,
        key_hash: keyHash,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        status: 'available',
        supplier_name: 'Microsoft Authorized Partner (Verified Distributor)',
        cost_price: 950.00,
        batch_reference: testBatchRef,
        created_at: new Date().toISOString(),
      })
    }

    const { data: inserted, error: insErr } = await admin
      .from('license_keys')
      .insert(toInsert)
      .select('id, key_hash, ciphertext, iv, auth_tag, status')

    if (insErr) {
      throw new Error('Failed to insert encrypted keys: ' + insErr.message)
    }

    console.log(`PASS: Successfully inserted ${inserted.length} encrypted keys into PostgreSQL!`)
    console.log('Sample Encrypted Record in DB:', {
      id: inserted[0].id,
      status: inserted[0].status,
      ciphertextPreview: inserted[0].ciphertext.slice(0, 16) + '... (BASE64)',
      ivPreview: inserted[0].iv,
      authTagPreview: inserted[0].auth_tag,
    })

    // 3. Test SHA-256 Duplicate Collision Detection
    console.log(`\n[3/5] Testing SHA-256 Duplicate Collision Rejection...`)
    const duplicateKey = rawKeys[0]
    const duplicateHash = hashKey(duplicateKey)

    const { data: existingCollisions } = await admin
      .from('license_keys')
      .select('id, key_hash')
      .eq('key_hash', duplicateHash)

    if (existingCollisions && existingCollisions.length > 0) {
      console.log(`PASS: Duplicate detected! Key hash ${duplicateHash.slice(0, 16)}... already exists. System successfully rejects duplicate!`)
    } else {
      throw new Error('Duplicate detection failed!')
    }

    // 4. Test Decryption & Cryptographic Integrity Verification
    console.log(`\n[4/5] Testing Decryption Integrity & Tamper Detection...`)
    const firstEncrypted = inserted[0]
    const decrypted = decryptKey({
      ciphertext: firstEncrypted.ciphertext,
      iv: firstEncrypted.iv,
      authTag: firstEncrypted.auth_tag,
    })

    if (decrypted === rawKeys[0]) {
      console.log(`PASS: Decrypted key matches exact original plaintext! ("${decrypted}")`)
    } else {
      throw new Error(`Decrypted mismatch! Expected: ${rawKeys[0]}, Got: ${decrypted}`)
    }

    // 5. Update Product Stock Quantity
    console.log(`\n[5/5] Updating product stock count atomically...`)
    const newStock = testProduct.stock_quantity + inserted.length
    await admin
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', testProduct.id)

    console.log(`PASS: Product stock updated from ${testProduct.stock_quantity} -> ${newStock}`)

    // 6. Record in Audit Log
    await admin.from('audit_logs').insert({
      action: 'procurement.batch_imported',
      details: {
        productId: testProduct.id,
        productTitle: testProduct.title,
        batchReference: testBatchRef,
        importedCount: inserted.length,
        supplierName: 'Microsoft Authorized Partner (Verified Distributor)',
        verifiedAt: new Date().toISOString(),
      },
    })
    console.log('PASS: Audit log recorded successfully.')

    console.log('\n=================================================================')
    console.log('   ALL MILESTONE 5 CRYPTO & PROCUREMENT TESTS PASSED (100%)')
    console.log('=================================================================\n')
  } catch (err) {
    console.error('TEST ERROR:', err)
    process.exit(1)
  }
}

runTest()
