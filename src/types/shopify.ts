
export interface ShopifyOrder {
  id: number;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  currency: string;
  total_weight: number;
  financial_status: string;
  fulfillment_status: string;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress;
  billing_address?: ShopifyAddress;
  customer?: ShopifyCustomer;
}

export interface ShopifyLineItem {
  id: number;
  title: string;
  quantity: number;
  price: string;
  grams?: number;
  sku?: string;
  product_id?: number;
  variant_id?: number;
}

export interface ShopifyAddress {
  first_name?: string;
  last_name?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  province_code?: string;
  country?: string;
  country_code?: string;
  zip?: string;
  phone?: string;
}

export interface ShopifyCustomer {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}
