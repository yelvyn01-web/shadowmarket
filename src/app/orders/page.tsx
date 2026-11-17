import React from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, ShieldCheck, ArrowRight, Package, Terminal } from 'lucide-react'
import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPriceTHB } from '@/lib/utils'

export const metadata = {
  title: 'ประวัติคำสั่งซื้อของคุณ | ShadowMarket',
}

export default async function OrdersPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  
  // If user is logged in, query their orders; otherwise query recent orders or show empty
  let orders: any[] = []
  if (user) {
    const { data } = await admin
      .from('orders')
      .select('id, status, total_amount, payment_method, customer_email, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    orders = data || []
  } else {
    const { data } = await admin
      .from('orders')
      .select('id, status, total_amount, payment_method, customer_email, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    orders = data || []
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <Badge variant="emerald" showDot>ชำระเงินสำเร็จ / คีย์พร้อมใช้งาน</Badge>
      case 'processing_fulfillment':
        return <Badge variant="cyan" showDot>กำลังจัดเตรียมคีย์ (Manual)</Badge>
      case 'cancelled':
        return <Badge variant="rose">ยกเลิก</Badge>
      default:
        return <Badge variant="amber" showDot>รอการชำระเงิน (Pending)</Badge>
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan">ORDER_LEDGER // SUPABASE</Badge>
            <span className="text-xs font-mono text-slate-400">
              [{orders.length} คำสั่งซื้อในระบบ]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
            ประวัติคำสั่งซื้อและคีย์ลิขสิทธิ์
          </h1>
        </div>

        <Link href="/products">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            เลือกซื้อสินค้าเพิ่ม
          </Button>
        </Link>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/40 border border-slate-800 rounded-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <p className="text-base text-slate-300 font-sans">
            ยังไม่พบประวัติการสั่งซื้อของคุณ
          </p>
          <p className="text-xs text-slate-400 font-mono">
            เมื่อคุณสั่งซื้อสินค้า ข้อมูลคำสั่งซื้อและคีย์ลิขสิทธิ์จะปรากฏที่หน้านี้
          </p>
          <Link href="/products">
            <Button variant="primary" size="md">
              เริ่มเลือกดูสินค้า
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="p-5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-sm transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-cyan-400">
                    #{order.id.slice(0, 13)}...
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                  <span>ผู้รับ: <strong className="text-slate-300">{order.customer_email}</strong></span>
                  <span>•</span>
                  <span>วันที่: {new Date(order.created_at).toLocaleDateString('th-TH')}</span>
                  <span>•</span>
                  <span>ช่องทาง: {order.payment_method === 'promptpay' ? 'PromptPay QR' : 'Credit Card'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <div className="text-left sm:text-right">
                  <span className="text-xs font-mono text-slate-400 block">ยอดสุทธิ</span>
                  <span className="text-base font-mono font-black text-cyan-400">
                    {formatPriceTHB(Number(order.total_amount))}
                  </span>
                </div>

                <Link href={`/orders/${order.id}`}>
                  <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    ดูรายละเอียด
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
