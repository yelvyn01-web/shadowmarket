'use client'

import React, { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, SlidersHorizontal, ShieldCheck, Zap, RotateCcw } from 'lucide-react'
import { MOCK_PRODUCTS } from '@/data/mockProducts'
import { ProductCard } from '@/components/shop/ProductCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function ProductCatalogContent() {
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

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
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
    }).sort((a, b) => {
      const priceA = a.salePrice ?? a.basePrice
      const priceB = b.salePrice ?? b.basePrice
      if (sortBy === 'price-asc') return priceA - priceB
      if (sortBy === 'price-desc') return priceB - priceA
      return 0
    })
  }, [selectedCategory, selectedPlatform, fulfillmentFilter, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSelectedCategory('all')
    setSelectedPlatform('all')
    setFulfillmentFilter('all')
    setSearchQuery('')
    setSortBy('featured')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" showDot>
            AUTHORIZED CATALOG
          </Badge>
          <span className="text-xs font-mono text-slate-400">
            [VAULT_STOCK: {MOCK_PRODUCTS.length} ITEMS]
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white font-sans tracking-tight">
          คลังสินค้าลิขสิทธิ์ซอฟต์แวร์แท้
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-sans">
          ซอฟต์แวร์ คีย์โปรแกรม และรหัสดิจิทัลทุกรายการได้รับการยืนยันความถูกต้องตามกฎหมาย 100% ปลอดภัยจากการละเมิดลิขสิทธิ์ พร้อมส่งมอบอัตโนมัติ
        </p>
      </div>

      {/* Search & Sort Controls Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 max-w-md">
            <Input
              type="text"
              placeholder="ค้นหาชื่อโปรแกรม, ผู้จัดจำหน่าย หรือคีย์ที่ต้องการ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Quick Stats & Sort Dropdown */}
          <div className="flex items-center justify-between md:justify-end gap-3 font-mono text-xs">
            <span className="text-slate-400 hidden sm:inline">
              ผลลัพธ์: <strong className="text-cyan-400">{filteredProducts.length}</strong> รายการ
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-slate-400 text-xs">
                เรียงตาม:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="เรียงลำดับสินค้า"
                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-sm px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="featured">แนะนำ (Featured)</option>
                <option value="price-asc">ราคา: ต่ำไปสูง</option>
                <option value="price-desc">ราคา: สูงไปต่ำ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-mono whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(0,240,255,0.2)] font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Platform & Delivery Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">แพลตฟอร์ม:</span>
            {platforms.map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors border ${
                  selectedPlatform === plat
                    ? 'bg-slate-800 text-white border-slate-600'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                {plat === 'all' ? 'ทั้งหมด' : plat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setFulfillmentFilter(fulfillmentFilter === 'instant' ? 'all' : 'instant')
              }
              className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 border ${
                fulfillmentFilter === 'instant'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3" /> เฉพาะส่งมอบทันที
            </button>

            {(selectedCategory !== 'all' ||
              selectedPlatform !== 'all' ||
              fulfillmentFilter !== 'all' ||
              searchQuery !== '') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 px-2 py-1"
              >
                <RotateCcw className="w-3 h-3" /> ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-sm space-y-4">
          <p className="text-base text-slate-300 font-sans">
            ไม่พบสินค้าที่ตรงกับเงื่อนไขการค้นหาของคุณ
          </p>
          <p className="text-xs text-slate-400 font-mono">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่มรีเซ็ตตัวกรองด้านบน
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            ล้างตัวกรองทั้งหมด
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-cyan-400 font-mono">[กำลังโหลดคลังสินค้า...]</div>}>
      <ProductCatalogContent />
    </Suspense>
  )
}
