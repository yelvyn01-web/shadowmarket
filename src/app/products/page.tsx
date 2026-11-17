import React, { Suspense } from 'react'
import { getProductsFromDB } from '@/lib/services/products'
import { ProductCatalogClient } from '@/components/shop/ProductCatalogClient'
import { Badge } from '@/components/ui/Badge'
import { ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'สินค้าทั้งหมด | ShadowMarket Digital Licenses',
  description: 'เลือกซื้อคีย์ลิขสิทธิ์ซอฟต์แวร์แท้ 100% พร้อมระบบส่งมอบเข้ารหัสผ่าน AES-256-GCM',
}

export default async function ProductsPage() {
  const products = await getProductsFromDB()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="space-y-3 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" showDot>
            VAULT REPOSITORY
          </Badge>
          <span className="text-xs font-mono text-emerald-400">
            [STATUS: POSTGRESQL VERIFIED]
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white font-sans tracking-tight">
              คลังคีย์ลิขสิทธิ์ซอฟต์แวร์แท้
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans mt-1">
              คัดสรรเฉพาะซอฟต์แวร์และคีย์ดิจิทัลที่มีสิทธิ์จำหน่ายถูกต้องตามกฎหมาย ปลอดภัย ไร้โปรแกรมแฝง
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>AES-256-GCM ENCRYPTED VAULT</span>
          </div>
        </div>
      </div>

      {/* Catalog with Suspense */}
      <Suspense fallback={
        <div className="py-24 text-center font-mono text-xs text-cyan-400 animate-pulse">
          กำลังโหลดรายการคีย์ลิขสิทธิ์จากฐานข้อมูล Supabase...
        </div>
      }>
        <ProductCatalogClient products={products} />
      </Suspense>
    </div>
  )
}
