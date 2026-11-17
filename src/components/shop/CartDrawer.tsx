'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatPriceTHB } from '@/lib/utils'

export function CartDrawer() {
  const { items, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, subtotal, totalItems } =
    useCart()

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded text-cyan-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 font-mono tracking-wider">
                  ตะกร้าสินค้า ({totalItems})
                </h2>
                <p className="text-[11px] text-cyan-400 font-mono">
                  [ORDER_BUFFER: ACTIVE]
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              aria-label="ปิดตะกร้า"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">
                    ตะกร้าสินค้าของคุณว่างเปล่า
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs font-mono">
                    เลือกซอฟต์แวร์หรือคีย์ลิขสิทธิ์แท้ที่คุณต้องการ แล้วเพิ่มลงตะกร้าได้ทันที
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCartOpen(false)}
                >
                  เลือกดูสินค้าทั้งหมด
                </Button>
              </div>
            ) : (
              items.map(({ product, quantity }) => {
                const itemPrice = product.salePrice ?? product.basePrice
                return (
                  <div
                    key={product.id}
                    className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-sm flex gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="relative w-16 h-16 rounded bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0">
                      <Image
                        src={product.imageUrl}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs font-semibold text-slate-100 hover:text-cyan-400 transition-colors line-clamp-1"
                        >
                          {product.title}
                        </Link>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-0.5"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant="cyan" size="sm">
                          {product.platform}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatPriceTHB(itemPrice)}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center border border-slate-700 bg-slate-950 rounded-sm">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono text-slate-200">
                            {quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            disabled={quantity >= product.stock}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-cyan-400 font-mono">
                          {formatPriceTHB(itemPrice * quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer & Checkout CTA */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-mono">ยอดรวมสุทธิ</span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {formatPriceTHB(subtotal)}
                </span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded text-[11px] text-emerald-400 font-mono">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>รับประกันลิขสิทธิ์แท้ 100% ส่งมอบด้วยการเข้ารหัส</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="block w-full"
              >
                <Button
                  variant="primary"
                  className="w-full"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  ดำเนินการชำระเงิน
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
