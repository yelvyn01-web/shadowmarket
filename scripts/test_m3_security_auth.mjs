import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createOrderAction } from '../src/actions/orders.ts'
import { signupAction, forgotPasswordAction, updateProfileAction } from '../src/actions/auth.ts'

// Load .env.local
const envContent = readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
})

// Populate process.env so Server Actions have full environment access
Object.assign(process.env, env)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

console.log('==================================================================')
console.log('   SHADOWMARKET - M3 FINAL SECURITY & RLS AUDIT SUITE')
console.log('==================================================================\n')

const results = []

function recordTest(category, name, pass, evidence) {
  const status = pass ? 'PASS' : 'FAIL'
  results.push({ category, name, status, evidence })
  console.log(`[${status}] [${category}] ${name}: ${evidence}`)
}

async function runM3FinalSecurityAudit() {
  // Bootstrap Admin Client strictly for fixture setup/teardown
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const timestamp = Date.now()

  const passwordA = 'Pass#CustomerA123!'
  const passwordB = 'Pass#CustomerB123!'
  const emailA = `cust_a_${timestamp}@test.shadowmarket.local`
  const emailB = `cust_b_${timestamp}@test.shadowmarket.local`

  // 1. Create Mock Customers A and B
  const { data: userAData, error: errA } = await adminClient.auth.admin.createUser({
    email: emailA,
    password: passwordA,
    email_confirm: true,
    user_metadata: { full_name: 'Customer Alice' }
  })

  const { data: userBData, error: errB } = await adminClient.auth.admin.createUser({
    email: emailB,
    password: passwordB,
    email_confirm: true,
    user_metadata: { full_name: 'Customer Bob' }
  })

  if (errA || errB) {
    throw new Error(`Failed to initialize test users: ${errA?.message || errB?.message}`)
  }

  const userA = userAData.user
  const userB = userBData.user

  // Ensure role is strictly 'customer'
  await adminClient.from('profiles').update({ role: 'customer' }).eq('id', userA.id)
  await adminClient.from('profiles').update({ role: 'customer' }).eq('id', userB.id)

  // Create Order A (belonging to Customer A)
  const { data: orderA } = await adminClient.from('orders').insert({
    user_id: userA.id,
    status: 'pending',
    total_amount: 1290,
    payment_method: 'promptpay',
    customer_email: emailA
  }).select().single()

  // Create Order B (belonging to Customer B)
  const { data: orderB } = await adminClient.from('orders').insert({
    user_id: userB.id,
    status: 'pending',
    total_amount: 790,
    payment_method: 'card',
    customer_email: emailB
  }).select().single()

  // Authenticate Customer A using Public Anon Key (Creates JWT Session A)
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: sessionA } = await clientA.auth.signInWithPassword({
    email: emailA,
    password: passwordA
  })

  // Authenticate Customer B using Public Anon Key (Creates JWT Session B)
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: sessionB } = await clientB.auth.signInWithPassword({
    email: emailB,
    password: passwordB
  })

  // Anonymous Client (No Session)
  const clientAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    console.log('--- 1. RLS CRUD Matrix Tests (Customer A Session vs Customer B Order) ---')
    
    // 1. SELECT Permissions
    const { data: aReadsOwn } = await clientA.from('orders').select('*').eq('id', orderA.id)
    recordTest(
      'RLS SELECT',
      'Customer A reads own order',
      aReadsOwn?.length === 1 && aReadsOwn[0].id === orderA.id,
      `Returned ${aReadsOwn?.length} row(s) for own order (Expected: 1)`
    )

    const { data: aReadsB } = await clientA.from('orders').select('*').eq('id', orderB.id)
    recordTest(
      'RLS SELECT',
      'Customer A reads Customer B order (Cross-Account)',
      !aReadsB || aReadsB.length === 0,
      `Returned ${aReadsB?.length || 0} row(s) (Expected: 0 - Blocked by RLS)`
    )

    // 2. INSERT Permissions
    const { data: spoofInsertRes, error: spoofInsertErr } = await clientA.from('orders').insert({
      user_id: userB.id, // Attempt to create order under Customer B
      status: 'pending',
      total_amount: 9999,
      customer_email: 'attacker@spoof.local'
    }).select()
    recordTest(
      'RLS INSERT',
      'Customer A inserts order spoofing Customer B user_id',
      Boolean(spoofInsertErr) || !spoofInsertRes || spoofInsertRes.length === 0,
      `Result: ${spoofInsertErr ? spoofInsertErr.message : 'Blocked 0 rows inserted'}`
    )

    // 3. UPDATE Permissions
    const { data: aUpdatesB } = await clientA.from('orders').update({ total_amount: 1 }).eq('id', orderB.id).select()
    recordTest(
      'RLS UPDATE',
      'Customer A updates Customer B order',
      !aUpdatesB || aUpdatesB.length === 0,
      `Updated ${aUpdatesB?.length || 0} row(s) (Expected: 0 - Blocked by RLS)`
    )

    const { data: aUpdatesOwnStatus } = await clientA.from('orders').update({ status: 'paid' }).eq('id', orderA.id).select()
    const { data: orderACheck } = await adminClient.from('orders').select('status').eq('id', orderA.id).single()
    recordTest(
      'RLS UPDATE',
      'Customer A attempts to tamper own order status to PAID',
      (!aUpdatesOwnStatus || aUpdatesOwnStatus.length === 0) && orderACheck?.status === 'pending',
      `Order status in DB remained "${orderACheck?.status}" (Expected: pending)`
    )

    // 4. DELETE Permissions
    const { data: aDeletesB } = await clientA.from('orders').delete().eq('id', orderB.id).select()
    recordTest(
      'RLS DELETE',
      'Customer A deletes Customer B order',
      !aDeletesB || aDeletesB.length === 0,
      `Deleted ${aDeletesB?.length || 0} row(s) (Expected: 0 - Blocked by RLS)`
    )

    const { data: aDeletesOwn } = await clientA.from('orders').delete().eq('id', orderA.id).select()
    recordTest(
      'RLS DELETE',
      'Customer A deletes own order',
      !aDeletesOwn || aDeletesOwn.length === 0,
      `Deleted ${aDeletesOwn?.length || 0} row(s) (Expected: 0 - Customer cannot DELETE orders)`
    )

    console.log('\n--- 2. License Keys & Audit Logs Protection ---')
    const { data: aReadsKeys } = await clientA.from('license_keys').select('*')
    recordTest(
      'Vault Security',
      'Customer A directly SELECT from license_keys',
      !aReadsKeys || aReadsKeys.length === 0,
      `Returned ${aReadsKeys?.length || 0} row(s) (Expected: 0 - Customers have 0 SELECT on vault)`
    )

    const { data: aReadsAudit } = await clientA.from('audit_logs').select('*')
    recordTest(
      'Audit Security',
      'Customer A directly SELECT from audit_logs',
      !aReadsAudit || aReadsAudit.length === 0,
      `Returned ${aReadsAudit?.length || 0} row(s) (Expected: 0 - Admin only table)`
    )

    console.log('\n--- 3. Anonymous User Isolation ---')
    const { data: anonOrders } = await clientAnon.from('orders').select('*')
    const { data: anonKeys } = await clientAnon.from('license_keys').select('*')
    const { data: anonAudit } = await clientAnon.from('audit_logs').select('*')
    const isAnonBlocked = (anonOrders?.length === 0) && (anonKeys?.length === 0) && (anonAudit?.length === 0)
    recordTest(
      'Anonymous Guard',
      'Unauthenticated public access to sensitive tables',
      isAnonBlocked,
      `Orders: ${anonOrders?.length || 0}, Vault Keys: ${anonKeys?.length || 0}, Audit: ${anonAudit?.length || 0}`
    )

    console.log('\n--- 4. Password Security & Anti-Enumeration ---')
    // Password min length: 11 chars should fail
    const shortPassFormData = new FormData()
    shortPassFormData.append('email', 'short_pass@test.local')
    shortPassFormData.append('password', 'Pass1234567') // 11 chars
    const shortSignupRes = await signupAction(shortPassFormData)
    recordTest(
      'Password Policy',
      'Enforce minimum 12 characters on Registration',
      !shortSignupRes.success && shortSignupRes.error?.includes('12 ตัวอักษร'),
      `Result: ${shortSignupRes.error}`
    )

    // User Enumeration on Forgot Password
    const forgotFormData = new FormData()
    forgotFormData.append('email', 'completely_non_existent_99999@domain.local')
    const forgotRes = await forgotPasswordAction(forgotFormData)
    recordTest(
      'Anti-Enumeration',
      'Forgot Password returns generic message for non-existent email',
      forgotRes.success && forgotRes.data?.message?.includes('หากอีเมลนี้ลงทะเบียนไว้ในระบบ'),
      `Message: "${forgotRes.data?.message}"`
    )

    console.log('\n--- 5. Order Creation & Inventory Integrity ---')
    // Prohibit fake/mock product IDs
    const mockOrderRes = await createOrderAction({
      customerEmail: 'test@example.com',
      paymentMethod: 'promptpay',
      items: [{ productId: 'prod-001', quantity: 1 }]
    })
    recordTest(
      'Order Integrity',
      'Strictly reject mock product ID (prod-001)',
      !mockOrderRes.success && mockOrderRes.error?.includes('ไม่ถูกต้องตามมาตรฐานฐานข้อมูล'),
      `Error: "${mockOrderRes.error}"`
    )

    // Server-side price recalculation & verification with legitimate DB product
    const { data: validProduct } = await adminClient
      .from('products')
      .select('id, title, base_price, sale_price, stock_quantity')
      .eq('is_active', true)
      .limit(1)
      .single()

    const legitimateOrderRes = await createOrderAction({
      customerEmail: 'valid_buyer@example.com',
      paymentMethod: 'promptpay',
      items: [{ productId: validProduct.id, quantity: 1 }]
    })
    recordTest(
      'Order Pipeline',
      'Create verified order from real PostgreSQL product UUID',
      legitimateOrderRes.success && Boolean(legitimateOrderRes.orderId),
      `Order created: #${legitimateOrderRes.orderId?.slice(0, 8)}... for "${validProduct.title}"`
    )

    // Verify created order amount matches server-calculated price from DB
    if (legitimateOrderRes.orderId) {
      const { data: orderDetails } = await adminClient
        .from('orders')
        .select('total_amount')
        .eq('id', legitimateOrderRes.orderId)
        .single()

      const expectedPrice = validProduct.sale_price !== null && validProduct.sale_price !== undefined
        ? Number(validProduct.sale_price)
        : Number(validProduct.base_price)

      recordTest(
        'Price Guard',
        'Server-side price computation matches Supabase database price exactly',
        Number(orderDetails?.total_amount) === expectedPrice,
        `Computed: ${orderDetails?.total_amount} THB (DB Price: ${expectedPrice} THB)`
      )

      // Clean up legitimate order
      await adminClient.from('orders').delete().eq('id', legitimateOrderRes.orderId)
    }

  } finally {
    // Teardown test orders & test users
    await adminClient.from('orders').delete().in('id', [orderA.id, orderB.id])
    await adminClient.auth.admin.deleteUser(userA.id)
    await adminClient.auth.admin.deleteUser(userB.id)
  }

  console.log('\n==================================================================')
  const passCount = results.filter(r => r.status === 'PASS').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  console.log(`   FINAL AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('==================================================================\n')

  return results
}

runM3FinalSecurityAudit().catch(err => {
  console.error('Audit execution failed:', err)
  process.exit(1)
})
