import React from 'react'
import Link from 'next/link'
import { Shield, Lock, Cpu, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-slate-800/90 bg-slate-950 text-slate-400 font-sans">
      {/* Top Security & Policy Banner */}
      <div className="border-b border-slate-900 bg-slate-900/50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-sm">
            <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                100% Authorized Reseller
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                จำหน่ายเฉพาะคีย์ลิขสิทธิ์ซอฟต์แวร์แท้ ผ่านการรับรองจากผู้พัฒนาและตัวแทนจำหน่ายอย่างเป็นทางการ
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-sm">
            <div className="p-2 bg-cyan-950/60 border border-cyan-500/40 rounded text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                AES-256-GCM Encrypted
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                คีย์ดิจิทัลทุกชิ้นได้รับการเข้ารหัสขั้นสูงสุดระดับกองทัพ ปลอดภัยจากการเข้าถึงโดยไม่ได้รับอนุญาต
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-sm">
            <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded text-rose-400">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
                Anti-Cheat & Exploit Ban
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                ปฏิเสธโปรแกรมโกงเกม บายพาสระบบ หรือเครื่องมือละเมิดความปลอดภัยทุกชนิดอย่างเด็ดขาด
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-900 border border-cyan-500/50 rounded text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white tracking-wider font-mono">
                SHADOW<span className="text-cyan-400">//</span>MARKET
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              แพลตฟอร์มศูนย์กลางจำหน่ายคีย์ดิจิทัล ซอฟต์แวร์ลิขสิทธิ์แท้ และเครื่องมือนักพัฒนา มุ่งเน้นความปลอดภัย ความรวดเร็วในการส่งมอบ และความถูกต้องตามกฎหมาย 100%
            </p>
            <div className="text-[11px] font-mono text-cyan-400/80">
              [SYSTEM PROTOCOL: VERIFIED_RESELLER]
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
              หมวดหมู่สินค้า
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="/products?category=operating-system" className="hover:text-cyan-400 transition-colors">
                  &gt; ระบบปฏิบัติการ (Windows)
                </Link>
              </li>
              <li>
                <Link href="/products?category=developer-tools" className="hover:text-cyan-400 transition-colors">
                  &gt; เครื่องมือนักพัฒนา (JetBrains, IDE)
                </Link>
              </li>
              <li>
                <Link href="/products?category=productivity" className="hover:text-cyan-400 transition-colors">
                  &gt; ซอฟต์แวร์สำนักงาน (Office)
                </Link>
              </li>
              <li>
                <Link href="/products?category=security-vpn" className="hover:text-cyan-400 transition-colors">
                  &gt; ความปลอดภัยและ VPN
                </Link>
              </li>
              <li>
                <Link href="/products?category=gaming-keys" className="hover:text-cyan-400 transition-colors">
                  &gt; คีย์เกมลิขสิทธิ์แท้ (Steam)
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support & Security */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
              มาตรฐานความปลอดภัย
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                เข้ารหัสคีย์ด้วย AES-256-GCM
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Row-Level Security 100%
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                รับประกันเปิดใช้งานได้จริง
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ระบบ Sandbox ก่อนใช้จริง
              </li>
            </ul>
          </div>

          {/* Legal Compliance Disclaimer */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              ข้อกำหนดทางกฎหมาย
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              ShadowMarket ปฏิบัติตามกฎหมายทรัพย์สินทางปัญญาอย่างเคร่งครัด สินค้าทุกรายการมาจากช่องทางจัดจำหน่ายที่ได้รับอนุญาต ไม่สนับสนุนโปรแกรมละเมิดลิขสิทธิ์ คีย์เถื่อน หรือซอฟต์แวร์ช่วยเล่นเกมทุกชนิด
            </p>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
              STATUS: ZERO_TOLERANCE_PIRACY
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <p>© {new Date().getFullYear()} ShadowMarket. สงวนลิขสิทธิ์ทุกประการ.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>NODE: ASIA-SOUTHEAST (SIN1)</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">STATUS: OPERATIONAL</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
