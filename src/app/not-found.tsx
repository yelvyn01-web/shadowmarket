import React from 'react'
import Link from 'next/link'
import { Terminal, ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 sm:py-32 text-center space-y-6">
      <div className="w-16 h-16 rounded bg-rose-950/70 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-[0_0_20px_rgba(255,0,85,0.3)]">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <Badge variant="rose">ERROR 404 // NODE_NOT_FOUND</Badge>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
          ไม่พบคีย์หรือหน้าที่คุณกำลังค้นหา
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
          หน้าเว็บหรือรหัสสินค้าที่คุณเรียกดูอาจถูกย้าย หรือไม่มีอยู่ในระบบฐานข้อมูลของ ShadowMarket
        </p>
      </div>

      <div className="pt-2 flex justify-center gap-3">
        <Link href="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            กลับสู่หน้าหลัก
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="secondary">
            ดูสินค้าทั้งหมด
          </Button>
        </Link>
      </div>
    </div>
  )
}
