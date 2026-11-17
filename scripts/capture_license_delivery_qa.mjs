import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'
const testOrderId = '3d719a0e-90f1-4918-bd10-694524c9ac0f'

async function capture() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } })
  const page = await context.newPage()

  console.log(`1. Navigating to /orders/${testOrderId}...`)
  await page.goto(`http://localhost:3000/orders/${testOrderId}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  // 1. Capture Masked State
  console.log('2. Capturing Receipt with Masked License Key...')
  await page.screenshot({ path: path.join(artifactDir, 'receipt-masked-key.png'), fullPage: true })

  // 2. Click Reveal Key button
  console.log('3. Clicking "ถอดรหัสดูคีย์" (Decrypt & Reveal)...')
  const revealBtn = page.locator('button:has-text("ถอดรหัสดูคีย์")').first()
  await revealBtn.click()

  // 3. Wait for plaintext key to appear
  console.log('4. Waiting for Decrypted Plaintext Key...')
  await page.waitForSelector('text=ขั้นตอนการเปิดใช้งานลิขสิทธิ์แท้', { timeout: 10000 })
  await page.waitForTimeout(600)

  // 4. Capture Decrypted State
  console.log('5. Capturing Receipt with Decrypted Key & Activation Guide...')
  await page.screenshot({ path: path.join(artifactDir, 'receipt-decrypted-key.png'), fullPage: true })

  // 5. Emulate Print View
  console.log('6. Capturing Printable Invoice View...')
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(artifactDir, 'receipt-printable-invoice.png'), fullPage: true })

  await browser.close()
  console.log('ALL MILESTONE 7 SCREENSHOTS CAPTURED SUCCESSFULLY!')
}

capture().catch((err) => {
  console.error('Error capturing milestone 7 screenshots:', err)
  process.exit(1)
})
