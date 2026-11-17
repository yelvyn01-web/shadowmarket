import { createClient } from '@supabase/supabase-js'
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const encryptionKey = process.env.LICENSE_ENCRYPTION_KEY

console.log('=== SHADOWMARKET - DATABASE & SECURITY VERIFICATION ===')
console.log('Target URL:', supabaseUrl)

// 1. Verify AES-256-GCM Encryption Key
console.log('\n[1/3] Testing AES-256-GCM Encryption Engine...')
if (!encryptionKey || encryptionKey.length !== 64) {
  console.error('FAIL: LICENSE_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  process.exit(1)
}

try {
  const masterKey = Buffer.from(encryptionKey, 'hex')
  const iv = randomBytes(12)
  const sampleKey = 'W269N-WFGWX-YVC9B-4J6C9-T83GX'
  
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv)
  let encrypted = cipher.update(sampleKey, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  const decipher = createDecipheriv('aes-256-gcm', masterKey, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')

  if (decrypted === sampleKey) {
    console.log('PASS: AES-256-GCM encrypt/decrypt verified successfully!')
  } else {
    throw new Error('Decrypted string does not match original')
  }
} catch (err) {
  console.error('FAIL: AES-256-GCM encryption test failed:', err)
  process.exit(1)
}

// 2. Verify Supabase Anon Client Connectivity
console.log('\n[2/3] Testing Supabase Client Connectivity...')
const anonClient = createClient(supabaseUrl, supabaseAnonKey)
const { data: anonData, error: anonError } = await anonClient.from('products').select('count').limit(1)

if (anonError) {
  console.log('Note: Tables not yet created in PostgreSQL (Expected before SQL migration run):', anonError.message)
} else {
  console.log('PASS: Supabase connection active and products table reachable!')
}

// 3. Verify Admin Client Connectivity
console.log('\n[3/3] Testing Supabase Admin Service Role...')
const adminClient = createClient(supabaseUrl, supabaseServiceKey)
const { data: users, error: userError } = await adminClient.auth.admin.listUsers()

if (userError) {
  console.error('FAIL: Admin auth error:', userError.message)
} else {
  console.log(`PASS: Admin service role authenticated! (Found ${users.users.length} users in Auth)`)
}

console.log('\n=== VERIFICATION FINISHED ===')
