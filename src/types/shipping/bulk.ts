
import { ShippingRate } from './common';

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

export interface BulkUploadResult {
  uploadStatus: 'editing' | 'uploading' | 'success' | 'error';
  successful: number;
  failed: number;
  total: number;
  processedShipments: BulkShipment[];
  failedShipments: FailedShipment[];
  totalCost: number;
}
