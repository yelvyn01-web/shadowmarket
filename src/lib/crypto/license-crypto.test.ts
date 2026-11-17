import { describe, it, expect } from 'vitest'
import {
  encryptLicenseKey,
  decryptLicenseKey,
  hashLicenseKey,
} from './license-crypto'

describe('License Crypto Engine (AES-256-GCM & SHA-256)', () => {
  const sampleKey = 'W269N-WFGWX-YVC9B-4J6C9-T83GX'

  it('successfully encrypts a plaintext key into ciphertext, iv, and authTag', () => {
    const payload = encryptLicenseKey(sampleKey)

    expect(payload.ciphertext).toBeDefined()
    expect(payload.ciphertext).not.toBe(sampleKey)
    expect(payload.iv).toBeDefined()
    expect(payload.authTag).toBeDefined()

    // 12-byte IV in base64 is 16 chars
    expect(Buffer.from(payload.iv, 'base64').length).toBe(12)
    // 16-byte Auth Tag in base64 is 24 chars
    expect(Buffer.from(payload.authTag, 'base64').length).toBe(16)
  })

  it('correctly decrypts the ciphertext back to the exact original plaintext', () => {
    const payload = encryptLicenseKey(sampleKey)
    const decrypted = decryptLicenseKey(payload)

    expect(decrypted).toBe(sampleKey)
  })

  it('throws an error if ciphertext has been tampered with', () => {
    const payload = encryptLicenseKey(sampleKey)
    const tampered = {
      ...payload,
      ciphertext: Buffer.from('TAMPERED_CIPHERTEXT').toString('base64'),
    }

    expect(() => decryptLicenseKey(tampered)).toThrow()
  })

  it('throws an error if authTag has been tampered with', () => {
    const payload = encryptLicenseKey(sampleKey)
    const tamperedTag = {
      ...payload,
      authTag: Buffer.from('0000000000000000').toString('base64'),
    }

    expect(() => decryptLicenseKey(tamperedTag)).toThrow()
  })

  it('generates consistent SHA-256 hash for duplicate collision detection', () => {
    const hash1 = hashLicenseKey(sampleKey)
    const hash2 = hashLicenseKey('  ' + sampleKey + '  ') // With surrounding whitespace

    expect(hash1).toBe(hash2)
    expect(hash1.length).toBe(64) // SHA-256 hex string length
  })
})
