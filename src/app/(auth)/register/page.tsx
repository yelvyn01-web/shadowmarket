'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { signupAction } from '@/actions/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      setIsLoading(false)
      return
    }

    if (password.length < 12) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 12 ตัวอักษรเพื่อความปลอดภัย')
      setIsLoading(false)
      return
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('email', email)
    formData.append('password', password)

    const result = await signupAction(formData)
    setIsLoading(false)

    if (result.success) {
      setSuccessMsg('สมัครสมาชิกสำเร็จเรียบร้อย! กำลังนำคุณเข้าสู่ระบบ...')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 1500)
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการลงทะเบียน')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="cyan" showDot>
          REGISTRATION PROTOCOL
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          สมัครสมาชิกใหม่
        </h1>
        <p className="text-xs text-slate-400 font-sans">
          สร้างบัญชี ShadowMarket เพื่อรับสิทธิ์จัดเก็บคีย์ลิขสิทธิ์แบบเข้ารหัสถาวร
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

        {successMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 rounded flex items-start gap-2.5 text-xs text-emerald-300 font-sans">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ชื่อ-นามสกุล (Full Name)"
            type="text"
            required
            placeholder="สมชาย ใจดี"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="อีเมล (Email)"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="รหัสผ่าน (Password)"
            type="password"
            required
            placeholder="อย่างน้อย 12 ตัวอักษร"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="แนะนำให้ผสมตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์"
          />

          <Input
            label="ยืนยันรหัสผ่าน (Confirm Password)"
            type="password"
            required
            placeholder="กรอกรหัสผ่านอีกครั้ง"
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
            สร้างบัญชีสมาชิก (REGISTER_NODE)
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs font-sans text-slate-400 space-y-2">
          <p>
            มีบัญชีสมาชิกอยู่แล้ว?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold font-mono">
              เข้าสู่ระบบ
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyan-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AUTOMATIC PROFILE GENERATION VIA TRIGGER</span>
          </div>
        </div>
      </div>
    </div>
  )
}
