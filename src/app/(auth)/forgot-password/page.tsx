'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { forgotPasswordAction } from '@/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData()
    formData.append('email', email)

    const result = await forgotPasswordAction(formData)
    setIsLoading(false)

    if (result.success) {
      setSuccessMsg(result.data?.message || 'ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว')
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการส่งข้อมูล')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="cyan" showDot>
          CREDENTIAL RECOVERY
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          รีเซ็ตรหัสผ่าน
        </h1>
        <p className="text-xs text-slate-400 font-sans">
          กรอกอีเมลที่คุณใช้สมัครสมาชิก ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังกล่องจดหมายของคุณ
        </p>
      </div>

      {/* Form Card */}
      <div className="p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-sm space-y-6 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
        {errorMsg && (
          <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded flex items-start gap-2.5 text-xs text-rose-300 font-sans">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded flex items-start gap-3 text-xs text-emerald-300 font-sans">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">ส่งคำขอสำเร็จ!</span>
                <span>{successMsg}</span>
              </div>
            </div>
            <Link href="/login" className="block">
              <Button variant="secondary" className="w-full text-xs font-mono" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                กลับสู่หน้าเข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="อีเมลของคุณ (Registered Email)"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-mono text-xs"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              ส่งลิงก์รีเซ็ตรหัสผ่าน (SEND RECOVERY LINK)
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-sans text-slate-400">
          <Link href="/login" className="hover:text-cyan-400 flex items-center gap-1 font-mono">
            <ArrowLeft className="w-3.5 h-3.5" /> ย้อนกลับ
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SUPABASE RECOVERY</span>
          </div>
        </div>
      </div>
    </div>
  )
}
