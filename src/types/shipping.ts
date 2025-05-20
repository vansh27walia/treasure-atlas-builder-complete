
export interface BulkShipment {
  id: string;
  row?: number;
  recipient?: string;
  carrier?: string;
  trackingCode?: string;
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
  status: 'pending' | 'processing' | 'completed' | 'success' | 'failed';
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
  rate: string;
  delivery_days?: number;
  delivery_date?: string;
  original_rate?: string;
  parcel?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  currency?: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  isPremium?: boolean;
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

// Carrier options for filtering
export const CARRIER_OPTIONS = [
  { label: 'All Carriers', value: 'all' },
  { label: 'USPS', value: 'usps' },
  { label: 'UPS', value: 'ups' },
  { label: 'FedEx', value: 'fedex' },
  { label: 'DHL', value: 'dhl' }
];
