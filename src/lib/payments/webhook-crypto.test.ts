import { describe, it, expect } from 'vitest'
import { signWebhookPayload, verifyWebhookSignature } from './webhook-crypto'

describe('Webhook HMAC-SHA256 Cryptography', () => {
  const secret = 'whsec_test_secret_0123456789abcdef'
  const payload = JSON.stringify({
    eventId: 'evt_123',
    eventType: 'payment.succeeded',
    amount: 1290,
  })

  it('generates a valid sha256 signature prefix', () => {
    const signature = signWebhookPayload(payload, secret)
    expect(signature.startsWith('sha256=')).toBe(true)
    expect(signature.length).toBe(7 + 64) // 'sha256=' + 64 hex chars
  })

  it('verifies a valid signature correctly', () => {
    const signature = signWebhookPayload(payload, secret)
    const isValid = verifyWebhookSignature(payload, signature, secret)
    expect(isValid).toBe(true)
  })

  it('rejects an invalid or tampered signature', () => {
    const fakeSignature = 'sha256=0000000000000000000000000000000000000000000000000000000000000000'
    const isValid = verifyWebhookSignature(payload, fakeSignature, secret)
    expect(isValid).toBe(false)
  })

  it('rejects verification if secret is wrong', () => {
    const signature = signWebhookPayload(payload, secret)
    const isValid = verifyWebhookSignature(payload, signature, 'wrong_secret')
    expect(isValid).toBe(false)
  })

  it('rejects null or empty signature safely without crashing', () => {
    expect(verifyWebhookSignature(payload, null, secret)).toBe(false)
    expect(verifyWebhookSignature(payload, '', secret)).toBe(false)
  })
})
