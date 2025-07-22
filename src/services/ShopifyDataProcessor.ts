
export interface ShopifyOrder {
  id: number;
  name: string;
  created_at: string;
  email: string;
  total_price: string;
  total_weight: number;
  financial_status: string;
  fulfillment_status: string;
  currency: string;
  line_items: Array<{
    title: string;
    quantity: number;
    grams: number;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2?: string;
    city: string;
    province_code: string;
    country_code: string;
    zip: string;
    phone?: string;
  };
}

export interface ProcessedShipment {
  order_id: string;
  order_name: string;
  to_address: {
    name: string;
    email: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  package: {
    weight_gram: number;
    length: number;
    width: number;
    height: number;
  };
  shipment: {
    declared_value: string;
    currency: string;
  };
}

export class ShopifyDataProcessor {
  static processOrders(orders: ShopifyOrder[]): ProcessedShipment[] {
    return orders.map(order => ({
      order_id: order.id.toString(),
      order_name: order.name,
      to_address: {
        name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim(),
        email: order.email,
        street1: order.shipping_address.address1,
        street2: order.shipping_address.address2,
        city: order.shipping_address.city,
        state: order.shipping_address.province_code,
        zip: order.shipping_address.zip,
        country: order.shipping_address.country_code,
        phone: order.shipping_address.phone
      },
      package: {
        weight_gram: order.total_weight || this.calculateTotalWeight(order.line_items),
        length: 10, // Default dimensions
        width: 8,
        height: 6
      },
      shipment: {
        declared_value: order.total_price,
        currency: order.currency || 'USD'
      }
    }));
  }

  private static calculateTotalWeight(lineItems: Array<{ grams: number; quantity: number }>): number {
    return lineItems.reduce((total, item) => total + (item.grams * item.quantity), 0);
  }

  static async fetchRatesForProcessedShipments(
    shipments: ProcessedShipment[], 
    pickupAddress: any
  ): Promise<any[]> {
    const ratePromises = shipments.map(async (shipment) => {
      try {
        const response = await fetch('/api/get-shipping-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromAddress: pickupAddress,
            toAddress: shipment.to_address,
            parcel: {
              weight: shipment.package.weight_gram / 28.35, // Convert grams to oz
              length: shipment.package.length,
              width: shipment.package.width,
              height: shipment.package.height
            }
          })
        });
        
        const data = await response.json();
        return {
          ...shipment,
          rates: data.rates || [],
          selectedRate: null
        };
      } catch (error) {
        console.error(`Error fetching rates for ${shipment.order_id}:`, error);
        return {
          ...shipment,
          rates: [],
          selectedRate: null,
          error: 'Failed to fetch rates'
        };
      }
    });

    return Promise.all(ratePromises);
  }
}
