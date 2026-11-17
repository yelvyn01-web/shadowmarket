import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Computes an HMAC-SHA256 signature for a webhook payload.
 * Returns formatted string: "sha256=<hex>"
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(payload, 'utf8')
  return `sha256=${hmac.digest('hex')}`
}

/**
 * Validates an incoming HMAC-SHA256 signature using timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false

  try {
    const expectedSignature = signWebhookPayload(payload, secret)

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
    const actualBuffer = Buffer.from(signature, 'utf8')

    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, actualBuffer)
  } catch {
    return false
  }
}
