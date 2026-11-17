'use client'

import React, { useState } from 'react'
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  Lock,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { revealLicenseKeyAction } from '@/actions/licenses'

interface DeliveryItem {
  id: string
  productTitle: string
  unitPrice: number
  licenseKeyId: string | null
}

interface LicenseDeliveryVaultProps {
  orderId: string
  orderStatus: string
  items: DeliveryItem[]
}

export function LicenseDeliveryVault({
  orderId,
  orderStatus,
  items,
}: LicenseDeliveryVaultProps) {
  // Store revealed keys by orderItemId
  const [decryptedKeys, setDecryptedKeys] = useState<
    Record<string, { plaintext: string; redeemedAt: string }>
  >({})
  const [revealedVisibility, setRevealedVisibility] = useState<Record<string, boolean>>({})
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null)
  const [errorItemId, setErrorItemId] = useState<Record<string, string>>({})

  const isPaidOrCompleted =
    orderStatus === 'paid' || orderStatus === 'completed'

  const handleReveal = async (orderItemId: string) => {
    // If already decrypted, just toggle visibility
    if (decryptedKeys[orderItemId]) {
      setRevealedVisibility((prev) => ({
        ...prev,
        [orderItemId]: !prev[orderItemId],
      }))
      return
    }

    // Call server action to decrypt
    setLoadingItemId(orderItemId)
    setErrorItemId((prev) => ({ ...prev, [orderItemId]: '' }))

    const res = await revealLicenseKeyAction(orderId, orderItemId)
    setLoadingItemId(null)

    if (res.success && res.plaintextKey) {
      setDecryptedKeys((prev) => ({
        ...prev,
        [orderItemId]: {
          plaintext: res.plaintextKey!,
          redeemedAt: res.redeemedAt || new Date().toISOString(),
        },
      }))
      setRevealedVisibility((prev) => ({ ...prev, [orderItemId]: true }))
    } else {
      setErrorItemId((prev) => ({
        ...prev,
        [orderItemId]: res.error || 'ไม่สามารถถอดรหัสคีย์ได้',
      }))
    }
  }

  const handleCopy = (orderItemId: string, keyText: string) => {
    navigator.clipboard.writeText(keyText)
    setCopiedItemId(orderItemId)
    setTimeout(() => setCopiedItemId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <Terminal className="w-4 h-4" />
          <span>VAULT_COMMAND // DIGITAL_LICENSE_DELIVERY</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="sm" showDot>
            AES-256-GCM READY
          </Badge>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-emerald-400 text-[11px] hidden sm:inline">
            ZERO PLAINTEXT AT REST
          </span>
        </div>
      </div>

      {/* Items Delivery List */}
      <div className="space-y-4">
        {items.map((item) => {
          const isDecrypted = Boolean(decryptedKeys[item.id])
          const isVisible = Boolean(revealedVisibility[item.id])
          const decryptedData = decryptedKeys[item.id]
          const isLoading = loadingItemId === item.id
          const hasAssignedKey = Boolean(item.licenseKeyId)

          return (
            <div
              key={item.id}
              className="p-5 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-sm space-y-4 hover:border-cyan-500/40 transition-colors shadow-[0_0_20px_rgba(0,240,255,0.06)]"
            >
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-950 border border-slate-800 text-cyan-400 rounded">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-white">
                      {item.productTitle}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      รายการรหัส: #{item.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div>
                  {hasAssignedKey ? (
                    <Badge variant="emerald" size="sm" showDot>
                      {isDecrypted ? 'REDEEMED & DECRYPTED' : 'READY TO REVEAL'}
                    </Badge>
                  ) : orderStatus === 'processing_fulfillment' ? (
                    <Badge variant="cyan" size="sm" showDot>
                      กำลังจัดเตรียมคีย์
                    </Badge>
                  ) : (
                    <Badge variant="amber" size="sm">
                      รอชำระเงิน
                    </Badge>
                  )}
                </div>
              </div>

              {/* Delivery Body */}
              {hasAssignedKey ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      รหัสผลิตภัณฑ์ดิจิทัล (Digital Product License Key)
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {/* Key Box */}
                      <div className="flex-1 bg-slate-950 border border-slate-700/80 rounded-sm px-4 py-3 font-mono text-sm sm:text-base font-semibold tracking-wider text-slate-100 flex items-center justify-between overflow-x-auto shadow-inner">
                        <span
                          className={
                            isVisible
                              ? 'text-emerald-400 select-all font-bold'
                              : 'text-slate-400 select-none'
                          }
                        >
                          {isLoading ? (
                            <span className="text-cyan-400 animate-pulse flex items-center gap-2 text-xs">
                              <Sparkles className="w-3.5 h-3.5" />
                              [กำลังถอดรหัส AES-256-GCM ด้วย Master Key...]
                            </span>
                          ) : isVisible && decryptedData ? (
                            decryptedData.plaintext
                          ) : (
                            '•••••-•••••-•••••-•••••-XXXX'
                          )}
                        </span>

                        <span className="text-[10px] font-mono text-slate-500 ml-3">
                          {isVisible ? '[AUTHENTICATED]' : '[ENCRYPTED]'}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="flex gap-2">
                        <Button
                          variant={isVisible ? 'secondary' : 'primary'}
                          size="md"
                          onClick={() => handleReveal(item.id)}
                          disabled={isLoading}
                          leftIcon={
                            isVisible ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )
                          }
                          className="font-mono text-xs flex-1 sm:flex-initial"
                        >
                          {isLoading
                            ? 'กำลังถอดรหัส...'
                            : isVisible
                            ? 'ซ่อนคีย์'
                            : 'ถอดรหัสดูคีย์'}
                        </Button>

                        <Button
                          variant="outline"
                          size="md"
                          onClick={() =>
                            decryptedData && handleCopy(item.id, decryptedData.plaintext)
                          }
                          disabled={!isVisible || !decryptedData}
                          leftIcon={
                            copiedItemId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )
                          }
                          className="font-mono text-xs flex-1 sm:flex-initial"
                        >
                          {copiedItemId === item.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                        </Button>
                      </div>
                    </div>

                    {errorItemId[item.id] && (
                      <p className="text-xs font-mono text-rose-400 mt-2">
                        {errorItemId[item.id]}
                      </p>
                    )}
                  </div>

                  {/* Decrypted Info & Activation Guide */}
                  {isVisible && decryptedData && (
                    <div className="p-4 bg-slate-950/70 border border-emerald-500/30 rounded-sm space-y-3 font-mono text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          การยืนยันความถูกต้อง: ถอดรหัสสำเร็จและตรวจสอบ Auth Tag 128-bit สมบูรณ์
                        </span>
                        <span>
                          เปิดดูเมื่อ: {new Date(decryptedData.redeemedAt).toLocaleString('th-TH')}
                        </span>
                      </div>

                      <div className="space-y-1.5 font-sans">
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                          ขั้นตอนการเปิดใช้งานลิขสิทธิ์แท้ (Activation Guide):
                        </h5>
                        <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1 text-xs">
                          <li>ดาวน์โหลดตัวติดตั้งซอฟต์แวร์อย่างเป็นทางการจากผู้ผลิตโดยตรง</li>
                          <li>เปิดโปรแกรม เข้าสู่เมนู <strong>Settings &gt; Activation / Enter Product Key</strong></li>
                          <li>กดปุ่ม <strong>คัดลอก</strong> รหัสคีย์ด้านบน และนำไปวางในโปรแกรม</li>
                          <li>กดยืนยันเพื่อเปิดใช้งานสิทธิ์แท้ถาวร (Permanent Online Activation)</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              ) : orderStatus === 'processing_fulfillment' ? (
                /* Processing Fulfillment State */
                <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-sm flex items-start gap-3 text-xs">
                  <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 font-sans">
                    <p className="font-bold text-white">
                      คำสั่งซื้อได้รับการชำระเงินแล้ว เจ้าหน้าที่กำลังจัดเตรียมคีย์ลิขสิทธิ์
                    </p>
                    <p className="text-slate-300 font-mono text-[11px]">
                      สินค้ารายการนี้จะถูกจัดส่งจากคิวจัดซื้อโดยตรง โดยคีย์จะแสดงขึ้นในหน้านี้ทันทีที่จัดส่งเรียบร้อย
                    </p>
                  </div>
                </div>
              ) : (
                /* Unpaid State */
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-sm flex items-center gap-3 text-xs font-mono text-slate-400">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    รหัสคีย์ลิขสิทธิ์ได้รับการปกป้องด้วยการเข้ารหัส กรุณาชำระเงินให้เสร็จสมบูรณ์เพื่อปลดล็อก
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Security Manifesto Footer */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-sm flex items-start gap-3 text-xs text-slate-400 font-sans">
        <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-200">
            ระบบความปลอดภัยและหลักฐานดิจิทัล (Fraud Protection & Audit Trail):
          </p>
          <p className="text-[11px] text-slate-400">
            ทุกครั้งที่มีการคลิกเปิดดูคีย์ ระบบจะบันทึกประวัติการเข้าถึง (Audit Log: <code>license.viewed</code>) พร้อมเวลาและเลขคำสั่งซื้อไว้ในฐานข้อมูล เพื่อใช้เป็นหลักฐานยืนยันการส่งมอบสิทธิ์ถูกต้องตามกฎหมาย 100%
          </p>
        </div>
      </div>
    </div>
  )
}
