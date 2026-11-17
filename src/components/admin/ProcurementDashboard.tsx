'use client'

import React, { useState, useTransition } from 'react'
import {
  KeyRound,
  ShieldCheck,
  PlusCircle,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  RefreshCw,
  Send,
  Database,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Package,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatPriceTHB } from '@/lib/utils'
import {
  importBatchKeysAction,
  fulfillManualOrderAction,
  BatchImportResponse,
} from '@/actions/procurement'

interface ProductOption {
  id: string
  title: string
  platform: string
  stock_quantity: number
}

interface InventoryItem {
  id: string
  status: string
  supplier_name: string | null
  cost_price: number | null
  batch_reference: string | null
  created_at: string
  products: {
    id: string
    title: string
    platform: string
  } | null
}

interface QueueOrder {
  id: string
  status: string
  customer_email: string
  total_amount: number
  created_at: string
  order_items: {
    id: string
    product_id: string
    product_title_snapshot: string
    unit_price: number
    license_key_id: string | null
  }[]
}

interface ProcurementDashboardProps {
  products: ProductOption[]
  initialInventory: InventoryItem[]
  initialQueue: QueueOrder[]
}

export function ProcurementDashboard({
  products,
  initialInventory,
  initialQueue,
}: ProcurementDashboardProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'vault' | 'queue'>('import')
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>(initialInventory)
  const [queueList, setQueueList] = useState<QueueOrder[]>(initialQueue)

  // Batch Import Form State
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '')
  const [supplierName, setSupplierName] = useState('Microsoft Authorized Partner')
  const [costPrice, setCostPrice] = useState('890')
  const [batchRef, setBatchRef] = useState(`BATCH-${Date.now().toString(36).toUpperCase()}`)
  const [rawKeys, setRawKeys] = useState('')
  const [isPending, startTransition] = useTransition()
  const [importResult, setImportResult] = useState<BatchImportResponse | null>(null)

  // Manual Fulfill Modal State
  const [fulfillingItem, setFulfillingItem] = useState<{
    orderId: string
    orderItemId: string
    productTitle: string
    productId: string
    customerEmail: string
  } | null>(null)
  const [fulfillKeyText, setFulfillKeyText] = useState('')
  const [complianceChecked, setComplianceChecked] = useState(false)
  const [fulfillError, setFulfillError] = useState<string | null>(null)
  const [fulfillSuccess, setFulfillSuccess] = useState(false)

  // Vault Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned' | 'redeemed'>('all')

  // Calculate vault stats
  const totalKeys = inventoryList.length
  const availableKeys = inventoryList.filter((k) => k.status === 'available').length
  const assignedKeys = inventoryList.filter((k) => k.status === 'assigned' || k.status === 'redeemed').length
  const totalVaultValue = inventoryList
    .filter((k) => k.status === 'available')
    .reduce((sum, k) => sum + (Number(k.cost_price) || 0), 0)

  // Handle Batch Import
  const handleBatchImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setImportResult(null)

    if (!selectedProductId) {
      setImportResult({ success: false, error: 'กรุณาเลือกสินค้าที่ต้องการเติมสต็อก' })
      return
    }

    if (!rawKeys.trim()) {
      setImportResult({ success: false, error: 'กรุณากรอกรหัสคีย์อย่างน้อย 1 รายการ' })
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('productId', selectedProductId)
      formData.set('rawKeys', rawKeys)
      formData.set('supplierName', supplierName)
      formData.set('costPrice', costPrice)
      formData.set('batchReference', batchRef)

      const res = await importBatchKeysAction(formData)
      setImportResult(res)

      if (res.success) {
        setRawKeys('')
        setBatchRef(`BATCH-${Date.now().toString(36).toUpperCase()}`)
      }
    })
  }

  // Handle Manual Fulfill
  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fulfillingItem) return
    if (!fulfillKeyText.trim()) {
      setFulfillError('กรุณากรอกรหัสคีย์ลิขสิทธิ์')
      return
    }
    if (!complianceChecked) {
      setFulfillError('กรุณากดยืนยันว่าคีย์นี้ถูกต้องตามกฎหมายและไม่ใช่โปรแกรมโกงเกม')
      return
    }

    setFulfillError(null)
    startTransition(async () => {
      const res = await fulfillManualOrderAction({
        orderId: fulfillingItem.orderId,
        orderItemId: fulfillingItem.orderItemId,
        productId: fulfillingItem.productId,
        plaintextKey: fulfillKeyText.trim(),
      })

      if (res.success) {
        setFulfillSuccess(true)
        // Remove from local queue
        setQueueList((prev) => prev.filter((o) => o.id !== fulfillingItem.orderId))
        setTimeout(() => {
          setFulfillingItem(null)
          setFulfillKeyText('')
          setComplianceChecked(false)
          setFulfillSuccess(false)
        }, 1500)
      } else {
        setFulfillError(res.error || 'เกิดข้อผิดพลาดในการจัดส่งคีย์')
      }
    })
  }

  // Filtered Inventory
  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch =
      item.products?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batch_reference?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      {/* Top Header & Cyber Metrics */}
      <div className="border border-cyan-500/30 bg-slate-900/60 p-6 rounded-lg backdrop-blur shadow-[0_0_25px_rgba(0,240,255,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 rounded">
                <Database className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-sans text-white tracking-wide">
                ระบบจัดซื้อ & คลังคีย์ลิขสิทธิ์นิรภัย
              </h1>
              <Badge variant="cyan" size="sm" showDot>
                ADMIN COMMAND
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              PROCUREMENT, BATCH AES-256-GCM ENCRYPTION & MANUAL FULFILLMENT QUEUE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="px-3 py-1.5 bg-slate-950/80 border border-emerald-500/30 text-emerald-400 rounded flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              AES-256-GCM ACTIVE
            </span>
            <span className="px-3 py-1.5 bg-slate-950/80 border border-cyan-500/30 text-cyan-400 rounded flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400" />
              SHA-256 COLLISION SAFE
            </span>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              คีย์พร้อมจำหน่ายในคลัง
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-400">{availableKeys}</span>
              <span className="text-xs text-slate-400">คีย์</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              คีย์ที่ส่งมอบแล้ว
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-cyan-400">{assignedKeys}</span>
              <span className="text-xs text-slate-400">คีย์</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              คิวรอจัดซื้อ / ส่งมอบ
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-amber-400">{queueList.length}</span>
              <span className="text-xs text-slate-400">รายการ</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              มูลค่าสินค้าในคลังนิรภัย
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold font-mono text-white">
                {formatPriceTHB(totalVaultValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'import'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          1. นำเข้าคีย์เป็นชุด (Batch Ingestion)
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'vault'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 shadow-[0_0_12px_rgba(0,240,255,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          2. คลังคีย์นิรภัย (Key Vault)
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {totalKeys}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'queue'
              ? 'border-amber-400 text-amber-400 bg-amber-950/20 shadow-[0_0_12px_rgba(255,184,0,0.2)]'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Clock className="w-4 h-4" />
          3. คิวจัดซื้อตามสั่ง (Manual Queue)
          {queueList.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-[10px] text-amber-300 font-bold">
              {queueList.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BATCH KEY IMPORTER */}
      {activeTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <form
              onSubmit={handleBatchImport}
              className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  ฟอร์มนำเข้าคีย์ลิขสิทธิ์เข้ารหัส (Batch Key Import)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  เข้ารหัสอัตโนมัติก่อนบันทึก
                </span>
              </div>

              {/* Product Select */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                  เลือกสินค้าที่ต้องการเติมคีย์ *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.platform}) — สต็อกปัจจุบัน: {p.stock_quantity} ชิ้น
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier & Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                    ชื่อผู้จัดจำหน่าย / ซัพพลายเออร์ *
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="เช่น Microsoft Authorized Partner"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                    ราคาทุนต่อคีย์ (บาท) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Batch Ref */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    รหัสชุดล็อตสินค้า (Batch Reference)
                  </label>
                  <button
                    type="button"
                    onClick={() => setBatchRef(`BATCH-${Date.now().toString(36).toUpperCase()}`)}
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> สุ่มรหัสใหม่
                  </button>
                </div>
                <input
                  type="text"
                  value={batchRef}
                  onChange={(e) => setBatchRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Raw Keys Textarea */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                  รายการคีย์ลิขสิทธิ์ (ใส่ 1 คีย์ต่อบรรทัด) *
                </label>
                <textarea
                  rows={6}
                  value={rawKeys}
                  onChange={(e) => setRawKeys(e.target.value)}
                  placeholder={`XXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY\nZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ`}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
                  required
                />
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  ระบบจะแยกคีย์อัตโนมัติตามบรรทัด และตัดช่องว่างส่วนเกินออก
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-mono tracking-wider"
                disabled={isPending}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                {isPending ? 'กำลังเข้ารหัสและบันทึกลงฐานข้อมูล...' : 'เข้ารหัส AES-256-GCM และนำเข้าคีย์'}
              </Button>
            </form>

            {/* Results Display */}
            {importResult && (
              <div
                className={`p-5 rounded-lg border ${
                  importResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {importResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-2">
                    <h4 className="font-sans font-bold text-sm">
                      {importResult.success ? 'นำเข้าและเข้ารหัสคีย์สำเร็จ!' : 'เกิดข้อผิดพลาดในการนำเข้า'}
                    </h4>
                    {importResult.error && (
                      <p className="text-xs font-mono">{importResult.error}</p>
                    )}
                    {importResult.success && (
                      <div className="text-xs font-mono space-y-1">
                        <p className="text-emerald-300">
                          ✓ นำเข้าคีย์ใหม่สำเร็จ: {importResult.importedCount} รายการ (ปรับปรุงสต็อกเรียบร้อย)
                        </p>
                        {importResult.duplicateCount ? (
                          <div className="mt-2 p-3 bg-amber-950/40 border border-amber-500/40 rounded text-amber-200">
                            <p className="font-bold flex items-center gap-1.5 text-amber-300">
                              <AlertCircle className="w-4 h-4" />
                              ตรวจพบคีย์ซ้ำในระบบ: {importResult.duplicateCount} รายการ (ถูกปฏิเสธเพื่อป้องกันความซ้ำซ้อน)
                            </p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-400">
                              {importResult.duplicates?.map((k, i) => (
                                <li key={i}>{k}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Info & Compliance Guide */}
          <div className="space-y-6">
            <div className="p-5 bg-slate-900/60 border border-cyan-500/30 rounded-lg space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-sans font-bold text-sm text-white">มาตรฐานความปลอดภัยคีย์ลิขสิทธิ์</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5 font-sans leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">1.</span>
                  <span>
                    <strong>การเข้ารหัสระดับกองทัพ:</strong> คีย์ทุกชิ้นจะถูกเข้ารหัสด้วย <code>AES-256-GCM</code> พร้อม IV แบบสุ่ม 96-bit และ Auth Tag 128-bit
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">2.</span>
                  <span>
                    <strong>ป้องกันคีย์ซ้ำ (Zero Duplication):</strong> สแกนแฮช <code>SHA-256</code> ก่อนจัดเก็บ เพื่อป้องกันการใส่คีย์เดิมซ้ำโดยไม่ได้ตั้งใจ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">3.</span>
                  <span>
                    <strong>Zero-Plaintext at Rest:</strong> ไม่มีบุคคลใดหรือแฮกเกอร์ที่สามารถอ่านคีย์ข้อความเปล่าจากฐานข้อมูลได้โดยตรง
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-5 bg-amber-950/30 border border-amber-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-sans font-bold text-sm text-white">นโยบายลิขสิทธิ์ของร้าน</h4>
              </div>
              <p className="text-xs text-amber-200/80 leading-relaxed font-sans">
                ShadowMarket อนุญาตเฉพาะคีย์ลิขสิทธิ์ซอฟต์แวร์แท้ บัตรเติมเงิน และโค้ดพัฒนาที่มีเอกสารสิทธิ์ถูกต้อง ห้ามนำเข้าโปรแกรมโกงเกม ไพรเวทเซิร์ฟเวอร์ หรือซอฟต์แวร์แคร็กโดยเด็ดขาด
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KEY VAULT INVENTORY */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า, ซัพพลายเออร์, รหัสล็อต..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3.5 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono text-slate-400">สถานะ:</span>
              {(['all', 'available', 'assigned', 'redeemed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 text-xs font-mono rounded uppercase transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st === 'all'
                    ? 'ทั้งหมด'
                    : st === 'available'
                    ? 'พร้อมขาย'
                    : st === 'assigned'
                    ? 'ส่งมอบแล้ว'
                    : 'เปิดดูแล้ว'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">ชื่อสินค้า & แพลตฟอร์ม</th>
                    <th className="p-3.5">รหัสคีย์เข้ารหัส (Masked)</th>
                    <th className="p-3.5">สถานะ</th>
                    <th className="p-3.5">ผู้จัดจำหน่าย (Supplier)</th>
                    <th className="p-3.5">ราคาทุน</th>
                    <th className="p-3.5">รหัสชุดล็อต</th>
                    <th className="p-3.5">วันที่บันทึก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        ไม่พบคีย์ลิขสิทธิ์ในหมวดหมู่นี้
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-sans">
                          <p className="font-bold text-white text-xs">
                            {k.products?.title || 'สินค้าไม่ระบุ'}
                          </p>
                          <span className="text-[10px] font-mono text-cyan-400">
                            {k.products?.platform || 'Digital Key'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-1 bg-slate-950 border border-slate-800 text-cyan-300 rounded text-[11px] flex items-center gap-1.5 w-max">
                            <Lock className="w-3 h-3 text-cyan-400" />
                            ••••-••••-••••-XXXX
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              k.status === 'available'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                : k.status === 'assigned'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                                : 'bg-purple-950 text-purple-400 border border-purple-500/40'
                            }`}
                          >
                            {k.status === 'available'
                              ? 'พร้อมจำหน่าย'
                              : k.status === 'assigned'
                              ? 'ส่งมอบแล้ว'
                              : 'เปิดใช้งานแล้ว'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-400">{k.supplier_name || '-'}</td>
                        <td className="p-3.5 text-white font-bold">
                          {k.cost_price ? formatPriceTHB(Number(k.cost_price)) : '-'}
                        </td>
                        <td className="p-3.5 text-slate-400 text-[11px]">{k.batch_reference || '-'}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">
                          {new Date(k.created_at).toLocaleString('th-TH')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MANUAL PROCUREMENT QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-6">
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="font-sans font-bold text-sm text-white">
                  คิวคำสั่งซื้อที่รอการจัดซื้อและส่งมอบด้วยมือ (Manual Fulfillment Queue)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 font-sans">
                  สำหรับรายการสินค้าประเภท Pre-Order หรือใบอนุญาตแบบ Enterprise ที่ต้องจัดซื้อเฉพาะบุคคล
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-amber-400 font-bold px-2.5 py-1 bg-amber-950/80 border border-amber-500/40 rounded">
              {queueList.length} รายการรอจัดส่ง
            </span>
          </div>

          {queueList.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-lg bg-slate-900/40 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-sans font-bold text-lg text-white">ไม่มีรายการค้างในคิวจัดส่ง</h3>
              <p className="text-xs text-slate-400 font-mono">
                ALL ORDERS PROCESSED // ZERO BACKLOG
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueList.map((order) => (
                <div
                  key={order.id}
                  className="p-5 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-cyan-500/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="font-mono text-xs text-slate-300">
                        {order.customer_email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white text-sm">
                        ยอดชำระ: {formatPriceTHB(Number(order.total_amount))}
                      </span>
                      <Badge variant="amber" size="sm">
                        {order.status === 'pending' ? 'รอจัดส่งคีย์' : 'กำลังดำเนินการ'}
                      </Badge>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-950/80 border border-slate-800/80 rounded gap-3"
                      >
                        <div>
                          <p className="font-sans font-bold text-xs text-white">
                            {item.product_title_snapshot}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            ราคา: {formatPriceTHB(Number(item.unit_price))} // รหัสสินค้า: {item.product_id.slice(0, 8)}
                          </p>
                        </div>

                        <div>
                          {item.license_key_id ? (
                            <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ส่งมอบคีย์แล้ว
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="font-mono text-xs"
                              leftIcon={<Send className="w-3.5 h-3.5 text-cyan-400" />}
                              onClick={() => {
                                setFulfillingItem({
                                  orderId: order.id,
                                  orderItemId: item.id,
                                  productTitle: item.product_title_snapshot,
                                  productId: item.product_id,
                                  customerEmail: order.customer_email,
                                })
                              }}
                            >
                              จัดส่งคีย์ทันที (Fulfill)
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULFILL MODAL DIALOG */}
      {fulfillingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/50 rounded-lg p-6 space-y-5 shadow-[0_0_40px_rgba(0,240,255,0.2)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" />
                จัดส่งคีย์ลิขสิทธิ์ให้ลูกค้า
              </h3>
              <button
                onClick={() => setFulfillingItem(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕ ปิด
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
              <p className="text-slate-300">
                <span className="text-slate-500">คำสั่งซื้อ:</span> #{fulfillingItem.orderId}
              </p>
              <p className="text-slate-300">
                <span className="text-slate-500">อีเมลลูกค้า:</span> {fulfillingItem.customerEmail}
              </p>
              <p className="text-cyan-400">
                <span className="text-slate-500">สินค้าที่สั่งซื้อ:</span> {fulfillingItem.productTitle}
              </p>
            </div>

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                  กรอกรหัสคีย์ลิขสิทธิ์ที่จัดซื้อมา *
                </label>
                <input
                  type="text"
                  value={fulfillKeyText}
                  onChange={(e) => setFulfillKeyText(e.target.value)}
                  placeholder="เช่น ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3.5 py-2.5 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  required
                />
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  ระบบจะเข้ารหัส AES-256-GCM ทันที และนำไปผูกกับออเดอร์นี้
                </p>
              </div>

              {/* Compliance Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer p-3 bg-slate-950/60 border border-slate-800 rounded">
                <input
                  type="checkbox"
                  checked={complianceChecked}
                  onChange={(e) => setComplianceChecked(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span className="text-xs text-slate-300 font-sans leading-tight">
                  ข้าพเจ้ายืนยันว่าคีย์ลิขสิทธิ์นี้ถูกต้องตามกฎหมาย และ<strong>ไม่ใช่โปรแกรมโกงเกม (No Cheats / No Hacks)</strong>
                </span>
              </label>

              {fulfillError && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded text-rose-300 text-xs font-mono">
                  {fulfillError}
                </div>
              )}

              {fulfillSuccess && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded text-emerald-300 text-xs font-mono">
                  ✓ จัดส่งคีย์และอัปเดตสถานะคำสั่งซื้อสำเร็จเรียบร้อย!
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFulfillingItem(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPending || fulfillSuccess}
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                >
                  {isPending ? 'กำลังเข้ารหัสและจัดส่ง...' : 'เข้ารหัสและส่งมอบคีย์'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
