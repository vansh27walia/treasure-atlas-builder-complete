export interface BulkShipment {
  id: string;
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
  status: 'pending' | 'processing' | 'success' | 'failed';
  tracking_code?: string;
  label_url?: string;
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
}

export interface BulkUploadResult {
  uploadStatus: 'editing' | 'uploading' | 'success' | 'error';
  successful: number;
  failed: number;
  total: number;
  processedShipments: BulkShipment[];
  failedShipments: BulkShipment[];
  totalCost: number;
}
