
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
  rate: number;
  currency: string;
  delivery_days: number;
  estimated_delivery_date?: string;
  listRate?: number;
  retailRate?: number;
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
  rate: number;
  tracking_code?: string;
  trackingCode?: string;
  tracking_number?: string; // Added for backend compatibility
  label_url?: string;
  label_urls?: { // Added for backend compatibility
    png: string | null;
    pdf?: string | null;
    zpl?: string | null;
  };
  status: 'pending' | 'processing' | 'error' | 'completed' | 'failed';
  error?: string;
  easypost_id?: string;
  shipment_id?: string; // Added for backend compatibility
  recipient_name?: string; // Added for backend compatibility
  details: {
    // EasyPost CSV format fields (to_address fields)
    to_name: string;
    to_company?: string;
    to_street1: string;
    to_street2?: string;
    to_city: string;
    to_state: string;
    to_zip: string;
    to_country: string;
    to_phone?: string;
    to_email?: string;
    // Package dimensions and weight
    weight: number;
    length: number;
    width: number;
    height: number;
    reference?: string;
    // Legacy fields for backward compatibility
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
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
  // Customer details for display
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
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
  processedShipments: any[];
  failedShipments?: Array<{
    row?: number;
    error: string;
    details?: string;
  }>;
  totalCost?: number;
  batchUrls?: {
    pdf?: string;
    png?: string;
    zpl?: string;
  };
  batchPdfUrl?: string;
  batchPngUrl?: string;
  batchZplUrl?: string;
  // Added missing properties
  uploadStatus?: 'idle' | 'success' | 'error' | 'editing';
  pickupAddress?: ShippingAddress;
  bulk_label_png_url?: string;
  bulk_label_pdf_url?: string;
  bulk_label_zpl_url?: string;
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
