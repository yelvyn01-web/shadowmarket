---
name: ecommerce-architecture
description: >-
  Architect end-to-end e-commerce domain models, product catalogs, shopping cart logic,
  inventory management, and order fulfillment workflows. Covers SKU & variant management,
  inventory race conditions, cart persistence, checkout pipelines, and order state machines.
  Use when building e-commerce features (ระบบสินค้าและคำสั่งซื้อ, E-commerce, ตะกร้าสินค้า, ระบบสั่งซื้อ, จัดการสต็อก, Cart, Order, Inventory, Checkout).
---

# E-Commerce Architecture (ระบบสินค้าและคำสั่งซื้อ)

Use this skill to design and implement robust e-commerce domain architectures, product catalog structures, inventory concurrency controls, shopping cart synchronizations, and order processing pipelines for ShadowMarket.

---

## 1. Domain Modeling: Digital Products & Licenses

For digital licenses, products are modeled with instant auto-delivery or manual fulfillment options:

```text
Product (Parent Catalog Item)
  ├── id, title, slug, description, category_id, platform, base_price, sale_price
  ├── fulfillment_type: 'instant' | 'manual'
  └── License Inventory Units (license_keys table)
        ├── id, product_id, ciphertext, iv, auth_tag, key_hash, status
        └── status: 'available' | 'reserved' | 'assigned' | 'redeemed' | 'revoked'
```

---

## 2. Preventing Concurrency Overselling

When multiple users attempt to checkout the last available key, use atomic row-level locking:

```sql
-- Atomic stock deduction function
CREATE OR REPLACE FUNCTION public.deduct_inventory(p_variant_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_stock INT;
BEGIN
  -- Lock row for update
  SELECT stock_quantity INTO v_available_stock
  FROM public.products
  WHERE id = p_variant_id
  FOR UPDATE;

  IF v_available_stock < p_quantity THEN
    RETURN FALSE; -- Insufficient inventory
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Order Lifecycle Management

| Status | Trigger | Inventory Impact | Customer View |
| :--- | :--- | :--- | :--- |
| **`pending`** | Order created at checkout | Key reserved (15-min hold) | "รอการชำระเงิน" (Awaiting payment) |
| **`processing_fulfillment`** | Payment verified (manual item) | Waiting for admin fulfillment | "กำลังดำเนินการจัดส่งคีย์" (Fulfilling) |
| **`paid` / `completed`** | Gateway webhook confirmation | Key assigned permanently | "ชำระเงินสำเร็จ / แสดงคีย์" (Completed) |
| **`cancelled`** | Payment expired / user cancel | Key released back to `available` | "ยกเลิกคำสั่งซื้อ" (Cancelled) |
| **`refunded`** | Admin issued refund | Key marked as `revoked` | "คืนเงินแล้ว" (Refunded) |

---

## 4. E-Commerce Architecture Checklist

- [ ] Product prices are always re-fetched from database at checkout time (client prices ignored).
- [ ] Concurrency control prevents overselling during high-traffic checkout spikes.
- [ ] Order records store historical snapshots of product title and unit price.
- [ ] Auto-expiration releases reserved keys if payment is not completed within 15 minutes.
- [ ] Admin dashboard provides visibility into pending procurement and inventory levels.

---

## 5. Official Documentation References

- [PostgreSQL Transaction Isolation and Explicit Locking](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Martin Fowler - Enterprise Application Architecture (Patterns of E-Commerce)](https://martinfowler.com/eaaCatalog/)
- [Stripe E-Commerce Lifecycle Guide](https://stripe.com/docs/orders-guide)
- [Supabase Database Design Best Practices](https://supabase.com/docs/guides/database/tables-and-data)
