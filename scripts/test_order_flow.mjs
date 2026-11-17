import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

async function runTest() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  console.log('1. Navigating to /products...')
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' })

  console.log('2. Adding product to cart...')
  // Click first Add to cart button
  const buyBtn = page.locator('button:has-text("สั่งซื้อ")').first()
  await buyBtn.click()
  await page.waitForTimeout(600)

  console.log('3. Navigating to /checkout...')
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' })

  console.log('4. Filling email...')
  await page.fill('input[type="email"]', 'vip-customer@shadowmarket.local')
  await page.fill('input[placeholder="ชื่อ-นามสกุลของคุณ"]', 'คุณสมชาย ลูกค้าพิเศษ')

  console.log('5. Submitting order...')
  const submitBtn = page.locator('button:has-text("ยืนยันและสร้างคำสั่งซื้อ")')
  await submitBtn.click()

  // Wait for success screen
  await page.waitForSelector('text=บันทึกคำสั่งซื้อลงฐานข้อมูลเรียบร้อยแล้ว!', { timeout: 10000 })
  console.log('Order created successfully!')

  await page.screenshot({ path: path.join(artifactDir, 'order-success.png') })
  console.log('order-success.png captured')

  console.log('6. Navigating to /orders...')
  await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'orders-list.png') })
  console.log('orders-list.png captured')

  console.log('7. Navigating to view receipt...')
  const viewReceiptBtn = page.locator('a:has-text("ดูรายละเอียด")').first()
  await viewReceiptBtn.click()
  await page.waitForTimeout(1000)
  await page.screenshot({ path: path.join(artifactDir, 'order-receipt.png') })
  console.log('order-receipt.png captured')

  await browser.close()
  console.log('All end-to-end tests finished successfully!')
}

runTest().catch((err) => {
  console.error('Test error:', err)
  process.exit(1)
})
