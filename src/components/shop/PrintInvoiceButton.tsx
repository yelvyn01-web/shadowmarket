'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function PrintInvoiceButton() {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handlePrint}
      leftIcon={<Printer className="w-3.5 h-3.5 text-cyan-400" />}
      className="font-mono text-xs print:hidden"
    >
      พิมพ์ใบเสร็จ
    </Button>
  )
}
