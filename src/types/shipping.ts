
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

// Add bulk upload-related types
export interface BulkShipment {
  id: string;
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: number;
  trackingCode?: string;
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
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
  };
  availableRates?: Array<{
    id: string;
    carrier: string;
    service: string;
    rate: number;
    delivery_days?: number;
  }>;
  selectedRateId?: string;
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
}

export interface CarrierOption {
  id: string;
  name: string;
  services: CarrierService[];
}

export const CARRIER_OPTIONS: CarrierOption[] = [
  {
    id: 'usps',
    name: 'USPS',
    services: [
      { id: 'usps_priority', name: 'Priority', carrier: 'USPS' },
      { id: 'usps_priority_express', name: 'Priority Express', carrier: 'USPS' },
      { id: 'usps_first_class', name: 'First Class', carrier: 'USPS' },
      { id: 'usps_parcel_select', name: 'Parcel Select', carrier: 'USPS' },
    ]
  },
  {
    id: 'ups',
    name: 'UPS',
    services: [
      { id: 'ups_ground', name: 'Ground', carrier: 'UPS' },
      { id: 'ups_3_day_select', name: '3-Day Select', carrier: 'UPS' },
      { id: 'ups_2nd_day_air', name: '2nd Day Air', carrier: 'UPS' },
      { id: 'ups_next_day_air', name: 'Next Day Air', carrier: 'UPS' },
    ]
  },
  {
    id: 'fedex',
    name: 'FedEx',
    services: [
      { id: 'fedex_ground', name: 'Ground', carrier: 'FedEx' },
      { id: 'fedex_express_saver', name: 'Express Saver', carrier: 'FedEx' },
      { id: 'fedex_2day', name: '2Day', carrier: 'FedEx' },
      { id: 'fedex_overnight', name: 'Overnight', carrier: 'FedEx' },
    ]
  },
  {
    id: 'dhl',
    name: 'DHL',
    services: [
      { id: 'dhl_express', name: 'Express', carrier: 'DHL' },
      { id: 'dhl_express_worldwide', name: 'Express Worldwide', carrier: 'DHL' },
      { id: 'dhl_express_economy', name: 'Express Economy', carrier: 'DHL' },
    ]
  }
];
