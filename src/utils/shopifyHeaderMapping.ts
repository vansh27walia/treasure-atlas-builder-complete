/**
 * Predefined header mapping from Shopify order fields to internal CSV format.
 * This mapping auto-runs so the user never sees a header mapping UI.
 */

export interface ShopifyOrderRaw {
  order_id: string;
  customer_name: string;
  shipping_address: string;
  total_weight: number;
  line_items: string;
  created_at: string;
  shopify_order_id: string;
  shop?: string;
  // Extended fields from detailed fetch
  shipping_address_obj?: {
    first_name?: string;
    last_name?: string;
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    province_code?: string;
    zip?: string;
    country?: string;
    country_code?: string;
    phone?: string;
    company?: string;
  };
  email?: string;
  phone?: string;
}

export interface MappedShipmentRow {
  to_name: string;
  to_company: string;
  to_street1: string;
  to_street2: string;
  to_city: string;
  to_state: string;
  to_zip: string;
  to_country: string;
  to_phone: string;
  to_email: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  reference: string;
}

/**
 * Parse the flat shipping_address string back into components.
 * Format: "123 Main St, Los Angeles, CA 90210"
 */
const parseAddressString = (address: string): { street1: string; city: string; state: string; zip: string } => {
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].trim().split(/\s+/);
    const zip = stateZip.pop() || '';
    const state = stateZip.join(' ') || '';
    return {
      street1: parts[0] || '',
      city: parts[1] || '',
      state,
      zip,
    };
  }
  return { street1: address, city: '', state: '', zip: '' };
};

/**
 * Map a Shopify order to our internal standardized shipment row format.
 * Dimensions default to 0 (user must fill via DimensionModal).
 */
export const mapShopifyOrderToRow = (
  order: ShopifyOrderRaw,
  dimensions?: { length: number; width: number; height: number; weight?: number }
): MappedShipmentRow => {
  const addr = order.shipping_address_obj;
  let street1 = '', street2 = '', city = '', state = '', zip = '', country = 'US', phone = '', company = '';

  if (addr) {
    street1 = addr.address1 || '';
    street2 = addr.address2 || '';
    city = addr.city || '';
    state = addr.province_code || addr.province || '';
    zip = addr.zip || '';
    country = addr.country_code || addr.country || 'US';
    phone = addr.phone || '';
    company = addr.company || '';
  } else {
    // Fallback: parse the flat string
    const parsed = parseAddressString(order.shipping_address || '');
    street1 = parsed.street1;
    city = parsed.city;
    state = parsed.state;
    zip = parsed.zip;
  }

  return {
    to_name: order.customer_name || 'Unknown',
    to_company: company,
    to_street1: street1,
    to_street2: street2,
    to_city: city,
    to_state: state,
    to_zip: zip,
    to_country: country,
    to_phone: phone || order.phone || '',
    to_email: order.email || '',
    weight: dimensions?.weight ?? order.total_weight ?? 0,
    length: dimensions?.length ?? 0,
    width: dimensions?.width ?? 0,
    height: dimensions?.height ?? 0,
    reference: order.order_id || '',
  };
};

/**
 * Convert an array of mapped rows to CSV text (same format as manual upload).
 */
export const rowsToCSV = (rows: MappedShipmentRow[]): string => {
  const headers = 'to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,weight,length,width,height,reference';
  const lines = rows.map(r =>
    [r.to_name, r.to_company, r.to_street1, r.to_street2, r.to_city, r.to_state, r.to_zip, r.to_country, r.to_phone, r.to_email, r.weight, r.length, r.width, r.height, r.reference]
      .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [headers, ...lines].join('\n');
};
