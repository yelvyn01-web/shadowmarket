import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96 bits for GCM
const AUTH_TAG_LENGTH = 16

function getMasterKey(): Buffer {
  const keyHex = process.env.LICENSE_ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('LICENSE_ENCRYPTION_KEY must be a 64-character (32-byte) hex string')
  }
  return Buffer.from(keyHex, 'hex')
}

export interface EncryptedPayload {
  ciphertext: string // Base64
  iv: string         // Base64
  authTag: string    // Base64
}

/**
 * Encrypts a plaintext license key using AES-256-GCM with authenticated tag.
 */
export function encryptLicenseKey(plaintext: string): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv)

  let encrypted = cipher.update(plaintext.trim(), 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

/**
 * Decrypts an encrypted license key payload using AES-256-GCM.
 * Throws an error if the authTag does not match (tampering detected).
 */
export function decryptLicenseKey(payload: EncryptedPayload): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    getMasterKey(),
    Buffer.from(payload.iv, 'base64')
  )
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'))

  let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Generates a SHA-256 hash of the normalized key for fast collision and duplicate detection.
 */
export function hashLicenseKey(plaintext: string): string {
  return createHash('sha256').update(plaintext.trim()).digest('hex')
}
