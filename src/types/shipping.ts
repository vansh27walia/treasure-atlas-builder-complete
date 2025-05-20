export interface BulkShipment {
  id: string;
  row?: number;
  recipient?: string;
  carrier?: string;
  trackingCode?: string;
  service?: string;
  rate?: number;
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
  };
  toAddress: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  fromAddress?: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  parcel: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  availableRates: ShippingRate[];
  selectedRateId: string | null;
  status: 'pending' | 'processing' | 'completed' | 'success' | 'failed' | 'error';
  error?: string;
  tracking_code?: string;
  label_url?: string;
}

export interface FailedShipment {
  id: string;
  row: number;
  error: string;
  details: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string | number;
  currency?: string;
  delivery_days?: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  original_rate?: string | number;
  isPremium?: boolean;
  parcel: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
}

export interface BulkUploadResult {
  uploadStatus: 'editing' | 'uploading' | 'success' | 'error';
  successful: number;
  failed: number;
  total: number;
  processedShipments: BulkShipment[];
  failedShipments: FailedShipment[];
  totalCost: number;
}

// Shipping workflow step types
export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export interface ShippingWorkflowStep {
  id: ShippingStep;
  label: string;
  status: 'active' | 'completed' | 'upcoming';
}

// Carrier options for filtering with services
export interface CarrierService {
  id: string;
  name: string;
}

export interface CarrierOption {
  label: string;
  value: string;
  id: string;
  name: string;
  services: CarrierService[];
}

export const CARRIER_OPTIONS: CarrierOption[] = [
  { 
    label: 'All Carriers', 
    value: 'all',
    id: 'all',
    name: 'All Carriers',
    services: []
  },
  { 
    label: 'USPS', 
    value: 'usps',
    id: 'usps',
    name: 'USPS',
    services: [
      { id: 'priority', name: 'Priority Mail' },
      { id: 'express', name: 'Priority Mail Express' },
      { id: 'first_class', name: 'First Class Mail' },
      { id: 'ground', name: 'Ground Advantage' }
    ]
  },
  { 
    label: 'UPS', 
    value: 'ups',
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
    label: 'FedEx', 
    value: 'fedex',
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
    label: 'DHL', 
    value: 'dhl',
    id: 'dhl',
    name: 'DHL',
    services: [
      { id: 'express', name: 'Express' },
      { id: 'parcel', name: 'Parcel' }
    ]
  }
];

// Interface for Google API Key response
export interface GoogleApiKeyResponse {
  apiKey?: string;
  error?: string;
}

// Interface for saved address type
export interface SavedAddress {
  id: number;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}
