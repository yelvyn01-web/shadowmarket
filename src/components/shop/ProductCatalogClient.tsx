'use client'

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, SlidersHorizontal, ShieldCheck, Zap, RotateCcw, AlertTriangle } from 'lucide-react'
import { Product } from '@/types/product'
import { ProductCard } from '@/components/shop/ProductCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ProductCatalogClientProps {
  products: Product[]
}

export function ProductCatalogClient({ products }: ProductCatalogClientProps) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || 'all'

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured')

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'operating-system', label: 'ระบบปฏิบัติการ' },
    { id: 'developer-tools', label: 'เครื่องมือนักพัฒนา' },
    { id: 'productivity', label: 'งานเอกสารและสำนักงาน' },
    { id: 'security-vpn', label: 'ความปลอดภัย & VPN' },
    { id: 'gaming-keys', label: 'เกมลิขสิทธิ์แท้ (Steam)' },
    { id: 'cloud-vouchers', label: 'คลาวด์และเครดิต' },
  ]

  const platforms = ['all', 'Windows', 'macOS', 'Multi-Platform', 'Steam', 'Cloud']

  // Filter & Sort logic based strictly on database products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category match
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false
        }
        // Platform match
        if (selectedPlatform !== 'all' && product.platform !== selectedPlatform) {
          return false
        }
        // Fulfillment match
        if (fulfillmentFilter !== 'all' && product.fulfillmentType !== fulfillmentFilter) {
          return false
        }
        // Search match
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim()
          const matchTitle = product.title.toLowerCase().includes(query)
          const matchDesc = product.description.toLowerCase().includes(query)
          const matchPublisher = product.publisher.toLowerCase().includes(query)
          return matchTitle || matchDesc || matchPublisher
        }
        return true
      })
      .sort((a, b) => {
        const priceA = a.salePrice ?? a.basePrice
        const priceB = b.salePrice ?? b.basePrice
        if (sortBy === 'price-asc') return priceA - priceB
        if (sortBy === 'price-desc') return priceB - priceA
        return 0
      })
  }, [products, selectedCategory, selectedPlatform, fulfillmentFilter, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSelectedPlatform('all')
    setFulfillmentFilter('all')
    setSearchQuery('')
    setSortBy('featured')
  }

  // Production Empty State Guard
  if (!products || products.length === 0) {
    return (
      <div className="py-16 text-center space-y-6 max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(255,184,0,0.2)]">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="amber" showDot>
            PRODUCTION DATA GUARD ACTIVE
          </Badge>
          <h2 className="text-xl sm:text-2xl font-black text-white font-sans">
            ไม่พบข้อมูลสินค้าในฐานข้อมูล
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
            ระบบความปลอดภัยของ ShadowMarket ปฏิเสธการใช้ข้อมูลจำลอง (Mock Data) บนสภาวะ Production เพื่อความถูกต้องของสินค้าและสต็อก หากคุณคือผู้ดูแลระบบ โปรดตรวจสอบตาราง <code>products</code> ใน Supabase
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="primary" onClick={() => window.location.reload()}>
            ลองโหลดใหม่อีกครั้ง
          </Button>
          <a href="/api/health" target="_blank" rel="noreferrer">
            <Button variant="secondary">ตรวจสอบสถานะเซิร์ฟเวอร์</Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-6 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-sm space-y-4">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="ค้นหาชื่อซอฟต์แวร์, คีย์ลิขสิทธิ์, ผู้พัฒนา เช่น Windows, JetBrains, Adobe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-cyan-400" />}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="เรียงลำดับสินค้า"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="featured">เรียงตาม: แนะนำ</option>
              <option value="price-asc">เรียงตาม: ราคา ต่ำ -&gt; สูง</option>
              <option value="price-desc">เรียงตาม: ราคา สูง -&gt; ต่ำ</option>
            </select>

            {(selectedCategory !== 'all' ||
              selectedPlatform !== 'all' ||
              fulfillmentFilter !== 'all' ||
              searchQuery !== '') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="font-mono text-xs text-rose-400 hover:text-rose-300"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </div>

        {/* Categories Chips */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            หมวดหมู่ซอฟต์แวร์:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_#00f0ff]'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Platforms and Fulfillment Modes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          {/* Platforms */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              แพลตฟอร์ม:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                    selectedPlatform === plat
                      ? 'bg-emerald-400 text-slate-950 font-bold shadow-[0_0_8px_#05ffa1]'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {plat === 'all' ? 'ทุกแพลตฟอร์ม' : plat}
                </button>
              ))}
            </div>
          </div>

          {/* Fulfillment Type */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              รูปแบบการจัดส่ง:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFulfillmentFilter('all')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                  fulfillmentFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFulfillmentFilter('instant')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-all flex items-center gap-1 ${
                  fulfillmentFilter === 'instant'
                    ? 'bg-emerald-400 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                <Zap className="w-3 h-3 text-current" /> ส่งมอบทันที (Auto-Vault)
              </button>
              <button
                onClick={() => setFulfillmentFilter('manual')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-all ${
                  fulfillmentFilter === 'manual'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                จัดส่งตามสั่ง (1-2 ชม.)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <div>
          พบสินค้าลิขสิทธิ์ทั้งหมด{' '}
          <strong className="text-cyan-400">{filteredProducts.length}</strong> รายการ
        </div>
        <div className="flex items-center gap-2 text-emerald-400 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SUPABASE DATABASE VERIFIED</span>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-sm space-y-3">
          <p className="text-sm font-sans text-slate-300">
            ไม่พบคีย์ลิขสิทธิ์ที่ตรงกับเงื่อนไขการค้นหาของคุณ
          </p>
          <Button variant="ghost" size="sm" onClick={handleResetFilters} className="font-mono text-xs">
            ล้างตัวกรองเพื่อดูสินค้าทั้งหมด
          </Button>
        </div>
      )}
    </div>
  )
}
