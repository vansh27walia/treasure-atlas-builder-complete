
// Add the GoogleApiKeyResponse type
export interface GoogleApiKeyResponse {
  apiKey: string;
  error?: string;
  message?: string;
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export interface ShippingWorkflowStep {
  id: ShippingStep;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
}

// Add carrier logo and packaging types
export interface CarrierLogo {
  url: string;
  alt: string;
}

export interface CarrierPackage {
  id: string;
  name: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  carrier: string;
  image?: string;
}

// Add bulk upload-related types
export interface BulkShipment {
  id: string;
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  tracking_code?: string;
  label_url?: string;
  trackingCode?: string; // For backward compatibility
  status: 'pending' | 'processing' | 'error' | 'completed';
  error?: string;
  details: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
    carrier_logo?: string;
    carrier_colors?: {
      primary: string;
      secondary: string;
    };
    carrier_formats?: string[];
  };
  availableRates?: Array<{
    id: string;
    carrier: string;
    service: string;
    rate: number;
    delivery_days?: number;
  }>;
  selectedRateId?: string;
  downloadFormats?: string[];
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: BulkShipment[];
  failedShipments: Array<{
    row: number;
    error: string;
    details: string;
  }>;
}

export interface CarrierService {
  id: string;
  name: string;
  carrier: string;
  estimatedDelivery?: string;
  image?: string;
}

export interface CarrierOption {
  id: string;
  name: string;
  logo?: string;
  services: CarrierService[];
  packages?: CarrierPackage[];
}

export const CARRIER_OPTIONS: CarrierOption[] = [
  {
    id: 'usps',
    name: 'USPS',
    logo: '/carriers/usps-logo.png',
    services: [
      { id: 'usps_priority', name: 'Priority', carrier: 'USPS' },
      { id: 'usps_priority_express', name: 'Priority Express', carrier: 'USPS' },
      { id: 'usps_first_class', name: 'First Class', carrier: 'USPS' },
      { id: 'usps_parcel_select', name: 'Parcel Select', carrier: 'USPS' },
    ],
    packages: [
      {
        id: 'flat_rate_envelope',
        name: 'Flat Rate Envelope',
        dimensions: { length: 12.5, width: 9.5, height: 0.5, weight: 1 },
        carrier: 'USPS',
        image: '/packages/usps-flat-rate-envelope.png'
      },
      {
        id: 'small_flat_rate_box',
        name: 'Small Flat Rate Box',
        dimensions: { length: 8.625, width: 5.375, height: 1.625, weight: 4 },
        carrier: 'USPS',
        image: '/packages/usps-small-flat-rate-box.png'
      },
      {
        id: 'medium_flat_rate_box',
        name: 'Medium Flat Rate Box',
        dimensions: { length: 11.0, width: 8.5, height: 5.5, weight: 20 },
        carrier: 'USPS',
        image: '/packages/usps-medium-flat-rate-box.png'
      },
      {
        id: 'large_flat_rate_box',
        name: 'Large Flat Rate Box',
        dimensions: { length: 12.0, width: 12.0, height: 5.5, weight: 70 },
        carrier: 'USPS',
        image: '/packages/usps-large-flat-rate-box.png'
      }
    ]
  },
  {
    id: 'ups',
    name: 'UPS',
    logo: '/carriers/ups-logo.png',
    services: [
      { id: 'ups_ground', name: 'Ground', carrier: 'UPS' },
      { id: 'ups_3_day_select', name: '3-Day Select', carrier: 'UPS' },
      { id: 'ups_2nd_day_air', name: '2nd Day Air', carrier: 'UPS' },
      { id: 'ups_next_day_air', name: 'Next Day Air', carrier: 'UPS' },
    ],
    packages: [
      {
        id: 'small_box',
        name: 'Small Box',
        dimensions: { length: 13, width: 11, height: 2, weight: 30 },
        carrier: 'UPS',
        image: '/packages/ups-small-box.png'
      },
      {
        id: 'medium_box',
        name: 'Medium Box',
        dimensions: { length: 16, width: 13, height: 3, weight: 30 },
        carrier: 'UPS',
        image: '/packages/ups-medium-box.png'
      },
      {
        id: 'large_box',
        name: 'Large Box',
        dimensions: { length: 18, width: 13, height: 3, weight: 30 },
        carrier: 'UPS',
        image: '/packages/ups-large-box.png'
      }
    ]
  },
  {
    id: 'fedex',
    name: 'FedEx',
    logo: '/carriers/fedex-logo.png',
    services: [
      { id: 'fedex_ground', name: 'Ground', carrier: 'FedEx' },
      { id: 'fedex_express_saver', name: 'Express Saver', carrier: 'FedEx' },
      { id: 'fedex_2day', name: '2Day', carrier: 'FedEx' },
      { id: 'fedex_overnight', name: 'Overnight', carrier: 'FedEx' },
    ],
    packages: [
      {
        id: 'small_box',
        name: 'Small Box',
        dimensions: { length: 12.375, width: 10.875, height: 1.5, weight: 20 },
        carrier: 'FedEx',
        image: '/packages/fedex-small-box.png'
      },
      {
        id: 'medium_box',
        name: 'Medium Box',
        dimensions: { length: 13.25, width: 11.5, height: 2.375, weight: 20 },
        carrier: 'FedEx',
        image: '/packages/fedex-medium-box.png'
      },
      {
        id: 'large_box',
        name: 'Large Box',
        dimensions: { length: 17.5, width: 12.375, height: 3, weight: 20 },
        carrier: 'FedEx',
        image: '/packages/fedex-large-box.png'
      }
    ]
  },
  {
    id: 'dhl',
    name: 'DHL',
    logo: '/carriers/dhl-logo.png',
    services: [
      { id: 'dhl_express', name: 'Express', carrier: 'DHL' },
      { id: 'dhl_express_worldwide', name: 'Express Worldwide', carrier: 'DHL' },
      { id: 'dhl_express_economy', name: 'Express Economy', carrier: 'DHL' },
    ],
    packages: [
      {
        id: 'small_box',
        name: 'Small Box',
        dimensions: { length: 12, width: 9, height: 3, weight: 10 },
        carrier: 'DHL',
        image: '/packages/dhl-small-box.png'
      },
      {
        id: 'medium_box',
        name: 'Medium Box',
        dimensions: { length: 14, width: 11, height: 5, weight: 25 },
        carrier: 'DHL',
        image: '/packages/dhl-medium-box.png'
      },
      {
        id: 'large_box',
        name: 'Large Box',
        dimensions: { length: 18, width: 14, height: 8, weight: 40 },
        carrier: 'DHL',
        image: '/packages/dhl-large-box.png'
      }
    ]
  }
];

// Create functions to get carrier info by ID
export const getCarrierById = (id: string): CarrierOption | undefined => {
  return CARRIER_OPTIONS.find(carrier => carrier.id === id.toLowerCase());
};

export const getCarrierByName = (name: string): CarrierOption | undefined => {
  return CARRIER_OPTIONS.find(carrier => carrier.name.toLowerCase() === name.toLowerCase());
};

export const getPackagesByCarrier = (carrierId: string): CarrierPackage[] => {
  const carrier = getCarrierById(carrierId);
  return carrier?.packages || [];
};
