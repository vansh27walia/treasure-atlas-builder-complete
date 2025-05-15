import { z } from "zod";

export type ShippingAddressType = "from" | "to";

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export type ShippingWorkflowStep = {
  id: ShippingStep;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
};

export interface GoogleApiKeyResponse {
  apiKey: string;
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
  residential?: boolean;
  addressType?: ShippingAddressType;
}

export interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  predefinedPackage?: string;
}

export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  rate: string; // Changed from number to string to match API responses
  currency: string;
  delivery_days: number;
  delivery_date?: string | null;
  estimated_delivery_date?: string;
  listRate?: string;
  retailRate?: string;
  shipment_id?: string;
  original_rate?: string; // Added this property to fix the error
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  isPremium?: boolean; // Added this property to fix the error
}

export interface ShippingLabelFormat {
  format: 'pdf' | 'png' | 'zpl';
  size: '4x6' | '8.5x11';
}

export interface AddressValidationResult {
  original: ShippingAddress;
  normalized: ShippingAddress;
  status: 'valid' | 'invalid' | 'warning';
  messages: string[];
}

export interface BulkShipment {
  id: string;
  row: number;
  recipient: string;
  carrier: string;
  service: string;
  rate: string; // Changed from number to string to match API responses
  tracking_code?: string;
  trackingCode?: string;
  label_url?: string;
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
  availableRates?: ShippingOption[];
  selectedRateId?: string;
}

export interface BulkShipmentError {
  row: number;
  error: string;
  details: string;
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: BulkShipment[];
  failedShipments: BulkShipmentError[];
  uploadStatus?: 'idle' | 'success' | 'error' | 'editing';
}

export const CARRIER_OPTIONS = [
  {
    id: 'usps',
    name: 'USPS',
    logo: '/carriers/usps.svg',
    services: [
      { id: 'priority', name: 'Priority' },
      { id: 'priority_express', name: 'Priority Express' },
      { id: 'first_class', name: 'First Class' },
      { id: 'ground', name: 'Ground' }
    ]
  },
  {
    id: 'ups',
    name: 'UPS',
    logo: '/carriers/ups.svg',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: '3day_select', name: '3-Day Select' },
      { id: '2day_air', name: '2nd Day Air' },
      { id: 'next_day_air', name: 'Next Day Air' }
    ]
  },
  {
    id: 'fedex',
    name: 'FedEx',
    logo: '/carriers/fedex.svg',
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
    logo: '/carriers/dhl.svg',
    services: [
      { id: 'express', name: 'Express' },
      { id: 'express_worldwide', name: 'Express Worldwide' },
      { id: 'express_economy', name: 'Express Economy' }
    ]
  }
];
