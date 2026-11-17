import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

async function capture() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  console.log('1. Navigating to /products...')
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' })

  console.log('2. Adding product to cart...')
  // Select JetBrains All Products (which has stock in vault)
  const addBtn = page.locator('button:has-text("สั่งซื้อ")').first()
  await addBtn.click()
  await page.waitForTimeout(600)

  console.log('3. Navigating to /checkout...')
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' })

  console.log('4. Filling checkout form...')
  await page.fill('input[type="email"]', 'vip-customer@shadowmarket.local')
  await page.fill('input[placeholder="ชื่อ-นามสกุลของคุณ"]', 'สมชาย ลูกค้าพรีเมียม')

  console.log('5. Submitting order...')
  const submitBtn = page.locator('button:has-text("ยืนยันและสร้างคำสั่งซื้อ")')
  await submitBtn.click()

  console.log('6. Waiting for Sandbox Payment Modal...')
  await page.waitForSelector('text=ช่องทางการชำระเงินดิจิทัล (Sandbox Simulator)', { timeout: 15000 })
  await page.waitForTimeout(600)

  // 1. Capture PromptPay QR Sandbox Tab
  console.log('7. Capturing PromptPay QR Sandbox...')
  await page.screenshot({ path: path.join(artifactDir, 'payment-promptpay-sandbox.png') })

  // 2. Switch to Test Card tab
  console.log('8. Switching to Card tab...')
  const cardTab = page.locator('button:has-text("Test Card (Stripe)")')
  await cardTab.click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(artifactDir, 'payment-card-sandbox.png') })

  // 3. Click Simulate Payment
  console.log('9. Clicking Simulate Card Charge (Trigger Webhook)...')
  const simulateBtn = page.locator('button:has-text("จำลองการตัดบัตรสำเร็จ")')
  await simulateBtn.click()

  console.log('10. Waiting for Payment & Key Allocation Success...')
  await page.waitForSelector('text=ชำระเงินจำลองสำเร็จเรียบร้อย!', { timeout: 15000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(artifactDir, 'payment-success-sandbox.png') })

  // 4. Click Open Receipt
  console.log('11. Navigating to Order Receipt...')
  const receiptBtn = page.locator('button:has-text("เปิดดูรหัสคีย์ลิขสิทธิ์และใบเสร็จ")')
  await receiptBtn.click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(artifactDir, 'order-paid-receipt.png') })

  await browser.close()
  console.log('ALL PAYMENT SANDBOX SCREENSHOTS CAPTURED SUCCESSFULLY!')
}

capture().catch((err) => {
  console.error('Error capturing payment screenshots:', err)
  process.exit(1)
})
