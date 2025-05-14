
export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
}

export interface ShippingOptions {
  cheapest: ShippingOption;
  fastest: ShippingOption;
  recommended: ShippingOption;
  all: ShippingOption[];
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export type ShippingWorkflowStep = {
  id: ShippingStep;
  label: string;
  description: string;
  icon?: React.ReactNode;
};

export interface BulkShipment {
  id: string;
  tracking_code?: string;
  label_url?: string;
  status: 'pending' | 'processing' | 'error' | 'completed';
  row: number;
  recipient: string;
  carrier?: string;
  service?: string;
  rate?: number;
  error?: string;
  availableRates?: ShippingOption[];
  selectedRateId?: string;
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
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
    email?: string;
    carrier_logo?: string;
    carrier_colors?: {
      primary: string;
      secondary: string;
    };
    carrier_formats?: string[];
  };
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  uploadStatus?: 'idle' | 'success' | 'error' | 'editing';
  processedShipments: BulkShipment[];
  failedShipments?: {
    row: number;
    error: string;
    details: string;
  }[];
}

export interface CarrierOption {
  id: string;
  name: string;
  logo: string;
  services: {
    id: string;
    name: string;
    type: string;
  }[];
}

export const CARRIER_OPTIONS: CarrierOption[] = [
  {
    id: 'usps',
    name: 'USPS',
    logo: '/carriers/usps.svg',
    services: [
      { id: 'priority', name: 'Priority', type: 'express' },
      { id: 'first_class', name: 'First Class', type: 'standard' },
      { id: 'ground', name: 'Ground', type: 'economy' },
      { id: 'express', name: 'Express', type: 'overnight' }
    ]
  },
  {
    id: 'ups',
    name: 'UPS',
    logo: '/carriers/ups.svg',
    services: [
      { id: 'ground', name: 'Ground', type: 'economy' },
      { id: '2day', name: '2nd Day Air', type: 'express' },
      { id: 'next_day', name: 'Next Day Air', type: 'overnight' },
      { id: '3day', name: '3-Day Select', type: 'standard' }
    ]
  },
  {
    id: 'fedex',
    name: 'FedEx',
    logo: '/carriers/fedex.svg',
    services: [
      { id: 'ground', name: 'Ground', type: 'economy' },
      { id: 'express', name: 'Express', type: 'express' },
      { id: '2day', name: '2Day', type: 'express' },
      { id: 'overnight', name: 'Overnight', type: 'overnight' }
    ]
  },
  {
    id: 'dhl',
    name: 'DHL',
    logo: '/carriers/dhl.svg',
    services: [
      { id: 'express', name: 'Express', type: 'express' },
      { id: 'express_worldwide', name: 'Express Worldwide', type: 'express' },
      { id: 'express_economy', name: 'Express Economy', type: 'economy' }
    ]
  }
];

export interface GoogleApiKeyResponse {
  apiKey: string | null;
  isValid: boolean;
  error?: string;
}
