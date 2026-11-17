'use client'

import React, { useState } from 'react'
import { QrCode, CreditCard, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SandboxPaymentModal } from '@/components/shop/SandboxPaymentModal'

interface OrderPaymentTriggerProps {
  orderId: string
  totalAmount: number
  customerEmail: string
  defaultMethod?: 'promptpay' | 'card'
}

export function OrderPaymentTrigger({
  orderId,
  totalAmount,
  customerEmail,
  defaultMethod = 'promptpay',
}: OrderPaymentTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            คำสั่งซื้อนี้รอการชำระเงิน (Awaiting Payment)
          </h4>
          <p className="text-xs text-slate-300 font-mono mt-1">
            ท่านสามารถจำลองการชำระเงินผ่านระบบ Sandbox เพื่อรับคีย์ลิขสิทธิ์ทันที
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsOpen(true)}
          className="font-mono text-xs whitespace-nowrap"
          leftIcon={<Sparkles className="w-4 h-4 text-cyan-300" />}
        >
          ชำระเงินจำลอง (Sandbox Pay)
        </Button>
      </div>

      <SandboxPaymentModal
        orderId={orderId}
        totalAmount={totalAmount}
        customerEmail={customerEmail}
        defaultMethod={defaultMethod}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </>
  )
}
