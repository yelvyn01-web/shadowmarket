'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Zap,
  CreditCard,
  QrCode,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Terminal,
  ShoppingBag,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatPriceTHB } from '@/lib/utils'
import { createOrderAction } from '@/actions/orders'
import { SandboxPaymentModal } from '@/components/shop/SandboxPaymentModal'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()

  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'card'>('promptpay')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerEmail || !agreeTerms) return

    setIsProcessing(true)
    setErrorMessage(null)

    // Format items for Server Action
    const payloadItems = items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }))

    const res = await createOrderAction({
      customerEmail,
      customerName,
      paymentMethod,
      items: payloadItems,
    })

    setIsProcessing(false)

    if (res.success && res.orderId) {
      setCreatedOrder({
        orderId: res.orderId,
        email: customerEmail,
        amount: subtotal,
      })
      clearCart()
      setIsPaymentModalOpen(true)
    } else {
      setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการประมวลผลคำสั่งซื้อ')
    }
  }

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const copyKey = (id: string, keyText: string) => {
    navigator.clipboard.writeText(keyText)
    setCopiedKeyId(id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  // If order is completed in Sandbox, show the instant License Vault Delivery screen!
  if (createdOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        {/* Success Header */}
        <div className="p-6 sm:p-8 bg-slate-900/90 border border-emerald-500/50 rounded-sm space-y-4 shadow-[0_0_30px_rgba(5,255,161,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_#05ffa1]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="emerald" showDot>
                  DATABASE ORDER RECORDED
                </Badge>
                <span className="text-xs font-mono text-slate-400">
                  ID: #{createdOrder.orderId}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-sans mt-0.5">
                บันทึกคำสั่งซื้อลงฐานข้อมูลเรียบร้อยแล้ว!
              </h1>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
            ระบบได้บันทึกคำสั่งซื้อของคุณลงในฐานข้อมูล Supabase PostgreSQL (ตาราง `orders` และ `order_items`) และจำลองการส่งมอบคีย์ไปยังอีเมล{' '}
            <strong className="text-cyan-400 font-mono">{createdOrder.email}</strong> เรียบร้อยแล้ว
          </p>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>โหมดการทำงาน: Sandbox Verification (บันทึกข้อมูลจริงในฐานข้อมูล โดยไม่มีการตัดเงินจริง)</span>
          </div>
        </div>

        {/* Instant License Key Reveal Box */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>รหัสลิขสิทธิ์จำลอง (ENCRYPTED LICENSE VAULT)</span>
            </div>
            <Badge variant="cyan" size="sm">
              AES-256-GCM READY
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">
                  รายการสั่งซื้อ #{createdOrder.orderId.slice(0, 8)}...
                </span>
                <Badge variant="emerald" size="sm">
                  สถานะ: รอส่งมอบอัตโนมัติ
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-700/80 rounded px-3.5 py-2.5 font-mono text-xs sm:text-sm text-slate-100 flex items-center justify-between">
                  <span className={revealedKeys['key-1'] ? 'text-emerald-400 font-bold select-all' : 'text-slate-500 select-none'}>
                    {revealedKeys['key-1'] ? 'W269N-WFGWX-YVC9B-4J6C9-T83GX' : '•••••-•••••-•••••-•••••-T83GX'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {revealedKeys['key-1'] ? '[DECRYPTED]' : '[PROTECTED]'}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleRevealKey('key-1')}
                    leftIcon={revealedKeys['key-1'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  >
                    {revealedKeys['key-1'] ? 'ซ่อน' : 'เปิดดูคีย์'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!revealedKeys['key-1']}
                    onClick={() => copyKey('key-1', 'W269N-WFGWX-YVC9B-4J6C9-T83GX')}
                    leftIcon={copiedKeyId === 'key-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedKeyId === 'key-1' ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => setIsPaymentModalOpen(true)}
              leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
            >
              เปิดหน้าต่างชำระเงินจำลอง (Sandbox Pay)
            </Button>
            <Link href={`/orders/${createdOrder.orderId}`}>
              <Button variant="secondary">ดูรายละเอียดใบเสร็จคำสั่งซื้อ</Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost">เลือกซื้อสินค้าต่อ</Button>
            </Link>
          </div>
        </div>

        {/* Sandbox Payment Modal */}
        <SandboxPaymentModal
          orderId={createdOrder.orderId}
          totalAmount={createdOrder.amount}
          customerEmail={createdOrder.email}
          defaultMethod={paymentMethod}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      </div>
    )
  }

  // Normal Checkout Form
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div className="space-y-1 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">CHECKOUT GATEWAY</Badge>
          <span className="text-xs font-mono text-emerald-400">
            [PIPELINE: POSTGRESQL ATOMIC WRITE]
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          ยืนยันคำสั่งซื้อและการชำระเงิน
        </h1>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/70 border border-rose-500/50 rounded flex items-start gap-3 text-xs text-rose-300 font-sans">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form (7 cols) */}
        <form onSubmit={handleSimulatePayment} className="lg:col-span-7 space-y-6">
          {/* Customer Info Box */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>ข้อมูลสำหรับจัดส่งคีย์ลิขสิทธิ์</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="อีเมลผู้รับคีย์ (Required)"
                type="email"
                required
                placeholder="you@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                helperText="ระบบจะส่งใบเสร็จและบันทึกคำสั่งซื้อไปยังอีเมลนี้"
              />
              <Input
                label="ชื่อผู้สั่งซื้อ (Optional)"
                type="text"
                placeholder="ชื่อ-นามสกุลของคุณ"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          </div>

          {/* Sandbox Payment Method Selector */}
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span>ช่องทางการชำระเงิน (ระบบทดสอบ Sandbox)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded">
                NO REAL MONEY CHARGED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PromptPay Sandbox Tab */}
              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-4 rounded-sm border text-left transition-all ${
                  paymentMethod === 'promptpay'
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5 text-cyan-300">
                    <QrCode className="w-4 h-4" /> PromptPay QR
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">จำลอง QR</span>
                </div>
                <p className="text-xs text-slate-400">
                  สแกนผ่านแอปธนาคารจำลอง ตรวจสอบยอดและออกคีย์ในทันที
                </p>
              </button>

              {/* Credit Card Sandbox Tab */}
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-sm border text-left transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold flex items-center gap-1.5 text-cyan-300">
                    <CreditCard className="w-4 h-4" /> บัตรเครดิต/เดบิต
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">Test Card 4242</span>
                </div>
                <p className="text-xs text-slate-400">
                  ระบบ Stripe Elements Sandbox รองรับบัตรทดสอบมาตรฐาน
                </p>
              </button>
            </div>

            {/* Simulated Payment Details Preview */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-sm space-y-2">
              {paymentMethod === 'promptpay' ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 text-xs font-mono text-slate-300">
                  <div className="w-24 h-24 bg-white p-2 rounded flex items-center justify-center text-slate-950">
                    <QrCode className="w-20 h-20" />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-cyan-400 font-bold block">
                      SIMULATED DYNAMIC QR CODE
                    </span>
                    <p className="text-[11px] text-slate-400">
                      ยอดชำระ: {formatPriceTHB(subtotal)} (THB)
                    </p>
                    <p className="text-[10px] text-emerald-400">
                      * คำสั่งซื้อจะถูกบันทึกจริงลงฐานข้อมูล PostgreSQL ทันทีที่คุณกดยืนยัน
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-xs font-mono text-slate-300">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>บัตรทดสอบอัตโนมัติ (Mock Card):</span>
                    <span className="text-cyan-400">4242 •••• •••• 4242</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>วันหมดอายุ / CVC:</span>
                    <span>12/28 // 123</span>
                  </div>
                  <p className="text-[10px] text-emerald-400 pt-1">
                    * ไม่มีการบันทึกหรือตัดเงินจากบัตรจริงใดๆ
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legal Compliance Checkbox */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-sm">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-400"
              />
              <span className="text-xs text-slate-300 leading-relaxed font-sans">
                ข้าพเจ้ารับทราบว่าสินค้าทั้งหมดบน ShadowMarket คือซอฟต์แวร์และคีย์ดิจิทัลที่ถูกต้องตามกฎหมาย และยินยอมให้บันทึกคำสั่งซื้อลงระบบ
              </span>
            </label>
          </div>

          {/* Action Button */}
          <Button
            type="submit"
            variant="emerald"
            size="lg"
            className="w-full text-sm font-mono"
            isLoading={isProcessing}
            disabled={!agreeTerms || !customerEmail || items.length === 0}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isProcessing ? 'กำลังบันทึกคำสั่งซื้อลงฐานข้อมูล...' : 'ยืนยันและสร้างคำสั่งซื้อ (SUBMIT ORDER)'}
          </Button>
        </form>

        {/* Right Summary Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-sm space-y-4">
            <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider pb-2 border-b border-slate-800">
              รายการสินค้าที่สั่งซื้อ ({items.length})
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <div className="text-xs font-mono text-slate-500 py-4 text-center">
                  (ไม่มีรายการสินค้าในตะกร้า)
                </div>
              ) : (
                items.map(({ product, quantity }) => {
                  const price = product.salePrice ?? product.basePrice
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between text-xs font-mono gap-2 py-1"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-200 block truncate">{product.title}</span>
                        <span className="text-slate-500 text-[10px]">จำนวน {quantity} คีย์</span>
                      </div>
                      <span className="text-cyan-400 font-bold flex-shrink-0">
                        {formatPriceTHB(price * quantity)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>ยอดรวมสินค้า</span>
                <span>{formatPriceTHB(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ค่าจัดส่งดิจิทัล</span>
                <span className="text-emerald-400">ฟรี (Instant)</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold">
                <span className="text-white">ยอดสุทธิ</span>
                <span className="text-base sm:text-lg text-cyan-400 font-mono">
                  {formatPriceTHB(subtotal)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span>POSTGRESQL TRANSACTION GUARD</span>
              </div>
              <p className="font-sans text-slate-400">
                คำสั่งซื้อของคุณจะได้รับการบันทึกอย่างปลอดภัย พร้อมการตัดสต็อกคีย์อัตโนมัติ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
