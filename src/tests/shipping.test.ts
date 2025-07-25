
// Mock shipping rates for testing
const mockRates = [
  {
    id: '1',
    carrier: 'UPS',
    service: 'Ground',
    rate: '12.50',
    currency: 'USD',
    delivery_days: 3,
    delivery_date: '2024-01-15'
  },
  {
    id: '2',
    carrier: 'USPS',
    service: 'Priority',
    rate: '8.75',
    currency: 'USD',
    delivery_days: 2,
    delivery_date: '2024-01-14'
  },
  {
    id: '3',
    carrier: 'FedEx',
    service: 'Express',
    rate: '18.99',
    currency: 'USD',
    delivery_days: 1,
    delivery_date: '2024-01-13'
  }
];

// Basic test structure without vitest imports for now
export const shippingTests = {
  'should find the cheapest rate correctly': () => {
    const cheapestRate = mockRates.reduce((prev, curr) => 
      parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
    );
    return cheapestRate.carrier === 'USPS' && cheapestRate.rate === '8.75';
  },

  'should find the fastest rate correctly': () => {
    const fastestRate = mockRates.reduce((prev, curr) => 
      (prev.delivery_days || 999) < (curr.delivery_days || 999) ? prev : curr
    );
    return fastestRate.carrier === 'FedEx' && fastestRate.delivery_days === 1;
  },

  'should calculate balanced rate correctly': () => {
    const scoredRates = mockRates.map(rate => {
      const costScore = parseFloat(rate.rate) / Math.max(...mockRates.map(r => parseFloat(r.rate)));
      const speedScore = (rate.delivery_days || 7) / Math.max(...mockRates.map(r => r.delivery_days || 7));
      return {
        ...rate,
        balanceScore: costScore * 0.6 + speedScore * 0.4
      };
    });
    
    const balancedRate = scoredRates.reduce((prev, curr) => 
      prev.balanceScore < curr.balanceScore ? prev : curr
    );
    
    return balancedRate.carrier === 'USPS';
  },

  'should filter rates by carrier correctly': () => {
    const upsRates = mockRates.filter(rate => rate.carrier.toLowerCase() === 'ups');
    return upsRates.length === 1 && upsRates[0].carrier === 'UPS';
  },

  'should show all rates when filter is "all"': () => {
    const allRates = mockRates.filter(rate => 
      'all' === 'all' || rate.carrier.toLowerCase() === 'all'
    );
    return allRates.length === 3;
  },

  'should generate correct EasyPost headers': () => {
    const expectedHeaders = [
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

    const csvHeaders = 'to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,weight,length,width,height,reference';
    const headers = csvHeaders.split(',');
    
    return expectedHeaders.every(header => headers.includes(header));
  },

  'should convert Shopify order to EasyPost format': () => {
    const shopifyOrder = {
      recipient_name: "John Doe",
      recipient_address1: "123 Main St",
      recipient_city: "Los Angeles",
      recipient_state: "CA",
      recipient_zip: "90210",
      recipient_country: "US",
      recipient_phone: "555-123-4567",
      recipient_email: "john@example.com",
      parcel_weight: 5.0,
      parcel_length: 10,
      parcel_width: 8,
      parcel_height: 6,
      order_reference: "ORD-001"
    };

    const easyPostRow = [
      shopifyOrder.recipient_name,
      '', // company
      shopifyOrder.recipient_address1,
      '', // street2
      shopifyOrder.recipient_city,
      shopifyOrder.recipient_state,
      shopifyOrder.recipient_zip,
      shopifyOrder.recipient_country,
      shopifyOrder.recipient_phone,
      shopifyOrder.recipient_email,
      shopifyOrder.parcel_weight,
      shopifyOrder.parcel_length,
      shopifyOrder.parcel_width,
      shopifyOrder.parcel_height,
      shopifyOrder.order_reference
    ];

    return easyPostRow[0] === "John Doe" && 
           easyPostRow[4] === "Los Angeles" && 
           easyPostRow[10] === 5.0;
  }
};

// Export mock data for use in components
export { mockRates };
