---
name: procurement
description: >-
  Manage legal digital product license procurement, batch key ingestion, encryption at rest,
  inventory allocation (FIFO), manual fulfillment queues, and reseller compliance.
  Strictly prohibits unauthorized game cheats, hacking tools, and anti-cheat bypasses.
  Use when handling license inventory, batch key imports, supplier records, manual fulfillment, or resale compliance (จัดซื้อและจัดการคลังคีย์ลิขสิทธิ์, License Procurement, Key Management, Stock, Batch Import).
---

# License Procurement & Inventory Management (การจัดซื้อและจัดการคลังลิขสิทธิ์ดิจิทัล)

Use this skill to manage legally authorized digital product licenses, automate batch key ingestion with cryptographic protection, operate manual fulfillment queues, and enforce reseller compliance policies.

---

## 1. Legal Compliance & Anti-Piracy Policy

**Absolute Policy Enforcement**:
- ShadowMarket **ONLY** sells and resells digital product licenses, software activation keys, developer tools, cloud credits, and digital game keys obtained through legally authorized channels (official distributors, partner publisher programs, bulk enterprise license resales).
- **STRICT PROHIBITION**:
  - NO game cheats, memory injection tools, aimbots, wallhacks, or anti-cheat bypasses (e.g., Vanguard/EasyAntiCheat/BattlEye bypasses).
  - NO cracked software, illicit keygens, hijacked accounts, or stolen payment card products.
  - Every product listing must record publisher attribution, license type (OEM, Retail, Volume, Subscription), and legal resale authorization basis.

---

## 2. Digital License State Machine & Lifecycle

Every digital license unit is tracked as an individual atomic entity:

```text
[Bulk Import / Supplier Purchase]
                ↓
           [Available] (Encrypted at rest with AES-256-GCM)
                ↓
    (Order Checkout - Temporary Reservation)
                ↓
           [Reserved] ──(Payment Failed/Timeout)──> [Available]
                ↓
     (Payment Verified via Webhook)
                ↓
           [Assigned] (Mapped to order_item_id and user_id)
                ↓
     (Customer Views / Copies Key)
                ↓
           [Redeemed]
                ↓
     (Refund / Disputed Key)
                ↓
           [Revoked] (Marked invalid, never re-issued)
```

---

## 3. Batch Key Ingestion & Validation

When the owner imports a batch of license keys (via CSV or secure admin form):

1. **Validation & De-duplication**:
   - Sanitize whitespaces and special characters.
   - Verify format (e.g., `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` for standard 25-char alphanumeric product keys).
   - Check against cryptographic hash (SHA-256) of existing keys in database to prevent accidental duplicate key imports.
2. **Encryption before Persistence**:
   - Compute `key_hash = SHA256(plaintext_key)` (used strictly for collision detection).
   - Compute `encrypted_key = AES_256_GCM_Encrypt(plaintext_key)`.
   - Store `encrypted_key`, `iv`, `auth_tag`, `product_id`, `supplier_id`, `cost_price`, `status: 'available'`.
   - Never log or store the plaintext key!

```typescript
// Example: Ingesting a key securely
import { createHash } from 'node:crypto'
import { encryptLicenseKey } from '@/lib/crypto/license-crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function ingestLicenseKey(params: {
  productId: string
  plaintextKey: string
  costPrice: number
  supplierName: string
  batchReference?: string
}) {
  const supabase = createAdminClient()
  const keyHash = createHash('sha256').update(params.plaintextKey.trim()).digest('hex')

  // 1. Check for duplicates
  const { data: existing } = await supabase
    .from('license_keys')
    .select('id')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (existing) {
    throw new Error('คีย์นี้มีอยู่ในระบบแล้ว (Duplicate key detected)')
  }

  // 2. Encrypt
  const encrypted = encryptLicenseKey(params.plaintextKey.trim())

  // 3. Insert record
  const { data, error } = await supabase
    .from('license_keys')
    .insert({
      product_id: params.productId,
      key_hash: keyHash,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      auth_tag: encrypted.authTag,
      cost_price: params.costPrice,
      supplier_name: params.supplierName,
      batch_reference: params.batchReference,
      status: 'available',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
```

---

## 4. Manual Procurement & On-Demand Fulfillment Queue

For specialized software licenses or high-value items where keys are acquired on-demand:

1. **Queue Trigger**:
   - Product configuration flag: `fulfillment_type: 'manual'` (vs `'instant_automated'`).
   - Customer places order and payment is verified.
   - Order status moves to `processing_fulfillment`.
2. **Admin Procurement Dashboard**:
   - Admin view displays pending on-demand orders: Product name, customer order ID, timestamp, expected delivery window (e.g. within 2 hours).
   - Admin acquires the legitimate license from authorized supplier/distributor.
   - Admin pastes the key into the secure fulfillment modal.
   - The key is validated, encrypted, attached to the order item, and the order is marked `completed`.
   - Customer receives automated notification and can reveal the key in their purchase history.

---

## 5. Inventory Concurrency & FIFO Assignment

When a customer checks out an automated digital product:

```sql
-- Atomic FIFO key reservation function
CREATE OR REPLACE FUNCTION public.reserve_license_key(p_product_id UUID, p_order_id UUID, p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_key_id UUID;
BEGIN
  -- Select oldest available key and lock it
  SELECT id INTO v_key_id
  FROM public.license_keys
  WHERE product_id = p_product_id AND status = 'available'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_key_id IS NULL THEN
    RETURN NULL; -- Out of stock
  END IF;

  -- Mark key as reserved
  UPDATE public.license_keys
  SET status = 'reserved',
      reserved_at = NOW(),
      order_id = p_order_id,
      assigned_to_user_id = p_user_id
  WHERE id = v_key_id;

  RETURN v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. Procurement & License Checklist

- [ ] Every product complies strictly with legal resale authorization policies (no game cheats or bypasses).
- [ ] License keys are NEVER stored in plaintext in the database or system logs.
- [ ] SHA-256 hash checks prevent duplicate key imports across batches.
- [ ] FIFO allocation ensures oldest stock is assigned first.
- [ ] Automated stock alerts trigger when available keys fall below minimum thresholds.
- [ ] Manual procurement orders provide clear SLA indicators (e.g., "จัดส่งภายใน 1-2 ชั่วโมง").
- [ ] Revoked or refunded keys are permanently flagged and locked against re-assignment.

---

## 7. Official Documentation References

- [PostgreSQL Explicit Locking (`FOR UPDATE SKIP LOCKED`)](https://www.postgresql.org/docs/current/explicit-locking.html)
- [NIST Special Publication 800-57: Recommendation for Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [Web Cryptography API (W3C Standard)](https://www.w3.org/TR/WebCryptoAPI/)
- [Supabase Row Level Security & Database Functions](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Software & Information Industry Association (SIIA) Anti-Piracy Guidelines](https://www.siia.net/)
