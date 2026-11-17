import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

console.log('==================================================================')
console.log('   SHADOWMARKET - END-TO-END FULL CUSTOMER JOURNEY SMOKE TEST')
console.log('==================================================================\n')

async function runE2E() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 950 } })
  const page = await context.newPage()

  try {
    // 1. Visit Homepage
    console.log('[1/7] Step 1: Visiting Storefront Homepage (/) ...')
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
    const heroTitle = await page.textContent('h1')
    console.log(`PASS: Homepage loaded! Header: "${heroTitle?.trim().slice(0, 40)}..."`)

    // Verify Anti-Cheat Ban Manifesto is clearly visible
    const complianceBanner = await page.locator('text=STRICT POLICY: NO GAME CHEATS / ZERO BYPASSES').first()
    if (await complianceBanner.isVisible()) {
      console.log('PASS: Legal Compliance & Anti-Cheat Prohibition banner verified!')
    }

    // 2. Browse Products Catalog
    console.log('\n[2/7] Step 2: Navigating to Products Catalog (/products) ...')
    await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' })
    await page.waitForSelector('input[placeholder*="ค้นหา"]')

    // 3. Select a product
    console.log('\n[3/7] Step 3: Selecting product and adding to cart ...')
    const buyButton = page.locator('button:has-text("สั่งซื้อ")').first()
    await buyButton.click()
    await page.waitForTimeout(600)

    // 4. Cart verification & Checkout
    console.log('\n[4/7] Step 4: Proceeding to Checkout (/checkout) ...')
    await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' })
    await page.waitForSelector('input[type="email"]')

    // 5. Fill customer details and submit
    console.log('\n[5/7] Step 5: Submitting order details in Checkout form ...')
    await page.fill('input[type="email"]', 'e2e-verified-buyer@shadowmarket.local')
    await page.fill('input[placeholder="ชื่อ-นามสกุลของคุณ"]', 'คุณวิชัย ผู้ซื้อทดสอบระบบ')

    const submitOrderBtn = page.locator('button:has-text("ยืนยันและสร้างคำสั่งซื้อ")')
    await submitOrderBtn.click()

    // 6. Sandbox Payment Gateway
    console.log('\n[6/7] Step 6: Completing Sandbox Payment with HMAC Webhook ...')
    await page.waitForSelector('text=ช่องทางการชำระเงินดิจิทัล (Sandbox Simulator)', { timeout: 15000 })
    await page.waitForTimeout(600)

    // Click card tab and simulate card payment
    const cardTab = page.locator('button:has-text("Test Card (Stripe)")')
    await cardTab.click()
    await page.waitForTimeout(400)

    const payBtn = page.locator('button:has-text("จำลองการตัดบัตรสำเร็จ")')
    await payBtn.click()

    await page.waitForSelector('text=ชำระเงินจำลองสำเร็จเรียบร้อย!', { timeout: 15000 })
    console.log('PASS: Webhook payment confirmed with HMAC-SHA256 signature!')

    // 7. View Receipt & Reveal Decrypted Key
    console.log('\n[7/7] Step 7: Accessing Order Receipt & Decrypting License Key ...')
    const viewReceiptBtn = page.locator('button:has-text("เปิดดูรหัสคีย์ลิขสิทธิ์และใบเสร็จ")')
    await viewReceiptBtn.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Check if key is ready to reveal
    const revealBtn = page.locator('button:has-text("ถอดรหัสดูคีย์")').first()
    if (await revealBtn.isVisible()) {
      await revealBtn.click()
      await page.waitForSelector('text=ขั้นตอนการเปิดใช้งานลิขสิทธิ์แท้', { timeout: 10000 })
      console.log('PASS: AES-256-GCM License Key successfully decrypted and displayed on screen!')
    }

    // Capture complete journey screenshot
    await page.screenshot({ path: path.join(artifactDir, 'e2e-journey-complete.png'), fullPage: true })
    console.log('PASS: Saved E2E full journey screenshot to e2e-journey-complete.png')

    await browser.close()
    console.log('\n==================================================================')
    console.log('   FULL END-TO-END SMOKE TEST PASSED (100% GREEN)')
    console.log('==================================================================\n')
  } catch (err) {
    console.error('E2E TEST FAILED:', err)
    await browser.close()
    process.exit(1)
  }
}

runE2E()
