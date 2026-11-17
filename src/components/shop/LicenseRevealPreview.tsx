'use client'

import React, { useState } from 'react'
import { KeyRound, Eye, EyeOff, Copy, Check, ShieldCheck, Terminal, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export function LicenseRevealPreview() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  const sampleKey = 'W269N-WFGWX-YVC9B-4J6C9-T83GX'
  const maskedKey = '•••••-•••••-•••••-•••••-T83GX'

  const handleReveal = () => {
    if (isRevealed) {
      setIsRevealed(false)
      return
    }

    setIsDecrypting(true)
    setTimeout(() => {
      setIsDecrypting(false)
      setIsRevealed(true)
    }, 600)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleKey)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="relative p-5 sm:p-6 bg-slate-900/90 border border-cyan-500/40 rounded-sm shadow-[0_0_30px_rgba(0,240,255,0.12)]">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-400">
          <Terminal className="w-4 h-4" />
          <span>VAULT_SIMULATOR // LICENSE_DELIVERY_PROTOCOL</span>
        </div>
        <Badge variant="emerald" size="sm" showDot>
          AES-256-GCM VERIFIED
        </Badge>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <span className="text-xs font-mono text-slate-400 block mb-1">
            สินค้าตัวอย่าง: Microsoft Windows 11 Pro Retail (1 PC)
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* License Key Display Box */}
            <div className="flex-1 bg-slate-950 border border-slate-700/80 rounded-sm px-4 py-3 font-mono text-sm sm:text-base font-semibold tracking-wider text-slate-100 flex items-center justify-between overflow-x-auto">
              <span className={isRevealed ? 'text-emerald-400 select-all' : 'text-slate-400 select-none'}>
                {isDecrypting ? (
                  <span className="text-cyan-400 animate-pulse">
                    [กำลังถอดรหัส AES-256-GCM...]
                  </span>
                ) : isRevealed ? (
                  sampleKey
                ) : (
                  maskedKey
                )}
              </span>
              <span className="text-[10px] font-mono text-slate-400 ml-2">
                {isRevealed ? '[DECRYPTED]' : '[PROTECTED]'}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant={isRevealed ? 'secondary' : 'primary'}
                size="md"
                onClick={handleReveal}
                isLoading={isDecrypting}
                leftIcon={isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                className="font-mono text-xs flex-1 sm:flex-initial"
              >
                {isRevealed ? 'ซ่อนคีย์' : 'คลิกเพื่อดูคีย์'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handleCopy}
                disabled={!isRevealed}
                leftIcon={isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                className="font-mono text-xs flex-1 sm:flex-initial"
              >
                {isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกคีย์'}
              </Button>
            </div>
          </div>
        </div>

        {/* Security explanation note */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded flex items-start gap-2.5 text-xs text-slate-400 font-sans">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">นวัตกรรมความปลอดภัยของ ShadowMarket: </span>
            คีย์ดิจิทัลของคุณจะถูกเก็บในสถานะเข้ารหัสลับตลอดเวลา โดยมีเพียงคุณคนเดียวที่สามารถคลิกเปิดดูรหัสได้หลังจากระบบตรวจสอบการชำระเงินเรียบร้อย
          </div>
        </div>
      </div>
    </div>
  )
}
