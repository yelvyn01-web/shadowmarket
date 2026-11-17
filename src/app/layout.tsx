import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/components/shop/CartDrawer'

export const metadata: Metadata = {
  title: 'ShadowMarket | ศูนย์รวมคีย์ลิขสิทธิ์ซอฟต์แวร์แท้ระดับพรีเมียม',
  description:
    'แพลตฟอร์มจำหน่ายคีย์ลิขสิทธิ์ซอฟต์แวร์แท้ Windows, Office, JetBrains และบัตรกำนัลดิจิทัลที่ถูกต้องตามกฎหมาย 100% ส่งมอบอัตโนมัติด้วยการเข้ารหัสความปลอดภัยขั้นสูงสุด',
  keywords: [
    'คีย์แท้ Windows 11',
    'Microsoft Office แท้',
    'JetBrains All Products Pack',
    'คีย์ซอฟต์แวร์ลิขสิทธิ์',
    'Digital License Reseller',
    'ShadowMarket',
  ],
  authors: [{ name: 'ShadowMarket Architecture Team' }],
  openGraph: {
    title: 'ShadowMarket | Secure Digital Product License Vault',
    description: '100% Authorized Digital Licenses. Encrypted Delivery with AES-256-GCM.',
    siteName: 'ShadowMarket',
    locale: 'th_TH',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className="dark scroll-smooth">
      <body className="antialiased flex flex-col min-h-screen selection:bg-cyan-500 selection:text-slate-950">
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}
