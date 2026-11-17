import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

async function capture() {
  const browser = await chromium.launch()
  
  // Desktop Context
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  console.log('1. Navigating to /admin/procurement...')
  await page.goto('http://localhost:3000/admin/procurement', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  // 1. Capture Batch Import tab
  console.log('2. Capturing Tab 1: Batch Key Import...')
  await page.screenshot({ path: path.join(artifactDir, 'procurement-batch-import.png'), fullPage: true })

  // 2. Click Tab 2: Key Vault
  console.log('3. Clicking Tab 2: Key Vault...')
  await page.click('button:has-text("2. คลังคีย์นิรภัย")')
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(artifactDir, 'procurement-vault.png'), fullPage: true })

  // 3. Click Tab 3: Manual Queue
  console.log('4. Clicking Tab 3: Manual Queue...')
  await page.click('button:has-text("3. คิวจัดซื้อตามสั่ง")')
  await page.waitForTimeout(400)

  // Check if there is a Fulfill button to open modal
  const fulfillBtn = page.locator('button:has-text("จัดส่งคีย์ทันที (Fulfill)")').first()
  if (await fulfillBtn.isVisible()) {
    await fulfillBtn.click()
    await page.waitForTimeout(400)
  }
  await page.screenshot({ path: path.join(artifactDir, 'procurement-queue.png'), fullPage: true })

  // Mobile View
  console.log('5. Capturing Mobile View...')
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto('http://localhost:3000/admin/procurement', { waitUntil: 'networkidle' })
  await mobilePage.waitForTimeout(500)
  await mobilePage.screenshot({ path: path.join(artifactDir, 'procurement-mobile.png'), fullPage: true })

  await browser.close()
  console.log('ALL PROCUREMENT SCREENSHOTS CAPTURED SUCCESSFULLY!')
}

capture().catch((err) => {
  console.error('Error capturing procurement screenshots:', err)
  process.exit(1)
})
