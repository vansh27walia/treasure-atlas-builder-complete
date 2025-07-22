
import { ShopifyOrder } from '../types/shopify';

export interface EasyPostData {
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
  reference?: string;
}

export class ShopifyOrderTransformer {
  /**
   * Transform Shopify order data into EasyPost-compatible format
   */
  static transformToEasyPost(shopifyOrder: ShopifyOrder): EasyPostData {
    const shippingAddress = shopifyOrder.shipping_address;
    
    // Calculate total weight from line items (convert grams to pounds)
    const totalWeightGrams = shopifyOrder.line_items.reduce((total, item) => {
      return total + (item.grams || 0) * item.quantity;
    }, 0);
    const weightInPounds = totalWeightGrams / 453.592; // Convert grams to pounds
    
    // Build full name
    const fullName = `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim();
    
    // Default package dimensions if not provided
    const defaultDimensions = {
      length: 12,
      width: 8,
      height: 4
    };
    
    return {
      to_name: fullName || 'Unknown Customer',
      to_company: shippingAddress.company || '',
      to_street1: shippingAddress.address1 || '',
      to_street2: shippingAddress.address2 || '',
      to_city: shippingAddress.city || '',
      to_state: shippingAddress.province_code || shippingAddress.province || '',
      to_zip: shippingAddress.zip || '',
      to_country: shippingAddress.country_code || 'US',
      to_phone: shippingAddress.phone || '',
      to_email: shopifyOrder.email || '',
      weight: Math.max(weightInPounds, 0.1), // Minimum weight of 0.1 lbs
      length: defaultDimensions.length,
      width: defaultDimensions.width,
      height: defaultDimensions.height,
      reference: shopifyOrder.name || `Order ${shopifyOrder.id}`
    };
  }
  
  /**
   * Transform multiple Shopify orders into CSV format for bulk processing
   */
  static transformToCSV(shopifyOrders: ShopifyOrder[]): string {
    const headers = [
      'to_name',
      'to_company', 
      'to_street1',
      'to_street2',
      'to_city',
      'to_state',
      'to_zip',
      'to_country',
      'to_phone',
      'to_email',
      'weight',
      'length',
      'width',
      'height',
      'reference'
    ];
    
    const csvRows = [headers.join(',')];
    
    shopifyOrders.forEach(order => {
      const easyPostData = this.transformToEasyPost(order);
      const row = headers.map(header => {
        const value = easyPostData[header as keyof EasyPostData] || '';
        // Escape commas and quotes in CSV values
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }
}
