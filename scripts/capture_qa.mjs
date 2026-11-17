import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true })
}

async function capture() {
  const browser = await chromium.launch({ headless: true })
  
  // 1. Desktop Viewport
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  })
  const page = await desktopContext.newPage()

  console.log('1. Capturing Homepage...')
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'homepage.png'), fullPage: false })

  console.log('2. Capturing Catalog...')
  await page.goto('http://localhost:3000/products', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'catalog.png'), fullPage: false })

  console.log('3. Capturing Product Detail...')
  await page.goto('http://localhost:3000/products/windows-11-pro-retail', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'product-detail.png'), fullPage: false })

  console.log('4. Adding to Cart & Capturing Cart...')
  await page.click('button:has-text("เพิ่มลงตะกร้า")')
  await page.waitForTimeout(500)
  await page.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'cart.png'), fullPage: false })

  console.log('5. Capturing Checkout (Sandbox)...')
  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'checkout.png'), fullPage: false })

  await desktopContext.close()

  // 6. Mobile Viewport (iPhone 14 Pro: 393 x 852)
  console.log('6. Capturing Mobile Responsive Homepage...')
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  const mobilePage = await mobileContext.newPage()
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile-home.png'), fullPage: false })

  console.log('7. Capturing Mobile Responsive Catalog...')
  await mobilePage.goto('http://localhost:3000/products', { waitUntil: 'networkidle' })
  await mobilePage.screenshot({ path: path.join(artifactDir, 'mobile-catalog.png'), fullPage: false })

  await mobileContext.close()
  await browser.close()
  console.log('All QA screenshots captured successfully!')
}

capture().catch((err) => {
  console.error('Capture error:', err)
  process.exit(1)
})
