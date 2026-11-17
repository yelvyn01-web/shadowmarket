import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Terminal,
  Cpu,
  Server,
  Layers,
  Award,
  AlertTriangle,
} from 'lucide-react'
import { getProductsFromDB } from '@/lib/services/products'
import { ProductCard } from '@/components/shop/ProductCard'
import { LicenseRevealPreview } from '@/components/shop/LicenseRevealPreview'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function HomePage() {
  const allProducts = await getProductsFromDB()
  const featuredProducts = allProducts.slice(0, 4)

  const categories = [
    { name: 'ระบบปฏิบัติการ', query: 'operating-system', icon: '💻', count: 'Windows 11 / Pro' },
    { name: 'เครื่องมือนักพัฒนา', query: 'developer-tools', icon: '⚡', count: 'JetBrains, Sublime' },
    { name: 'ชุดโปรแกรมสำนักงาน', query: 'productivity', icon: '📊', count: 'Microsoft Office 2024' },
    { name: 'ความปลอดภัย & VPN', query: 'security-vpn', icon: '🛡️', count: 'NordVPN, 1Password' },
    { name: 'เกมลิขสิทธิ์แท้', query: 'gaming-keys', icon: '🎮', count: 'Steam Global Keys' },
    { name: 'คลาวด์และเครดิต', query: 'cloud-vouchers', icon: '☁️', count: 'AWS Vouchers' },
  ]

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 sm:pt-16 pb-12 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            {/* Status Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-cyan-500/40 rounded-full text-xs font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              SHADOWMARKET VAULT PROTOCOL // 100% LEGAL LICENSES
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight text-white leading-[1.15]">
              ศูนย์กลางคีย์ลิขสิทธิ์แท้{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                ส่งมอบปลอดภัย
              </span>{' '}
              ด้วยการเข้ารหัสขั้นสูง
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-sans max-w-2xl">
              เข้าถึงคีย์ซอฟต์แวร์ระดับโปร เครื่องมือนักพัฒนา และบัตรกำนัลดิจิทัลที่ถูกต้องตามกฎหมาย 100% ส่งมอบอัตโนมัติทันที พร้อมการปกป้องความเป็นส่วนตัวขั้นสูงสุดระดับกองทัพ
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/products">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  เลือกดูสินค้าทั้งหมด
                </Button>
              </Link>
              <a href="#security-vault">
                <Button size="lg" variant="secondary" leftIcon={<Lock className="w-4 h-4 text-cyan-400" />}>
                  ระบบความปลอดภัยคีย์
                </Button>
              </a>
            </div>

            {/* Trust Metrics */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 font-mono text-xs">
              <div className="space-y-0.5">
                <span className="text-cyan-400 font-bold text-lg">100%</span>
                <p className="text-slate-400">ลิขสิทธิ์แท้ถูกกฎหมาย</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-emerald-400 font-bold text-lg">AES-256</span>
                <p className="text-slate-400">เข้ารหัสคีย์ระดับกองทัพ</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-cyan-400 font-bold text-lg">&lt; 1 SEC</span>
                <p className="text-slate-400">จัดส่งอัตโนมัติทันที</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-rose-400 font-bold text-lg">ZERO</span>
                <p className="text-slate-400">ไม่มีโปรแกรมโกงเกม</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LICENSE VAULT SIMULATOR */}
      <section id="security-vault" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-3 mb-6">
          <Badge variant="cyan">INNOVATIVE SECURITY UX</Badge>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            ทดลองสัมผัสระบบส่งมอบคีย์แบบเข้ารหัสลับ
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-sans">
            เพื่อความปลอดภัยสูงสุด รหัสคีย์ที่คุณซื้อจะไม่แสดงเป็นข้อความธรรมดา แต่จะถูกเข้ารหัส AES-256-GCM ป้องกันการถูกดักจับ และเปิดให้คุณคลิกเปิดดูได้เฉพาะคุณเท่านั้น
          </p>
        </div>

        <LicenseRevealPreview />
      </section>

      {/* 3. CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              หมวดหมู่ซอฟต์แวร์ลิขสิทธิ์
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              เลือกดูสินค้าตามประเภทการใช้งานที่ต้องการ
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.query}
              href={`/products?category=${cat.query}`}
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-sm text-center transition-all group hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] flex flex-col items-center justify-center space-y-2"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <h3 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 font-mono">
                {cat.name}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono block">
                {cat.count}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="emerald" showDot>
                VERIFIED AUTHORIZED INVENTORY
              </Badge>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              สินค้าแนะนำยอดนิยม
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              คีย์ลิขสิทธิ์แท้พร้อมจัดส่งอัตโนมัติทันทีหลังชำระเงิน
            </p>
          </div>

          <Link href="/products">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              ดูคลังสินค้าทั้งหมด ({allProducts.length})
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. WHY SHADOWMARKET (PILLARS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-slate-900/40 border border-slate-800/80 rounded-sm relative overflow-hidden">
          <div className="max-w-2xl mb-8 space-y-2">
            <Badge variant="cyan">WHY SHADOWMARKET</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              มาตรฐานระดับอุตสาหกรรมที่คุณไว้วางใจได้
            </h2>
            <p className="text-sm text-slate-400">
              เราออกแบบทุกระบบเพื่อแก้ปัญหาความไม่ปลอดภัยในตลาดซื้อขายคีย์ดิจิทัลแบบดั้งเดิม
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-sm space-y-3">
              <div className="w-10 h-10 rounded bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">
                ลิขสิทธิ์ถูกต้อง 100%
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                สินค้าทุกชิ้นมาจากพันธมิตรผู้จัดจำหน่ายที่ได้รับอนุญาต มีที่มาที่ไปชัดเจน เปิดใช้งานได้จริงตลอดอายุการใช้งาน
              </p>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-sm space-y-3">
              <div className="w-10 h-10 rounded bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">
                จัดส่งอัตโนมัติใน 1 วินาที
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                ไม่ต้องรอแอดมินส่งของ ระบบจะดึงคีย์ออกจากคลังและถอดรหัสให้คุณทันทีที่ระบบรับเงินเสร็จสิ้น
              </p>
            </div>

            <div className="p-5 bg-slate-950/70 border border-slate-800 rounded-sm space-y-3">
              <div className="w-10 h-10 rounded bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-mono">
                การปกป้องข้อมูลระดับท็อป
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                ไร้กังวลเรื่องข้อมูลรั่วไหล ด้วยการแยกสิทธิ์ Row Level Security และการเข้ารหัสแบบ AES-256-GCM ทุกรายการ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. STRICT COMPLIANCE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 bg-slate-950 border border-amber-500/30 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-950/80 border border-amber-500/50 rounded text-amber-400 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-100">
                นโยบายความปลอดภัยและข้อกำหนดทางกฎหมาย
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ShadowMarket ดำเนินธุรกิจภายใต้กรอบกฎหมายอย่างเคร่งครัด เราไม่มีการจำหน่าย Game Cheats, Aimbots, Hacks หรือ Anti-Cheat Bypasses ทุกกรณี
              </p>
            </div>
          </div>
          <Link href="/products" className="flex-shrink-0">
            <Button variant="secondary" size="sm">
              ดูสินค้าทั้งหมด
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
