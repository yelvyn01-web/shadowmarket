import { createClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'
import { MOCK_PRODUCTS } from '@/data/mockProducts'
import { Product } from '@/types/product'

export async function getProductsFromDB(): Promise<Product[]> {
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error || !data || data.length === 0) {
      return MOCK_PRODUCTS
    }

    return data.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.category_id || 'operating-system',
      categoryLabel: item.platform || 'ซอฟต์แวร์ลิขสิทธิ์',
      platform: item.platform as any,
      description: item.description,
      shortDescription: item.description.slice(0, 120) + '...',
      features: [
        'ลิขสิทธิ์แท้ 100% เชื่อมต่อและเปิดใช้งานได้ถาวร',
        'ส่งมอบด้วยระบบเข้ารหัสความปลอดภัย AES-256-GCM',
        'รับประกันการใช้งานจริง พร้อมทีมสนับสนุนตลอด 24 ชม.',
      ],
      licenseType: item.platform + ' Authorized License',
      fulfillmentType: item.fulfillment_type as any,
      deliveryTime: item.fulfillment_type === 'instant' ? 'ส่งมอบทันทีอัตโนมัติ' : 'จัดส่งภายใน 1-2 ชม.',
      basePrice: Number(item.base_price),
      salePrice: item.sale_price ? Number(item.sale_price) : undefined,
      stock: item.stock_quantity,
      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
      publisher: item.publisher,
      legalAuthorizationBasis: item.legal_resale_authorization,
      activationGuide: [
        'เข้าสู่หน้าเปิดใช้งานของโปรแกรม',
        'กรอกรหัสคีย์ลิขสิทธิ์ที่ได้รับจาก ShadowMarket',
        'กดยืนยันเพื่อเปิดใช้งานสิทธิ์ถาวร',
      ],
      sampleKeyFormat: item.sample_key_format || 'XXXXX-XXXXX-XXXXX-XXXXX',
    }))
  } catch {
    return MOCK_PRODUCTS
  }
}

export async function getProductBySlugFromDB(slug: string): Promise<Product | null> {
  const all = await getProductsFromDB()
  const found = all.find((p) => p.slug === slug)
  if (found) return found
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null
}
