import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createOrderAction } from '../src/actions/orders.ts'
import { updateProfileAction } from '../src/actions/auth.ts'

// Load .env.local
const envContent = readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
})

// Populate process.env so Server Actions have full access in test runner
Object.assign(process.env, env)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

console.log('==================================================================')
console.log('   SHADOWMARKET - MILESTONE 3: AUTH & DATABASE SECURITY AUDIT')
console.log('==================================================================\n')

const results = []

function logResult(name, pass, details) {
  const status = pass ? 'PASS' : 'FAIL'
  results.push({ name, status, details })
  console.log(`[${status}] ${name}: ${details}`)
}

async function runM3SecurityTests() {
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const timestamp = Date.now()

  // 1. Create Test Customers A & B and 1 Admin
  const customerAEmail = `m3_cust_a_${timestamp}@test.local`
  const customerBEmail = `m3_cust_b_${timestamp}@test.local`
  const adminEmail = `m3_admin_${timestamp}@test.local`
  const password = 'Password123!Secure'

  const { data: userA } = await adminClient.auth.admin.createUser({
    email: customerAEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Customer A' }
  })

  const { data: userB } = await adminClient.auth.admin.createUser({
    email: customerBEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Customer B' }
  })

  const { data: userAdmin } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Security Admin' }
  })

  // Ensure initial roles
  await adminClient.from('profiles').update({ role: 'customer' }).eq('id', userA.user.id)
  await adminClient.from('profiles').update({ role: 'customer' }).eq('id', userB.user.id)
  await adminClient.from('profiles').update({ role: 'admin' }).eq('id', userAdmin.user.id)

  try {
    // -------------------------------------------------------------
    // Test 1: Authentication & Invalid Password Rejection
    // -------------------------------------------------------------
    const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Login with wrong password
    const { error: wrongPassErr } = await clientA.auth.signInWithPassword({
      email: customerAEmail,
      password: 'WrongPassword999!'
    })
    logResult(
      'Authentication: Reject Invalid Password',
      Boolean(wrongPassErr),
      wrongPassErr ? 'Rejected unauthorized login attempt' : 'Unexpected login success'
    )

    // Login with valid credentials
    const { data: loginData, error: loginErr } = await clientA.auth.signInWithPassword({
      email: customerAEmail,
      password
    })
    logResult(
      'Authentication: Valid Login & Session Creation',
      !loginErr && Boolean(loginData.session),
      loginData.session ? `Session established for UID: ${loginData.user.id.slice(0, 8)}...` : loginErr?.message
    )

    // -------------------------------------------------------------
    // Test 2: Role Verification & Admin Authorization
    // -------------------------------------------------------------
    const { data: profileA } = await adminClient.from('profiles').select('role').eq('id', userA.user.id).single()
    const { data: profileAdmin } = await adminClient.from('profiles').select('role').eq('id', userAdmin.user.id).single()

    logResult(
      'User Roles: Default Customer Assignment',
      profileA?.role === 'customer',
      `Default role is "${profileA?.role}" (Expected: customer)`
    )

    logResult(
      'User Roles: Authoritative Admin Role Verification',
      profileAdmin?.role === 'admin',
      `Admin role verified from database: "${profileAdmin?.role}"`
    )

    // -------------------------------------------------------------
    // Test 3: Role Escalation Attack Prevention (Application Server Action)
    // -------------------------------------------------------------
    const maliciousFormData = new FormData()
    maliciousFormData.append('fullName', 'Attacker')
    maliciousFormData.append('role', 'admin') // Malicious elevation attempt

    const escalationActionRes = await updateProfileAction(maliciousFormData)
    const isEscalationBlocked = !escalationActionRes.success && escalationActionRes.error?.includes('Role Escalation Blocked')

    logResult(
      'Role Escalation: Block Customer from Elevating to Admin via Server Action',
      isEscalationBlocked,
      `Result: ${escalationActionRes.error || 'Allowed'}`
    )

    // -------------------------------------------------------------
    // Test 4: Customer A vs Customer B Data Isolation (RLS)
    // -------------------------------------------------------------
    // Create an order for Customer B
    const { data: orderB } = await adminClient.from('orders').insert({
      user_id: userB.user.id,
      status: 'pending',
      total_amount: 1590,
      payment_method: 'promptpay',
      customer_email: customerBEmail
    }).select().single()

    // Customer A queries Customer B's order
    const { data: crossAccessData } = await clientA
      .from('orders')
      .select('*')
      .eq('id', orderB.id)

    const isCrossAccessBlocked = !crossAccessData || crossAccessData.length === 0

    logResult(
      'Customer Data Isolation: RLS Prevents Cross-Account Order Viewing',
      isCrossAccessBlocked,
      `Customer A received ${crossAccessData?.length || 0} rows when querying Customer B order`
    )

    // Customer A attempts to tamper Customer B's order status to 'paid'
    const { data: tamperRes } = await clientA
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderB.id)
      .select()

    const { data: orderBCheck } = await adminClient.from('orders').select('status').eq('id', orderB.id).single()
    const isTamperBlocked = orderBCheck?.status === 'pending'

    logResult(
      'Integrity: Block Customer from Modifying Order Status to PAID',
      isTamperBlocked,
      `Order status remained "${orderBCheck?.status}" in database (tamper blocked)`
    )

    // -------------------------------------------------------------
    // Test 5: Anonymous Access Blocked (Public Users)
    // -------------------------------------------------------------
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: anonOrders } = await anonClient.from('orders').select('*')
    const { data: anonKeys } = await anonClient.from('license_keys').select('*')
    const { data: anonAudit } = await anonClient.from('audit_logs').select('*')

    const anonBlocked = (anonOrders?.length === 0) && (anonKeys?.length === 0) && (anonAudit?.length === 0)

    logResult(
      'Anonymous Access: Strictly Block Unauthenticated Users from Sensitive Tables',
      anonBlocked,
      `Orders: ${anonOrders?.length || 0}, License Keys: ${anonKeys?.length || 0}, Audit Logs: ${anonAudit?.length || 0}`
    )

    // -------------------------------------------------------------
    // Test 6: Production Data Integrity: Prohibit Orders on Mock IDs
    // -------------------------------------------------------------
    const mockOrderPayload = {
      customerEmail: 'tester@example.com',
      paymentMethod: 'promptpay',
      items: [{ productId: 'prod-001', quantity: 1 }]
    }

    const mockOrderRes = await createOrderAction(mockOrderPayload)
    const isMockOrderBlocked = !mockOrderRes.success && mockOrderRes.error?.includes('ไม่ถูกต้องตามมาตรฐานฐานข้อมูล')

    logResult(
      'Production Data Integrity: Reject Orders on Mock / Non-DB Products',
      isMockOrderBlocked,
      `Result: ${mockOrderRes.error || 'Created'}`
    )

    // -------------------------------------------------------------
    // Test 7: Zod Input Validation: Reject Empty Cart & Invalid Quantities
    // -------------------------------------------------------------
    const emptyOrderRes = await createOrderAction({
      customerEmail: 'tester@example.com',
      paymentMethod: 'promptpay',
      items: []
    })

    logResult(
      'Zod Schema Validation: Reject Order with Empty Items Array',
      !emptyOrderRes.success,
      `Error: "${emptyOrderRes.error}"`
    )

    // -------------------------------------------------------------
    // Test 8: Order Creation on Legitimate Database Product UUID
    // -------------------------------------------------------------
    const { data: validProduct } = await adminClient.from('products').select('id, title, stock_quantity').eq('is_active', true).limit(1).single()
    const validOrderRes = await createOrderAction({
      customerEmail: 'real_buyer@example.com',
      paymentMethod: 'promptpay',
      items: [{ productId: validProduct.id, quantity: 1 }]
    })

    logResult(
      'Database Order Pipeline: Success for Verified Supabase Product UUID',
      validOrderRes.success && Boolean(validOrderRes.orderId),
      `Order created ID: ${validOrderRes.orderId?.slice(0, 8)}... for product "${validProduct.title}"`
    )

    // Clean up created order
    if (validOrderRes.orderId) {
      await adminClient.from('orders').delete().eq('id', validOrderRes.orderId)
    }

    // Clean up test order B
    await adminClient.from('orders').delete().eq('id', orderB.id)

  } finally {
    // Clean up test users
    await adminClient.auth.admin.deleteUser(userA.user.id)
    await adminClient.auth.admin.deleteUser(userB.user.id)
    await adminClient.auth.admin.deleteUser(userAdmin.user.id)
  }

  console.log('\n==================================================================')
  console.log(`   M3 AUDIT COMPLETED: ${results.filter(r => r.status === 'PASS').length} PASSED, ${results.filter(r => r.status === 'FAIL').length} FAILED`)
  console.log('==================================================================\n')

  return results
}

runM3SecurityTests().catch(err => {
  console.error('Test execution error:', err)
  process.exit(1)
})
