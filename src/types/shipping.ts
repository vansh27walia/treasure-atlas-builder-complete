
export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days?: number;
  est_delivery_days?: number;
  delivery_date?: string;
  shipmentId?: string;
  listRate?: string;
  retailRate?: string;
  isPremium?: boolean;
  estimated_delivery_date?: string;
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export interface ShippingWorkflowStep {
  id: ShippingStep;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
}

export interface ShippingAddress {
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
}

export interface ShippingParcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  predefined_package?: string;
}

// Bulk shipping related types
export interface BulkShipment {
  id: string;
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  tracking_code?: string;
  trackingCode?: string;
  label_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  details: ShippingAddress & {
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
  };
  availableRates?: ShippingOption[];
  selectedRateId?: string;
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: BulkShipment[];
  failedShipments: any[];
  uploadStatus?: 'idle' | 'success' | 'error' | 'editing';
}

// Carrier options for dropdown selection
export const CARRIER_OPTIONS = [
  {
    id: 'usps',
    name: 'USPS',
    services: [
      { id: 'priority', name: 'Priority' },
      { id: 'first_class', name: 'First Class' },
      { id: 'express', name: 'Priority Express' }
    ]
  },
  {
    id: 'ups',
    name: 'UPS',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: '3day', name: '3-Day Select' },
      { id: '2day', name: '2nd Day Air' },
      { id: 'next_day', name: 'Next Day Air' }
    ]
  },
  {
    id: 'fedex',
    name: 'FedEx',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: 'express_saver', name: 'Express Saver' },
      { id: '2day', name: '2Day' },
      { id: 'overnight', name: 'Overnight' }
    ]
  },
  {
    id: 'dhl',
    name: 'DHL',
    services: [
      { id: 'express', name: 'Express' },
      { id: 'economy', name: 'Economy Select' }
    ]
  }
];

// Google API response type
export interface GoogleApiKeyResponse {
  apiKey: string;
  isValid: boolean;
}
