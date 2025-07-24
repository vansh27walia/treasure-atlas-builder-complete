
// Shopify to EasyPost header mapping utility
export interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  phone?: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
  line_items: Array<{
    title: string;
    quantity: number;
    grams: number;
    price: string;
  }>;
  total_weight: number;
  order_number: string;
}

export interface EasyPostCSVRow {
  to_name: string;
  to_company?: string;
  to_street1: string;
  to_street2?: string;
  to_city: string;
  to_state: string;
  to_zip: string;
  to_country: string;
  to_phone?: string;
  to_email?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  reference: string;
}

export const convertShopifyToEasyPost = (shopifyOrders: ShopifyOrder[]): EasyPostCSVRow[] => {
  return shopifyOrders.map(order => ({
    to_name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
    to_company: order.shipping_address.company || '',
    to_street1: order.shipping_address.address1,
    to_street2: order.shipping_address.address2 || '',
    to_city: order.shipping_address.city,
    to_state: order.shipping_address.province,
    to_zip: order.shipping_address.zip,
    to_country: order.shipping_address.country,
    to_phone: order.shipping_address.phone || order.phone || '',
    to_email: order.email || '',
    weight: order.total_weight ? order.total_weight / 453.592 : 1.0, // Convert grams to pounds
    length: 12, // Default dimensions
    width: 8,
    height: 4,
    reference: order.order_number || order.name
  }));
};

export const generateEasyPostCSV = (data: EasyPostCSVRow[]): string => {
  const headers = [
    'to_name', 'to_company', 'to_street1', 'to_street2', 'to_city', 
    'to_state', 'to_zip', 'to_country', 'to_phone', 'to_email',
    'weight', 'length', 'width', 'height', 'reference'
  ];
  
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header as keyof EasyPostCSVRow] || '';
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};
