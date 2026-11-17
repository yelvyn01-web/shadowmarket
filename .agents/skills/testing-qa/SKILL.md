---
name: testing-qa
description: >-
  Design and execute automated testing, QA workflows, and test suites for ShadowMarket.
  Covers unit testing, integration testing, end-to-end (E2E) testing with Playwright/Vitest,
  license reservation race conditions, sandbox payment verification, and automated regression.
  Use when writing tests or performing quality assurance (ทดสอบระบบ, Testing, QA, Playwright, Vitest, Jest, E2E tests, Unit tests, Regression).
---

# Testing & Quality Assurance (การทดสอบระบบและประกันคุณภาพ)

Use this skill to design, write, and execute automated test suites (Unit, Integration, and End-to-End E2E) to verify functionality, prevent regressions, and ensure system reliability for ShadowMarket.

---

## 1. Testing Pyramid Strategy for Digital Products

```text
       /\
      /  \       E2E Tests (Playwright)
     /    \      - Critical user journeys (Login -> Browse License -> Checkout -> Sandbox Pay -> Reveal Key)
    /------\     
   /        \    Integration Tests (Vitest + Supabase Test DB)
  /          \   - Server Actions, Atomic Key Reservation, Webhook Signatures, RLS Policy Tests
 /------------\  
/              \ Unit Tests (Vitest)
---------------- - AES-256-GCM encryption/decryption, Zod schemas, pricing calculations, key format checks
```

---

## 2. Unit & Integration Testing (Vitest)

```typescript
// src/lib/crypto/license-crypto.test.ts
import { describe, it, expect } from 'vitest'
import { encryptLicenseKey, decryptLicenseKey } from './license-crypto'

describe('License Key Encryption Service', () => {
  it('correctly encrypts and decrypts a digital license key using AES-256-GCM', () => {
    const rawKey = 'ABCD-1234-EFGH-5678-IJKL'
    const encrypted = encryptLicenseKey(rawKey)

    expect(encrypted.ciphertext).not.toBe(rawKey)
    expect(encrypted.iv).toBeDefined()
    expect(encrypted.authTag).toBeDefined()

    const decrypted = decryptLicenseKey(encrypted)
    expect(decrypted).toBe(rawKey)
  })

  it('fails decryption when ciphertext is tampered', () => {
    const rawKey = 'VALID-KEY-1234'
    const encrypted = encryptLicenseKey(rawKey)
    const tampered = { ...encrypted, ciphertext: 'TamperedCiphertext==' }

    expect(() => decryptLicenseKey(tampered)).toThrow()
  })
})
```

---

## 3. Concurrency & Race Condition Verification

Verify that two simultaneous orders for a single remaining key never result in duplicate assignment:

```typescript
// src/tests/integration/concurrency.test.ts
import { describe, it, expect } from 'vitest'

describe('Inventory Concurrency Test', () => {
  it('prevents overselling when 2 users checkout the last license key simultaneously', async () => {
    // Dispatch 2 concurrent checkout requests for stock = 1
    // Request A succeeds -> Assigned key
    // Request B returns "Out of stock" -> 0 keys assigned
  })
})
```

---

## 4. End-to-End Test (Playwright)

```typescript
// tests/e2e/license-purchase.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Digital License Purchase Flow', () => {
  test('User can browse, checkout in sandbox, and reveal license key', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()

    // 2. Select product
    await page.click('text=Windows 11 Pro Retail')
    await page.click('button:has-text("เพิ่มลงตะกร้า")')

    // 3. Go to checkout
    await page.goto('/checkout')
    await page.click('button:has-text("ชำระเงินด้วยระบบทดสอบ (Sandbox)")')

    // 4. Verify order confirmation & key reveal
    await expect(page.locator('text=ชำระเงินเรียบร้อย')).toBeVisible()
    await page.click('button:has-text("คลิกเพื่อแสดงคีย์")')
    await expect(page.locator('[data-testid="license-key-value"]')).toBeVisible()
  })
})
```

---

## 5. QA Pass Criteria Checklist

- [ ] All Vitest unit tests pass (100% green).
- [ ] Concurrency and race condition tests prevent duplicate key assignments.
- [ ] End-to-End smoke test confirms full journey: catalog -> checkout -> sandbox payment -> key reveal.
- [ ] TypeScript compilation (`npx tsc --noEmit`) passes with 0 errors.
- [ ] ESLint check passes with 0 warnings or errors.
- [ ] Responsive UI verified on mobile (375px), tablet (768px), and desktop (1280px).

---

## 6. Official Documentation References

- [Vitest Official Documentation](https://vitest.dev/guide/)
- [Playwright End-to-End Testing Guide](https://playwright.dev/docs/intro)
- [Testing Library React Guide](https://testing-library.com/docs/react-testing-library/intro/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
