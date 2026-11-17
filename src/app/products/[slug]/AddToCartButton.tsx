'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Zap, Plus, Minus, Check } from 'lucide-react'
import { Product } from '@/types/product'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'

export function AddToCartButton({ product }: { product: Product }) {
  const router = useRouter()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

  const isOutOfStock = product.stock <= 0

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    router.push('/checkout')
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Quantity Stepper */}
      <div className="flex items-center justify-between sm:justify-start border border-slate-700 bg-slate-950 rounded-sm px-2 py-1">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          disabled={quantity <= 1 || isOutOfStock}
          aria-label="ลดจำนวน"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="px-3 text-sm font-mono text-slate-200">{quantity}</span>
        <button
          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          disabled={quantity >= product.stock || isOutOfStock}
          aria-label="เพิ่มจำนวน"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant={isAdded ? 'emerald' : 'secondary'}
          size="md"
          disabled={isOutOfStock}
          onClick={handleAddToCart}
          className="flex-1 sm:flex-initial"
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4 mr-1 text-emerald-400" /> เพิ่มแล้ว
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-1 text-cyan-400" /> เพิ่มลงตะกร้า
            </>
          )}
        </Button>

        <Button
          variant="primary"
          size="md"
          disabled={isOutOfStock}
          onClick={handleBuyNow}
          className="flex-1 sm:flex-initial"
          rightIcon={<Zap className="w-4 h-4" />}
        >
          ซื้อทันที
        </Button>
      </div>
    </div>
  )
}
