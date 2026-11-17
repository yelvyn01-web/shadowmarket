import { chromium } from 'playwright'
import path from 'path'

const artifactDir = 'C:\\Users\\yelvy\\.gemini\\antigravity\\brain\\900a84a5-7cff-47ea-806a-293d2a556463'

async function capture() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  console.log('1. Navigating to /api/health...')
  await page.goto('http://localhost:3000/api/health')
  await page.screenshot({ path: path.join(artifactDir, 'production-health.png') })

  console.log('2. Navigating to Storefront Homepage...')
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(artifactDir, 'production-ready-storefront.png'), fullPage: true })

  await browser.close()
  console.log('PASS: Milestone 9 screenshots captured successfully!')
}

capture().catch((err) => {
  console.error('Error capturing milestone 9:', err)
  process.exit(1)
})
