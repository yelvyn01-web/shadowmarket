'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { resetPasswordAction } from '@/actions/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    if (password !== confirmPassword) {
      setIsLoading(false)
      setErrorMsg('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
      return
    }

    if (password.length < 12) {
      setIsLoading(false)
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 12 ตัวอักษร')
      return
    }

    const formData = new FormData()
    formData.append('password', password)

    const result = await resetPasswordAction(formData)
    setIsLoading(false)

    if (result.success) {
      setSuccessMsg(result.data?.message || 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="cyan" showDot>
          CREDENTIAL UPDATE
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          ตั้งรหัสผ่านใหม่
        </h1>
        <p className="text-xs text-slate-400 font-sans">
          กรุณากำหนดรหัสผ่านใหม่ที่มีความยาวอย่างน้อย 6 ตัวอักษรเพื่อความปลอดภัยของบัญชี
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
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded flex items-start gap-3 text-xs text-emerald-300 font-sans">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">สำเร็จ!</span>
              <span>{successMsg} กำลังนำท่านไปยังหน้าเข้าสู่ระบบ...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="รหัสผ่านใหม่ (New Password)"
              type="password"
              required
              placeholder="อย่างน้อย 12 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Input
              label="ยืนยันรหัสผ่านใหม่ (Confirm New Password)"
              type="password"
              required
              placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="emerald"
              size="lg"
              className="w-full mt-2 font-mono text-xs"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              บันทึกรหัสผ่านใหม่ (UPDATE PASSWORD)
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-sans text-slate-400">
          <Link href="/login" className="hover:text-cyan-400 font-mono">
            เข้าสู่ระบบด้วยรหัสเดิม
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SECURE CRYPTO STORAGE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
