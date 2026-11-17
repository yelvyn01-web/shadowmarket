export type ProductCategory = 
  | 'operating-system' 
  | 'developer-tools' 
  | 'productivity' 
  | 'security-vpn' 
  | 'cloud-vouchers' 
  | 'gaming-keys'

export type ProductPlatform = 'Windows' | 'macOS' | 'Multi-Platform' | 'Steam' | 'Cloud'

export interface Product {
  id: string
  slug: string
  title: string
  category: ProductCategory
  categoryLabel: string
  platform: ProductPlatform
  description: string
  shortDescription: string
  features: string[]
  licenseType: string
  fulfillmentType: 'instant' | 'manual'
  deliveryTime: string
  basePrice: number
  salePrice?: number
  stock: number
  imageUrl: string
  publisher: string
  legalAuthorizationBasis: string
  activationGuide: string[]
  sampleKeyFormat: string
  systemRequirements?: {
    os: string
    storage?: string
    additional?: string
  }
}

export interface CartItem {
  product: Product
  quantity: number
}
