'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, ShieldCheck, Terminal, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { loginAction } from '@/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    const result = await loginAction(formData)
    setIsLoading(false)

    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="cyan" showDot>
          ACCESS CONTROL PROTOCOL
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
          เข้าสู่ระบบ ShadowMarket
        </h1>
        <p className="text-xs text-slate-400 font-sans">
          เข้าสู่ระบบเพื่อจัดการคำสั่งซื้อและเปิดดูคีย์ลิขสิทธิ์ที่คุณครอบครอง
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="อีเมล (Email)"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-300">รหัสผ่าน (Password)</label>
              <Link href="/forgot-password" className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 font-mono text-xs"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            เข้าสู่ระบบ (AUTHENTICATE)
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-800 text-center text-xs font-sans text-slate-400 space-y-2">
          <p>
            ยังไม่มีบัญชีสมาชิก?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-bold font-mono">
              สมัครสมาชิกใหม่
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-emerald-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SUPABASE AUTH // SSL ENCRYPTED</span>
          </div>
        </div>
      </div>
    </div>
  )
}
