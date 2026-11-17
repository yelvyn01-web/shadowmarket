import React from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Share2,
  Terminal,
  Cpu,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { MOCK_PRODUCTS } from '@/data/mockProducts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProductCard } from '@/components/shop/ProductCard'
import { formatPriceTHB } from '@/lib/utils'
import { AddToCartButton } from './AddToCartButton'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug)

  if (!product) {
    return { title: 'ไม่พบสินค้า | ShadowMarket' }
  }

  return {
    title: `${product.title} - คีย์ลิขสิทธิ์แท้ 100% | ShadowMarket`,
    description: product.shortDescription,
    openGraph: {
      title: product.title,
      description: product.shortDescription,
      images: [product.imageUrl],
    },
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug)

  if (!product) {
    notFound()
  }

  const currentPrice = product.salePrice ?? product.basePrice
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.basePrice)
  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  const relatedProducts = MOCK_PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Back Link */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับไปคลังสินค้าทั้งหมด
        </Link>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left: Product Media Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-[16/11] bg-slate-950 border border-slate-800 rounded-sm overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.1)]">
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

            {/* Badges on Image */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <Badge variant="cyan">{product.platform}</Badge>
              {product.fulfillmentType === 'instant' ? (
                <Badge variant="emerald" showDot>
                  <Zap className="w-3 h-3 mr-1 inline" /> ทันที
                </Badge>
              ) : (
                <Badge variant="amber" showDot>
                  <Clock className="w-3 h-3 mr-1 inline" /> ตามสั่ง
                </Badge>
              )}
            </div>

            <div className="absolute bottom-3 left-3 text-xs font-mono text-slate-300 drop-shadow">
              ผู้พัฒนา: <span className="text-white font-bold">{product.publisher}</span>
            </div>
          </div>

          {/* Quick Technical Guarantee Specs */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-sm grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">ประเภทลิขสิทธิ์:</span>
              <span className="text-cyan-300 font-semibold">{product.licenseType}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">สถานะสต็อก:</span>
              <span className={isOutOfStock ? 'text-rose-400' : 'text-emerald-400 font-semibold'}>
                {isOutOfStock ? 'สินค้าหมด' : `พร้อมส่ง (${product.stock} คีย์)`}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">ความเร็วการส่งมอบ:</span>
              <span className="text-slate-200">{product.deliveryTime}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-[11px]">การเข้ารหัส:</span>
              <span className="text-emerald-400 font-bold">AES-256-GCM</span>
            </div>
          </div>
        </div>

        {/* Right: Info, Price & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="emerald" size="sm">
                VERIFIED AUTHORIZED RESELLER
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                SKU: {product.id.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-sans tracking-tight">
              {product.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed font-sans">
              {product.description}
            </p>
          </div>

          {/* Price Box */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-slate-400 block">
                ราคาพิเศษ (รวมภาษีมูลค่าเพิ่มแล้ว)
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-mono font-black text-cyan-400">
                  {formatPriceTHB(currentPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm font-mono text-slate-500 line-through">
                    {formatPriceTHB(product.basePrice)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-xs font-mono px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-500/40 rounded">
                    ประหยัด {Math.round(((product.basePrice - currentPrice) / product.basePrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Interactive Client Add to Cart Component */}
            <AddToCartButton product={product} />
          </div>

          {/* Key Product Features List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              จุดเด่นและคุณสมบัติสำคัญ
            </h3>
            <ul className="space-y-2">
              {product.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Reseller Authorization Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-sm space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>การรับรองสิทธิ์จำหน่ายถูกต้องตามกฎหมาย</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {product.legalAuthorizationBasis}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Technical Tabs: Redemption Guide & Requirements */}
      <div className="pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step-by-Step Activation Guide */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-400">
            <Terminal className="w-4 h-4" />
            <span>ขั้นตอนการเปิดใช้งานคีย์ (ACTIVATION GUIDE)</span>
          </div>

          <ol className="space-y-3 font-sans text-xs sm:text-sm">
            {product.activationGuide.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-mono text-xs flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-slate-300 mt-0.5">{step}</span>
              </li>
            ))}
          </ol>

          <div className="pt-2 text-[11px] font-mono text-slate-400">
            * รูปแบบตัวอย่างคีย์: <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded">{product.sampleKeyFormat}</code>
          </div>
        </div>

        {/* System Requirements & Security Guarantee */}
        <div className="space-y-4">
          {product.systemRequirements && (
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-mono font-bold text-slate-200">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>ความต้องการของระบบ (SYSTEM SPECS)</span>
              </div>
              <ul className="space-y-2 text-xs font-mono text-slate-400">
                <li>• ระบบปฏิบัติการ: <span className="text-slate-300">{product.systemRequirements.os}</span></li>
                {product.systemRequirements.storage && (
                  <li>• สตอเรจ & เมมโมรี่: <span className="text-slate-300">{product.systemRequirements.storage}</span></li>
                )}
                {product.systemRequirements.additional && (
                  <li>• ข้อกำหนดเพิ่มเติม: <span className="text-slate-300">{product.systemRequirements.additional}</span></li>
                )}
              </ul>
            </div>
          )}

          {/* Zero Hacks Policy Reminder */}
          <div className="p-4 bg-slate-950 border border-rose-500/30 rounded-sm flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="text-slate-400">
              <strong className="text-slate-200">นโยบายความโปร่งใส:</strong> สินค้าชิ้นนี้คือคีย์ลิขสิทธิ์ซอฟต์แวร์แท้ 100% ShadowMarket ปฏิเสธการขายคีย์เถื่อนหรือโปรแกรมช่วยเล่นเกมทุกรูปแบบ
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white font-sans">
            สินค้าอื่นในหมวดหมู่เดียวกัน
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
