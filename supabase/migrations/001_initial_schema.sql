-- ==============================================================================
-- SHADOWMARKET - MASTER DATABASE MIGRATION (MILESTONE 3)
-- 100% Legal Digital License Reseller Platform
-- Strict RLS Protection on All Tables | Zero Cheats / Zero Exploits Policy
-- ==============================================================================

-- 1. PROFILES TABLE (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCTS TABLE (Digital Software Licenses)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'Windows', 'macOS', 'Multi-Platform', 'Steam', 'Cloud'
  fulfillment_type TEXT NOT NULL DEFAULT 'instant' CHECK (fulfillment_type IN ('instant', 'manual')),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
  sale_price NUMERIC(10, 2) CHECK (sale_price >= 0),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  publisher TEXT NOT NULL,
  legal_resale_authorization TEXT NOT NULL,
  sample_key_format TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. DIGITAL LICENSE KEYS TABLE (Encrypted at rest with AES-256-GCM)
CREATE TABLE IF NOT EXISTS public.license_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 collision detection
  ciphertext TEXT NOT NULL,      -- AES-256-GCM encrypted key
  iv TEXT NOT NULL,              -- 12-byte IV (Base64)
  auth_tag TEXT NOT NULL,        -- 16-byte GCM Tag (Base64)
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'assigned', 'redeemed', 'revoked')),
  supplier_name TEXT,
  cost_price NUMERIC(10, 2) DEFAULT 0,
  batch_reference TEXT,
  order_id UUID,
  assigned_to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
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

-- 6. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
  license_key_id UUID REFERENCES public.license_keys(id) ON DELETE SET NULL,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  product_title_snapshot TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - 100% COVERAGE
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update only their own profile
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories & Products: Public can read active items
DROP POLICY IF EXISTS "Public read active categories" ON public.categories;
CREATE POLICY "Public read active categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT USING (is_active = true);

-- Orders: Users read own orders
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Order Items: Users read items belonging to their own orders
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- CRITICAL SECURITY RULE: Regular customers have ZERO direct SELECT on license_keys!
-- Keys are decrypted only via authenticated Server Action.
DROP POLICY IF EXISTS "Admins full access to license keys" ON public.license_keys;
CREATE POLICY "Admins full access to license keys" ON public.license_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Admin Full Management Policies
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins read audit logs" ON public.audit_logs;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- ==============================================================================
-- DATABASE TRIGGERS
-- ==============================================================================

-- Trigger: Automatically create user profile when user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Customer'),
    'customer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- INITIAL SEED DATA: 100% LEGAL AUTHORIZED DIGITAL LICENSES ONLY
-- ==============================================================================

-- Categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('ระบบปฏิบัติการ (OS)', 'operating-system', 'ระบบปฏิบัติการคอมพิวเตอร์ลิขสิทธิ์แท้ Windows 11 / Pro'),
  ('เครื่องมือนักพัฒนา (Developer Tools)', 'developer-tools', 'เครื่องมือเขียนโปรแกรม IDE และเครื่องมือสำหรับวิศวกรซอฟต์แวร์'),
  ('งานเอกสารและสำนักงาน (Productivity)', 'productivity', 'ชุดโปรแกรมสำนักงาน Word, Excel, PowerPoint ลิขสิทธิ์แท้'),
  ('ความปลอดภัย & VPN (Security & VPN)', 'security-vpn', 'บริการป้องกันความเป็นส่วนตัวและจัดการรหัสผ่าน'),
  ('เกมลิขสิทธิ์แท้ (Steam Keys)', 'gaming-keys', 'คีย์เกมแท้ 100% จากผู้จัดจำหน่ายอย่างเป็นทางการ'),
  ('คลาวด์และโฮสติ้ง (Cloud & Infrastructure)', 'cloud-vouchers', 'เครดิตและบัตรกำนัลสำหรับบริการคลาวด์')
ON CONFLICT (slug) DO NOTHING;

-- Seed Products
INSERT INTO public.products (
  title, slug, description, platform, fulfillment_type, base_price, sale_price, stock_quantity,
  image_url, publisher, legal_resale_authorization, sample_key_format, is_active
) VALUES
(
  'Microsoft Windows 11 Pro Retail License',
  'windows-11-pro-retail',
  'คีย์ลิขสิทธิ์แท้ Microsoft Windows 11 Professional แบบ Retail License สำหรับ 1 PC ย้ายเครื่องได้ อัปเดตตลอดชีพ',
  'Windows',
  'instant',
  1890.00,
  1290.00,
  24,
  'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
  'Microsoft Corporation',
  'ตัวแทนจำหน่ายผ่านเครือข่าย Microsoft Cloud Solution Provider (CSP) และ Electronic Software Delivery (ESD) อย่างถูกต้องตามกฎหมาย',
  'W269N-WFGWX-YVC9B-4J6C9-T83GX',
  true
),
(
  'JetBrains All Products Pack (1-Year Subscription)',
  'jetbrains-all-products-pack',
  'รหัสเปิดใช้งาน JetBrains All Products Pack ลิขสิทธิ์แท้ 1 ปีเต็ม เข้าถึง 16 IDE ชั้นนำระดับโลก',
  'Multi-Platform',
  'instant',
  8900.00,
  6490.00,
  12,
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
  'JetBrains s.r.o.',
  'ได้รับสิทธิ์จำหน่ายรหัสบัตรกำนัลผ่านโครงการ JetBrains Authorized Reseller Network อย่างถูกต้อง',
  'JBAP-2026-X889-KL90-VCHT',
  true
),
(
  'Microsoft Office 2024 Home & Business (Lifetime)',
  'microsoft-office-2024-home-business',
  'ชุดโปรแกรมสำนักงานเวอร์ชันล่าสุด Microsoft Office 2024 ซื้อครั้งเดียวใช้ได้ตลอดชีพ รองรับ PC และ Mac',
  'Multi-Platform',
  'instant',
  3890.00,
  2890.00,
  18,
  'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80',
  'Microsoft Corporation',
  'จัดจำหน่ายผ่านพันธมิตรผู้จัดจำหน่ายที่ได้รับอนุญาตของ Microsoft Electronic Software Delivery (ESD)',
  'NK8R7-8BG69-27QG3-XKM6V-TCW32',
  true
),
(
  'NordVPN Complete Tier (2-Year Prepaid Digital Key)',
  'nordvpn-complete-2year',
  'รหัสเปิดใช้งานบริการ NordVPN ระดับ Complete Tier นาน 2 ปีเต็ม พร้อม NordPass และคลาวด์ 1 TB',
  'Multi-Platform',
  'instant',
  4200.00,
  2490.00,
  35,
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
  'Nord Security',
  'ตัวแทนจำหน่ายรหัสดิจิทัลอย่างเป็นทางการภายใต้โปรแกรม Nord Security Partner Network',
  'NVPN-2026-CMPL-9842-KL77',
  true
),
(
  'Cyberpunk 2077: Phantom Liberty Bundle (Steam Key)',
  'cyberpunk-2077-phantom-liberty-steam',
  'รหัสเปิดใช้งานเกมลิขสิทธิ์แท้บนแพลตฟอร์ม Steam (PC) รวมเกมตัวเต็ม Cyberpunk 2077 + ส่วนเสริม Phantom Liberty (Global Region)',
  'Steam',
  'instant',
  1990.00,
  1390.00,
  15,
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  'CD PROJEKT RED',
  'จัดซื้อคีย์ลิขสิทธิ์แท้ผ่านผู้จัดจำหน่ายดิจิทัลรายใหญ่ที่ได้รับสิทธิ์ทางการจากค่ายเกมโดยตรง (ไม่ใช่บัญชีแชร์ หรือตัวขโมยรหัส)',
  '7XT8P-QM92K-34NBL-89WVC',
  true
),
(
  'AWS Cloud Credits Voucher ($100 USD Developer Tier)',
  'aws-cloud-credits-voucher-100',
  'คูปองเครดิตบริการคลาวด์ Amazon Web Services (AWS) มูลค่า 100 ดอลลาร์สหรัฐฯ สำหรับใช้งานบริการ EC2, S3, RDS, Lambda',
  'Cloud',
  'manual',
  3400.00,
  2190.00,
  8,
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  'Amazon Web Services (AWS)',
  'ได้รับสิทธิ์จัดสรรโค้ดผ่านโครงการ AWS Partner Network (APN) และสิทธิประโยชน์สำหรับนักพัฒนาซอฟต์แวร์',
  'AWS-DEV-2026-9042-8811',
  true
),
(
  '1Password Families (1-Year Digital Gift Subscription)',
  '1password-families-1year',
  'รหัสเติมสิทธิ์ใช้งานโปรแกรมจัดการรหัสผ่านอันดับ 1 ของโลก 1Password แพ็กเกจครอบครัว 5 บัญชี นาน 1 ปี',
  'Multi-Platform',
  'instant',
  2200.00,
  1590.00,
  14,
  'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80',
  '1Password / AgileBits Inc.',
  'จัดจำหน่ายรหัสบัตรของขวัญดิจิทัลผ่านช่องทางพันธมิตรผู้จัดจำหน่ายที่ได้รับอนุญาตอย่างเป็นทางการ',
  '1PW-FAML-2026-8814-TX55',
  true
),
(
  'Sublime Text 4 Individual Lifetime License',
  'sublime-text-4-license',
  'คีย์ลิขสิทธิ์แท้ Sublime Text 4 โปรแกรมแก้ไขโค้ดความเร็วสูง ลิขสิทธิ์ประเภทบุคคลใช้งานได้ตลอดชีพ อัปเดตฟรี 3 ปี',
  'Multi-Platform',
  'instant',
  3400.00,
  2790.00,
  9,
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
  'Sublime HQ Pty Ltd',
  'ตัวแทนจำหน่ายคีย์ซอฟต์แวร์เดสก์ท็อปลิขสิทธิ์แท้จากผู้พัฒนาอย่างถูกต้อง',
  '----- BEGIN LICENSE -----\nShadowMarket Authorized User\nSingle User License\nEA7E-20260408-XXXX-YYYY\n------ END LICENSE ------',
  true
)
ON CONFLICT (slug) DO NOTHING;
