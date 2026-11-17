import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Terminal,
  Printer,
  Copy,
  Eye,
  Lock,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPriceTHB } from '@/lib/utils'
import { LicenseDeliveryVault } from '@/components/shop/LicenseDeliveryVault'
import { OrderPaymentTrigger } from '@/components/shop/OrderPaymentTrigger'
import { PrintInvoiceButton } from '@/components/shop/PrintInvoiceButton'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: order, error } = await admin
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        product_id,
        product_title_snapshot,
        unit_price,
        license_key_id
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !order) {
    notFound()
  }

  const isPaid = order.status === 'paid' || order.status === 'completed' || order.status === 'processing_fulfillment'
  const isCompleted = order.status === 'completed'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Top back navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับไปยังรายการคำสั่งซื้อทั้งหมด
        </Link>

        <div className="flex items-center gap-3">
          <PrintInvoiceButton />
          <span className="text-xs font-mono text-cyan-400 hidden sm:inline">
            ORDER_LEDGER // RECEIPT_PRINT_MODE
          </span>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-sm space-y-8 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
        {/* Receipt Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="cyan">ใบเสร็จรับเงินดิจิทัล (OFFICIAL RECEIPT)</Badge>
              {isPaid ? (
                <Badge variant="emerald" showDot>
                  PAID & VERIFIED
                </Badge>
              ) : (
                <Badge variant="amber" showDot>
                  STATUS: {order.status.toUpperCase()}
                </Badge>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
              คำสั่งซื้อ #{order.id}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">
              วันที่ทำรายการ: {new Date(order.created_at).toLocaleString('th-TH')}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-400 space-y-1">
            <span className="block text-slate-200 font-bold">SHADOWMARKET VAULT</span>
            <span>Tax ID: 0105567890123 (สำนักงานใหญ่)</span>
            <span className="block text-emerald-400">Singapore SIN1 Node</span>
          </div>
        </div>

        {/* Pending Payment Action Banner */}
        {order.status === 'pending' && (
          <OrderPaymentTrigger
            orderId={order.id}
            totalAmount={Number(order.total_amount)}
            customerEmail={order.customer_email}
            defaultMethod={order.payment_method?.includes('card') ? 'card' : 'promptpay'}
          />
        )}

        {/* Processing Fulfillment Banner */}
        {order.status === 'processing_fulfillment' && (
          <div className="p-4 bg-cyan-950/40 border border-cyan-500/50 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                ชำระเงินสำเร็จแล้ว // อยู่ในขั้นตอนจัดส่งคีย์ลิขสิทธิ์
              </h4>
              <p className="text-xs text-slate-300 font-mono mt-1">
                คำสั่งซื้อได้รับการยืนยันยอดเงินผ่าน Webhook แล้ว เจ้าหน้าที่กำลังจัดส่งคีย์แท้เข้ารหัสให้คุณ
              </p>
            </div>
            <Badge variant="cyan" size="sm" showDot>
              PROCESSING FULFILLMENT
            </Badge>
          </div>
        )}

        {/* Customer & Payment Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-sm text-xs font-mono">
          <div className="space-y-1">
            <span className="text-slate-500 block">อีเมลผู้สั่งซื้อ:</span>
            <span className="text-slate-200 font-semibold">{order.customer_email}</span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 block">ช่องทางชำระเงิน:</span>
            <span className="text-cyan-400 font-semibold">
              {order.payment_method === 'promptpay' ? 'PromptPay QR (Sandbox)' : 'Credit Card (Sandbox)'}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 block">การส่งมอบ:</span>
            <span className="text-emerald-400 font-semibold">การเข้ารหัสลับ AES-256-GCM</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            รายการสินค้าที่สั่งซื้อ
          </h3>

          <div className="border border-slate-800 rounded-sm overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">รายการสินค้าลิขสิทธิ์</th>
                  <th className="py-2.5 px-4 text-center">ประเภท</th>
                  <th className="py-2.5 px-4 text-right">ราคา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                {order.order_items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-sans text-slate-200 font-semibold">
                      {item.product_title_snapshot}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="cyan" size="sm">
                        DIGITAL LICENSE
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-400">
                      {formatPriceTHB(Number(item.unit_price))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-slate-800 font-mono text-xs">
          <div className="text-slate-500 space-y-1">
            <p>• สินค้าทุกชิ้นได้รับการรับรองสิทธิ์จำหน่ายถูกต้องตามกฎหมาย 100%</p>
            <p>• คีย์ถูกเก็บรักษาด้วยการเข้ารหัสในฐานข้อมูล Supabase PostgreSQL</p>
          </div>

          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>ยอดรวมค่าสินค้า:</span>
              <span>{formatPriceTHB(Number(order.total_amount))}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
              <span className="text-slate-500">รวมในราคาสินค้าแล้ว</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold">
              <span className="text-white">ยอดสุทธิ:</span>
              <span className="text-lg text-cyan-400 font-mono">
                {formatPriceTHB(Number(order.total_amount))}
              </span>
            </div>
          </div>
        </div>

        {/* Digital Key Vault Section */}
        <div className="pt-6 border-t border-slate-800 space-y-4 print:border-none">
          <LicenseDeliveryVault
            orderId={order.id}
            orderStatus={order.status}
            items={
              order.order_items?.map((item: any) => ({
                id: item.id,
                productTitle: item.product_title_snapshot,
                unitPrice: Number(item.unit_price),
                licenseKeyId: item.license_key_id,
              })) || []
            }
          />
        </div>
      </div>
    </div>
  )
}
