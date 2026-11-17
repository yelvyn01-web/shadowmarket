'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Shield,
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  LogIn,
  Database,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { signoutAction } from '@/actions/auth'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { totalItems, setIsCartOpen } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(session?.user ?? null)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    } catch {
      // Supabase credentials might not be configured in non-browser environments
    }
  }, [])

  const handleSignOut = async () => {
    await signoutAction()
    setUser(null)
    router.refresh()
  }

  const navLinks = [
    { label: 'หน้าแรก', href: '/' },
    { label: 'สินค้าทั้งหมด', href: '/products' },
    { label: 'คำสั่งซื้อของฉัน', href: '/orders' },
    { label: 'ระบบปฏิบัติการ', href: '/products?category=operating-system' },
    { label: 'เครื่องมือนักพัฒนา', href: '/products?category=developer-tools' },
    { label: 'ความปลอดภัย & VPN', href: '/products?category=security-vpn' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      {/* Top Cyber System Bar */}
      <div className="hidden md:flex items-center justify-between px-6 py-1 border-b border-slate-900 bg-black/40 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#05ffa1]" />
            NODE: BKK-SIN1 // ACTIVE
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400">
            ENCRYPTION: AES-256-GCM
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">
            COMPLIANCE: 100% AUTHORIZED DIGITAL LICENSES
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-amber-400">
            [STRICT POLICY: NO GAME CHEATS / ZERO BYPASSES]
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-slate-900 border border-cyan-500/50 rounded-sm text-cyan-400 group-hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] group-hover:border-cyan-400 transition-all">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-black text-lg tracking-wider text-white">
                SHADOW<span className="text-cyan-400">//</span>MARKET
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded">
                v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              SECURE DIGITAL LICENSE VAULT
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-mono">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-1.5 rounded-sm transition-all text-xs tracking-wider uppercase',
                  isActive
                    ? 'text-cyan-400 bg-cyan-950/50 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* User Auth Info (Desktop) */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2 py-1 bg-slate-900 border border-slate-800 text-cyan-400 rounded flex items-center gap-1.5 truncate max-w-[150px]">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-900 transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-mono text-xs" leftIcon={<LogIn className="w-3.5 h-3.5 text-cyan-400" />}>
                  เข้าสู่ระบบ
                </Button>
              </Link>
            )}
          </div>

          {/* Admin Procurement Link */}
          <Link href="/admin/procurement">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-400 bg-amber-950/20"
              leftIcon={<Database className="w-3.5 h-3.5 text-amber-400" />}
            >
              <span className="hidden sm:inline">คลังคีย์</span> Admin
            </Button>
          </Link>

          {/* Cart Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsCartOpen(true)}
            className="relative font-mono"
            aria-label="เปิดตะกร้าสินค้า"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline ml-1">ตะกร้า</span>
            {totalItems > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] shadow-[0_0_8px_#00f0ff]">
                {totalItems}
              </span>
            )}
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-sm"
            aria-label="เปิดเมนู"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-3">
          <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded text-xs font-mono text-cyan-400 flex items-center justify-between">
            <span>[NODE: BANGKOK / SIN1]</span>
            <span className="text-emerald-400">● ONLINE</span>
          </div>

          {/* Mobile Auth Button */}
          <div className="p-2 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between text-xs font-mono">
            {user ? (
              <>
                <span className="text-slate-300 truncate max-w-[200px]">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-rose-400 flex items-center gap-1 hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
                </button>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-400">ยังไม่ได้เข้าสู่ระบบ</span>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-cyan-400 font-bold hover:underline"
                >
                  เข้าสู่ระบบ / สมัคร
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Link
              href="/admin/procurement"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-mono tracking-wider rounded text-amber-400 bg-amber-950/40 border border-amber-500/40 mb-2"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>ระบบจัดซื้อ & คลังคีย์ (Admin)</span>
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 text-sm font-mono tracking-wider rounded transition-colors',
                  pathname === link.href
                    ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 space-y-1">
            <p className="text-emerald-400">✓ เฉพาะลิขสิทธิ์ซอฟต์แวร์แท้ 100%</p>
            <p className="text-rose-400">✕ ไม่อนุญาตโปรแกรมโกงเกมและแฮกทุกชนิด</p>
          </div>
        </div>
      )}
    </header>
  )
}
