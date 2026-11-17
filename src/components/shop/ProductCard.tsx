'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Zap, Clock, ShieldCheck, ShoppingCart, Check, ExternalLink } from 'lucide-react'
import { Product } from '@/types/product'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/context/CartContext'
import { formatPriceTHB } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product, 1)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  const currentPrice = product.salePrice ?? product.basePrice
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.basePrice)
  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <div className="group relative bg-slate-900/80 backdrop-blur-md border border-slate-800/90 hover:border-cyan-500/50 rounded-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]">
      {/* Corner Cyber Accents */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Product Image Area */}
      <Link href={`/products/${product.slug}`} className="relative w-full aspect-[16/10] bg-slate-950 overflow-hidden block">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

        {/* Platform Badge (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <Badge variant="cyan" size="sm">
            {product.platform}
          </Badge>
        </div>

        {/* Delivery Mode Badge (Top Right) */}
        <div className="absolute top-3 right-3 z-10">
          {product.fulfillmentType === 'instant' ? (
            <Badge variant="emerald" size="sm" showDot>
              <Zap className="w-3 h-3 mr-0.5 inline" /> ทันที
            </Badge>
          ) : (
            <Badge variant="amber" size="sm" showDot>
              <Clock className="w-3 h-3 mr-0.5 inline" /> ตามสั่ง
            </Badge>
          )}
        </div>

        {/* Stock Status Badge (Bottom Left) */}
        <div className="absolute bottom-2.5 left-3 z-10">
          {isOutOfStock ? (
            <Badge variant="rose" size="sm">
              สินค้าหมด
            </Badge>
          ) : isLowStock ? (
            <Badge variant="amber" size="sm">
              เหลือน้อย ({product.stock})
            </Badge>
          ) : (
            <span className="text-[10px] font-mono text-emerald-400/90 drop-shadow">
              คงเหลือ: {product.stock} คีย์
            </span>
          )}
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span>{product.publisher}</span>
            <span>•</span>
            <span className="text-cyan-400/80">{product.categoryLabel}</span>
          </div>

          <Link href={`/products/${product.slug}`} className="block mt-1">
            <h3 className="font-sans font-bold text-sm sm:text-base text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
              {product.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-mono font-bold text-cyan-400">
                {formatPriceTHB(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs font-mono text-slate-500 line-through">
                  {formatPriceTHB(product.basePrice)}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">
              ลิขสิทธิ์แท้ 100%
            </span>
          </div>

          <Button
            size="sm"
            variant={isAdded ? 'emerald' : 'primary'}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="flex-shrink-0"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" /> เพิ่มแล้ว
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 mr-1" /> สั่งซื้อ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
