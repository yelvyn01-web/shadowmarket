---
name: backend-development
description: >-
  Architect and implement secure backend systems for Next.js App Router and Supabase.
  Covers Server Actions, Route Handlers, Zod schema validation, AES-256-GCM license key encryption,
  transactional integrity, role-based authorization (RBAC), rate limiting, and audit logging.
  Use when building backend logic, API routes, Server Actions, license delivery services, or security guards (ระบบหลังบ้าน, Backend, Server Actions, API, Zod, Encryption).
---

# Backend Development (ระบบหลังบ้านและความปลอดภัยข้อมูล)

Use this skill to build robust, secure, and performant backend services for ShadowMarket using Next.js App Router (Server Actions and Route Handlers) and Supabase.

---

## 1. Backend Architecture Principles

1. **Server Actions First for Mutations**:
   - Use Next.js Server Actions for state-modifying workflows (checkout, license reservation, profile updates, manual procurement actions).
   - Use Route Handlers (`app/api/*`) exclusively for external webhooks (e.g., payment gateway callbacks), public streaming, or scheduled cron jobs.
2. **Never Trust the Client**:
   - Every Server Action and Route Handler must validate caller authentication, authorization roles, and request payloads using strict Zod schemas.
   - Prices, product availability, and license assignments are computed exclusively from database records, never from client parameters.
3. **Defense in Depth**:
   - Combine Supabase Row Level Security (RLS) with backend role checks before executing privileged operations.
   - Use the restricted `supabase/server` client for user-scoped requests and the privileged `service_role` admin client solely in isolated server services for automated fulfillment and encryption.

---

## 2. Server Action Template with Strict Validation

```typescript
'use server'

import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const RedeemLicenseSchema = z.object({
  orderId: z.string().uuid({ message: 'รหัสคำสั่งซื้อไม่ถูกต้อง' }),
})

export type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function redeemLicenseAction(rawInput: unknown): Promise<ActionResponse<{ licenseKey: string }>> {
  // 1. Input Validation
  const parsed = RedeemLicenseSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }
  }

  // 2. Authentication Check
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  // 3. Authorization & Business Logic
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, user_id')
    .eq('id', parsed.data.orderId)
    .single()

  if (orderError || !order) {
    return { success: false, error: 'ไม่พบคำสั่งซื้อ' }
  }

  if (order.user_id !== user.id) {
    return { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้' }
  }

  if (order.status !== 'paid' && order.status !== 'completed') {
    return { success: false, error: 'คำสั่งซื้อยังไม่ได้รับการชำระเงิน' }
  }

  // 4. Retrieve & Decrypt License (Internal service call)
  // ...
  revalidatePath(`/orders/${parsed.data.orderId}`)
  return { success: true, data: { licenseKey: 'XXXX-YYYY-ZZZZ' } }
}
```

---

## 3. AES-256-GCM Digital License Key Encryption Service

Digital product licenses must NEVER be stored in plaintext. Use AES-256-GCM authenticated encryption:

```typescript
// src/lib/crypto/license-crypto.ts
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit recommended for GCM
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

export function encryptLicenseKey(plaintext: string): EncryptedPayload {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getMasterKey(), iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return {
    ciphertext: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  }
}

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
```

---

## 4. Audit Logging & Security Event Recording

Track all sensitive events (license issuance, admin key imports, role changes):

```typescript
// src/lib/services/audit-log.ts
import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction = 
  | 'license.created'
  | 'license.assigned'
  | 'license.viewed'
  | 'order.paid'
  | 'admin.procurement_update'

export async function logAuditEvent(params: {
  action: AuditAction
  actorId?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}) {
  const supabase = createAdminClient()
  await supabase.from('audit_logs').insert({
    action: params.action,
    actor_id: params.actorId ?? null,
    target_id: params.targetId ?? null,
    details: params.details ?? {},
    ip_address: params.ipAddress ?? null,
    created_at: new Date().toISOString(),
  })
}
```

---

## 5. Backend Quality & Security Checklist

- [ ] All inputs validated using Zod schemas with human-readable error messages in Thai.
- [ ] No database mutations rely on client-supplied user IDs or prices.
- [ ] Sensitive digital license keys are encrypted at rest with AES-256-GCM.
- [ ] Role-based authorization (`admin` vs `customer`) enforced on all administrative endpoints.
- [ ] Database updates run within atomic transactions or RPC functions to prevent race conditions.
- [ ] Cryptographic secrets are strictly isolated to server runtime (never prefixed with `NEXT_PUBLIC_`).
- [ ] Audit logs record license generation, viewing, and state changes.

---

## 6. Official Documentation References

- [Next.js Server Actions and Mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Zod TypeScript-First Schema Validation](https://zod.dev/)
- [Node.js Crypto API Documentation](https://nodejs.org/api/crypto.html)
- [Supabase JavaScript Client - Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OWASP Secure Coding Practices Quick Reference](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
