'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
  Tag,
  Lock,
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { formatPriceTHB } from '@/lib/utils'

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, subtotal, totalItems } = useCart()

  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<number>(0)
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null)

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (promoCode.trim().toUpperCase() === 'SHADOW10') {
      const discount = Math.round(subtotal * 0.1)
      setPromoDiscount(discount)
      setPromoMessage({ text: 'ใช้โค้ด SHADOW10 รับส่วนลด 10% สำเร็จ!', isError: false })
    } else {
      setPromoDiscount(0)
      setPromoMessage({ text: 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ (ลองใช้: SHADOW10)', isError: true })
    }
  }

  const grandTotal = Math.max(0, subtotal - promoDiscount)

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <Badge variant="cyan">SHOPPING CART</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
            ตะกร้าสินค้าของคุณว่างเปล่า
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto font-sans">
            คุณยังไม่มีรายการคีย์ลิขสิทธิ์ซอฟต์แวร์ในตะกร้า สามารถเข้าไปเลือกดูสินค้าแท้พร้อมส่งมอบได้ทันที
          </p>
        </div>
        <div>
          <Link href="/products">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              เลือกดูสินค้าทั้งหมด
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan">BUFFER_STATUS: ACTIVE</Badge>
            <span className="text-xs font-mono text-slate-400">
              [{totalItems} รายการในตะกร้า]
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-sans tracking-tight">
            ตะกร้าสินค้าของคุณ
          </h1>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" /> ล้างตะกร้าทั้งหมด
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-3">
            {items.map(({ product, quantity }) => {
              const itemPrice = product.salePrice ?? product.basePrice
              return (
                <div
                  key={product.id}
                  className="p-4 sm:p-5 bg-slate-900/80 border border-slate-800 rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-20 h-20 rounded bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" size="sm">
                          {product.platform}
                        </Badge>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {product.fulfillmentType === 'instant' ? '✓ ส่งมอบทันที' : '⏱ ตามสั่ง'}
                        </span>
                      </div>
                      <Link
                        href={`/products/${product.slug}`}
                        className="text-sm font-bold text-slate-100 hover:text-cyan-400 transition-colors block line-clamp-1"
                      >
                        {product.title}
                      </Link>
                      <span className="text-xs font-mono text-slate-400 block">
                        ราคาต่อหน่วย: {formatPriceTHB(itemPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="flex items-center border border-slate-700 bg-slate-950 rounded-sm">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        aria-label="ลดจำนวน"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-mono text-slate-200">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        disabled={quantity >= product.stock}
                        aria-label="เพิ่มจำนวน"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <span className="text-sm sm:text-base font-bold font-mono text-cyan-400 block">
                        {formatPriceTHB(itemPrice * quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors font-mono"
                      >
                        ลบออก
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-sm flex items-center justify-between text-xs font-mono text-slate-400">
            <Link href="/products" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> เลือกซื้อสินค้าเพิ่มเติม
            </Link>
            <span className="text-slate-500">
              สต็อกคีย์ได้รับการล็อกสำรองขณะทำการสั่งซื้อ
            </span>
          </div>
        </div>

        {/* Right: Order Summary & Checkout (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-sm space-y-5">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider pb-3 border-b border-slate-800">
              สรุปคำสั่งซื้อ (ORDER SUMMARY)
            </h2>

            {/* Promo Voucher Form */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <label className="text-xs font-mono text-slate-400 block">
                โค้ดส่วนลด (Promo Voucher):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="เช่น SHADOW10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-sm px-3 py-1.5 text-xs font-mono text-slate-100 uppercase focus:outline-none focus:border-cyan-400"
                />
                <Button type="submit" variant="secondary" size="sm">
                  ใช้โค้ด
                </Button>
              </div>
              {promoMessage && (
                <p
                  className={`text-[11px] font-mono ${
                    promoMessage.isError ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {promoMessage.text}
                </p>
              )}
            </form>

            {/* Pricing breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>ยอดรวมสินค้า ({totalItems} ชิ้น)</span>
                <span>{formatPriceTHB(subtotal)}</span>
              </div>

              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>ส่วนลดโปรโมชัน (10%)</span>
                  <span>-{formatPriceTHB(promoDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>ค่าธรรมเนียมการส่งมอบดิจิทัล</span>
                <span className="text-emerald-400">ฟรี (Instant Auto)</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline text-sm font-bold">
                <span className="text-white">ยอดชำระสุทธิ</span>
                <span className="text-lg text-cyan-400 font-mono">
                  {formatPriceTHB(grandTotal)}
                </span>
              </div>
            </div>

            <Link href="/checkout" className="block w-full pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                ไปยังหน้าชำระเงิน
              </Button>
            </Link>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded text-[11px] text-slate-400 font-sans space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>การันตีความปลอดภัย 100%</span>
              </div>
              <p>
                คีย์ดิจิทัลจะถูกส่งมอบทันทีหลังยืนยันการชำระเงิน สามารถเปิดดูได้ในหน้าประวัติคำสั่งซื้อ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
