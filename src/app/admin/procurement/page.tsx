import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/roles'
import {
  getLicenseInventoryAction,
  getManualFulfillmentQueueAction,
} from '@/actions/procurement'
import { ProcurementDashboard } from '@/components/admin/ProcurementDashboard'

export const metadata: Metadata = {
  title: 'ระบบจัดซื้อ & คลังคีย์ลิขสิทธิ์นิรภัย | ShadowMarket Admin',
  description: 'ระบบจัดการคลังคีย์ลิขสิทธิ์ดิจิทัล เข้ารหัส AES-256-GCM ป้องกันการทำซ้ำ และคิวจัดส่งสินค้าตามสั่ง',
}

export const dynamic = 'force-dynamic'

export default async function ProcurementPage() {
  // Authoritative Server-side Role Guard
  try {
    await requireAdmin()
  } catch {
    redirect('/login?next=/admin/procurement&error=admin_required')
  }

  const admin = createAdminClient()

  // 1. Fetch all products for selector
  const { data: products } = await admin
    .from('products')
    .select('id, title, platform, stock_quantity')
    .eq('is_active', true)
    .order('title', { ascending: true })

  // 2. Fetch recent inventory
  const inventory = await getLicenseInventoryAction()

  // 3. Fetch pending queue
  const queue = await getManualFulfillmentQueueAction()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ProcurementDashboard
        products={products || []}
        initialInventory={inventory as any}
        initialQueue={queue as any}
      />
    </div>
  )
}
