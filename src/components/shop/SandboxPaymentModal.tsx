'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  QrCode,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPriceTHB } from '@/lib/utils'
import { simulateSandboxPaymentAction } from '@/actions/payments'

interface SandboxPaymentModalProps {
  orderId: string
  totalAmount: number
  customerEmail: string
  defaultMethod?: 'promptpay' | 'card'
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SandboxPaymentModal({
  orderId,
  totalAmount,
  customerEmail,
  defaultMethod = 'promptpay',
  isOpen,
  onClose,
  onSuccess,
}: SandboxPaymentModalProps) {
  const router = useRouter()
  const [method, setMethod] = useState<'promptpay' | 'card'>(defaultMethod)
  const [isPending, startTransition] = useTransition()
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [assignedKeysCount, setAssignedKeysCount] = useState<number>(0)
  const [finalStatus, setFinalStatus] = useState<string>('pending')

  // 15-minute countdown timer
  const [timeLeft, setTimeLeft] = useState(15 * 60)

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleSimulatePayment = () => {
    setErrorMessage(null)
    startTransition(async () => {
      const res = await simulateSandboxPaymentAction(orderId, method)
      if (res.success) {
        setPaymentSuccess(true)
        setAssignedKeysCount(res.assignedKeysCount || 0)
        setFinalStatus(res.fulfillmentStatus || 'completed')
        if (onSuccess) onSuccess()
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการประมวลผลการชำระเงิน')
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/50 rounded-lg p-6 sm:p-7 space-y-6 shadow-[0_0_50px_rgba(0,240,255,0.25)] relative overflow-hidden">
        {/* Top High-Tech Ambient Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="sm" showDot>
                SANDBOX PAYMENT GATEWAY
              </Badge>
              <span className="text-xs font-mono text-emerald-400">
                100% TEST MODE
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sans text-white mt-1">
              ช่องทางการชำระเงินดิจิทัล (Sandbox Simulator)
            </h2>
          </div>
          {!paymentSuccess && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white font-mono text-sm p-1 rounded"
            >
              ✕ ปิด
            </button>
          )}
        </div>

        {/* Order Summary Snapshot */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded flex items-center justify-between font-mono text-xs">
          <div>
            <span className="text-slate-400">คำสั่งซื้อ:</span>{' '}
            <span className="text-cyan-400 font-bold">#{orderId.slice(0, 8)}</span>
          </div>
          <div>
            <span className="text-slate-400">ยอดชำระ:</span>{' '}
            <span className="text-emerald-400 font-bold text-sm">
              {formatPriceTHB(totalAmount)}
            </span>
          </div>
        </div>

        {!paymentSuccess ? (
          <>
            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod('promptpay')}
                className={`p-3.5 rounded border text-left transition-all font-mono text-xs flex items-center gap-2.5 ${
                  method === 'promptpay'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <QrCode className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <div className="text-white text-xs font-sans font-bold">PromptPay QR</div>
                  <div className="text-[10px] text-slate-400">พร้อมเพย์ทุกธนาคาร</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`p-3.5 rounded border text-left transition-all font-mono text-xs flex items-center gap-2.5 ${
                  method === 'card'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-bold'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <div className="text-white text-xs font-sans font-bold">Test Card (Stripe)</div>
                  <div className="text-[10px] text-slate-400">บัตรทดสอบ 4242</div>
                </div>
              </button>
            </div>

            {/* TAB CONTENT 1: PROMPTPAY QR */}
            {method === 'promptpay' && (
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-lg text-center space-y-4">
                {/* PromptPay Visual Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/60 border border-blue-500/40 rounded text-blue-300 text-xs font-bold font-mono">
                  <span>THAI QR PAYMENT</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> หมดเวลาใน {formatTimer(timeLeft)}
                  </span>
                </div>

                {/* Simulated High-Tech QR Visual */}
                <div className="relative mx-auto w-48 h-48 p-3 bg-white rounded-lg border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex flex-col items-center justify-center">
                  <div className="w-full h-full border border-slate-900/10 p-2 flex flex-col items-center justify-between">
                    {/* Top QR Header */}
                    <div className="w-full flex justify-between items-center text-[9px] font-mono text-slate-700 font-bold">
                      <span>PROMPTPAY</span>
                      <span>BKK-SIN1</span>
                    </div>

                    {/* Cyber QR Pattern Simulation */}
                    <div className="grid grid-cols-6 gap-1 w-32 h-32 p-1 bg-slate-950 rounded">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs transition-colors duration-500 ${
                            (i * 7 + 3) % 2 === 0
                              ? 'bg-cyan-400 shadow-[0_0_4px_#00f0ff]'
                              : (i * 5 + 1) % 3 === 0
                              ? 'bg-emerald-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Bottom Merchant Label */}
                    <span className="text-[8px] font-mono text-slate-800 font-bold tracking-tight">
                      SHADOWMARKET CO., LTD.
                    </span>
                  </div>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <p className="text-slate-300">
                    จำนวนเงินที่ต้องชำระ:{' '}
                    <strong className="text-emerald-400 text-base">
                      {formatPriceTHB(totalAmount)}
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    [ระบบจำลอง: สแกนทดสอบได้โดยไม่ต้องใช้เงินจริง]
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: STRIPE CARD */}
            {method === 'card' && (
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-400">
                    <Lock className="w-3.5 h-3.5" /> PCI-DSS ENCRYPTED
                  </span>
                  <span>TEST CARD MODE</span>
                </div>

                {/* Simulated Card Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                      หมายเลขบัตรทดสอบ (Stripe Test Card)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="4242 •••• •••• 4242"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-cyan-300 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                        วันหมดอายุ
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="12 / 28"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                        รหัส CVC
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="888"
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  ระบบจำลองการประมวลผล 3D-Secure และส่งสัญญาณ Webhook ยืนยันยอดเงินอัตโนมัติ
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            {/* Sandbox Trigger Action */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-mono tracking-wider"
                onClick={handleSimulatePayment}
                disabled={isPending}
                leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
              >
                {isPending
                  ? 'กำลังตรวจสอบลายเซ็น HMAC-SHA256 และดึงคีย์จากคลัง...'
                  : method === 'promptpay'
                  ? 'จำลองการสแกนจ่ายเงินสำเร็จ (Trigger Webhook)'
                  : 'จำลองการตัดบัตรสำเร็จ (Trigger Webhook)'}
              </Button>

              <p className="text-center text-[10px] font-mono text-slate-500">
                🔒 โหมดทดสอบ Sandbox: ไม่มีการตัดเงินจริง และไม่มีการบันทึกข้อมูลบัตรใดๆ
              </p>
            </div>
          </>
        ) : (
          /* SUCCESS STATE */
          <div className="p-6 bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-[0_0_20px_#05ffa1]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <Badge variant="emerald" size="sm" showDot>
                WEBHOOK VERIFIED // HMAC-SHA256 SIGNED
              </Badge>
              <h3 className="text-xl font-bold font-sans text-white mt-2">
                ชำระเงินจำลองสำเร็จเรียบร้อย!
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                คำสั่งซื้อ #{orderId.slice(0, 8)} ได้รับการยืนยันยอดเงินแล้ว
              </p>
            </div>

            {/* Key Allocation Summary */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded text-left font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>สถานะคำสั่งซื้อ:</span>
                <span className="text-emerald-400 font-bold uppercase">{finalStatus}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>คีย์ที่จัดสรรอัตโนมัติจากคลังนิรภัย:</span>
                <span className="text-cyan-400 font-bold">{assignedKeysCount} คีย์</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>การเข้ารหัสความปลอดภัย:</span>
                <span className="text-emerald-400 font-bold">AES-256-GCM Encrypted</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full font-mono"
                onClick={() => {
                  router.push(`/orders/${orderId}`)
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                เปิดดูรหัสคีย์ลิขสิทธิ์และใบเสร็จ
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
