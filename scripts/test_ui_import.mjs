import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

async function runUITest() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  console.log('1. Navigating to /admin/procurement...')
  await page.goto('http://localhost:3000/admin/procurement', { waitUntil: 'networkidle' })

  console.log('2. Filling batch import form...')
  const testKey1 = `WIN11-UI-${Date.now().toString(36).toUpperCase()}-1111-2222`
  const testKey2 = `WIN11-UI-${Date.now().toString(36).toUpperCase()}-3333-4444`

  await page.fill('textarea', `${testKey1}\n${testKey2}`)

  console.log('3. Submitting batch import form...')
  await page.click('button:has-text("เข้ารหัส AES-256-GCM และนำเข้าคีย์")')

  console.log('4. Waiting for success confirmation...')
  await page.waitForSelector('text=นำเข้าและเข้ารหัสคีย์สำเร็จ!', { timeout: 10000 })

  console.log('5. Capturing import success screenshot...')
  await page.screenshot({ path: path.join(artifactDir, 'procurement-import-success.png'), fullPage: true })

  console.log('PASS: UI Batch Import completed and verified successfully!')
  await browser.close()
}

runUITest().catch((err) => {
  console.error('FAIL in UI import test:', err)
  process.exit(1)
})
