---
name: supabase-development
description: >-
  Design and manage PostgreSQL databases, user authentication, and storage using Supabase.
  Covers relational schema design, Row Level Security (RLS) policies, Supabase Auth (email, social login),
  Database Functions & Triggers, Storage buckets, Realtime, and TypeScript client configuration.
  Use when working on database, authentication, or backend logic with Supabase (ฐานข้อมูลและสมาชิก, Supabase, PostgreSQL, RLS, Auth, Database Schema, Storage, Migrations).
---

# Supabase Development (ฐานข้อมูล การจัดการสมาชิก และสิทธิ์ความปลอดภัย)

Use this skill to design PostgreSQL schemas, enforce strict Row Level Security (RLS), implement authentication workflows, and build transactional database functions for ShadowMarket.

---

## 1. Relational Database Schema for Digital Licenses

```sql
-- 1. Profiles Table (Extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Categories
CREATE TABLE public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Products (Digital Licenses)
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'Windows', 'Steam', 'Mac', 'Cloud'
  fulfillment_type TEXT NOT NULL DEFAULT 'instant' CHECK (fulfillment_type IN ('instant', 'manual')),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  sale_price NUMERIC(10, 2) CHECK (sale_price >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  legal_resale_authorization TEXT, -- Documentation or publisher license notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Digital License Keys (Encrypted at rest)
CREATE TABLE public.license_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash to prevent duplicate entries
  ciphertext TEXT NOT NULL,      -- AES-256-GCM encrypted key
  iv TEXT NOT NULL,              -- Initialization Vector (Base64)
  auth_tag TEXT NOT NULL,        -- GCM Authentication Tag (Base64)
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'assigned', 'redeemed', 'revoked')),
  supplier_name TEXT,
  cost_price NUMERIC(10, 2) DEFAULT 0,
  batch_reference TEXT,
  order_id UUID,                 -- Associated order once reserved/assigned
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Orders
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing_fulfillment', 'paid', 'completed', 'cancelled', 'refunded')),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT,
  payment_intent_id TEXT,
  customer_email TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Order Items
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  license_key_id UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  product_title_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Audit Logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 2. Row Level Security (RLS) Policies

Enable RLS on all tables:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories & Products (Public can read active)
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);

-- Orders: Users read own orders
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Order Items: Users read items of own orders
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- License Keys: Customers NEVER query license_keys table directly!
-- Keys are decrypted strictly via authenticated Server Action with verification.
-- Admin role gets full management policy:
CREATE POLICY "Admins have full access to license keys" ON public.license_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Admin general access to products, orders, and audit logs
CREATE POLICY "Admins full access products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins full access orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins full access audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
```

---

## 3. Automatic Profile Creation Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 4. Supabase Quality Checklist

- [ ] RLS enabled on 100% of tables in `public` schema.
- [ ] Customers have zero direct SELECT access to the `license_keys` table.
- [ ] Monetary columns use `NUMERIC(10, 2)` to eliminate floating-point rounding errors.
- [ ] Triggers and Database Functions specify `SET search_path = public` for security hardening.
- [ ] Historical snapshots of product title and unit price saved in `order_items`.

---

## 5. Official Documentation References

- [Supabase Row Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Auth with Next.js App Router](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [PostgreSQL Database Functions and Triggers](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [PostgreSQL NUMERIC Data Type Specification](https://www.postgresql.org/docs/current/datatype-numeric.html)
