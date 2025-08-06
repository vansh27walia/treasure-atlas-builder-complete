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

export interface ParcelDetails {
  length: number;
  width: number;
  height: number;
  weight: number;
  predefined_package?: string | null; 
}

export interface AddressDetails {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  is_residential?: boolean;
}

export interface ShipmentDetails {
  from_address?: AddressDetails;
  to_address: AddressDetails;
  parcel: ParcelDetails;
  customs_info?: CustomsInfo;
  options?: Record<string, any>; 
  [key: string]: any;
}

export interface Rate {
  id: string;
  easypost_rate_id?: string;
  carrier: string;
  service: string;
  rate: number;
  formattedRate?: string;
  delivery_days?: number | null;
  est_delivery_days?: number | null;
  shipment_id?: string;
  carrier_account_id?: string;
  retail_rate?: string;
  list_rate?: string;
  [key: string]: any;
}

export interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number;
  hs_tariff_number?: string;
  origin_country: string;
}

export interface CustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type?: string;
  restriction_comments?: string;
  customs_items: CustomsItem[];
  eel_pfc?: string;
}

export interface BulkShipment {
  id: string;
  row?: number;
  easypost_id?: string;
  recipient?: string;
  customer_name?: string;
  customer_address?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_company?: string;
  details: ShipmentDetails;
  availableRates?: Rate[];
  selectedRateId?: string | null;
  status: 'pending_rates' | 'rates_fetched' | 'rate_selected' | 'label_purchased' | 'error' | 'completed' | 'failed';
  error?: string | null;
  tracking_code?: string;
  tracking_number?: string;
  label_url?: string;
  label_urls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  rate?: number;
  carrier?: string;
  service?: string;
  customs_info?: CustomsInfo;
  requiresCustoms?: boolean;
  [key: string]: any;
}

export interface ConsolidatedLabelUrls {
  pdf?: string;
  png?: string;
  zpl?: string;
  epl?: string;
  pdfZip?: string;
  zplZip?: string;
  eplZip?: string;
}

export interface BatchResult {
  batchId: string;
  consolidatedLabelUrls: ConsolidatedLabelUrls;
  scanFormUrl: string | null;
}

export interface FailedShipmentInfo {
  shipmentId: string;
  row?: number;
  error: string;
  details?: string;
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost?: number;
  processedShipments: BulkShipment[];
  failedShipments?: FailedShipmentInfo[];
  uploadStatus?: 'idle' | 'uploading' | 'editing' | 'rates_fetching' | 'rate_selection' | 'paying' | 'creating-labels' | 'success' | 'error';
  pickupAddress?: any;
  batchResult?: BatchResult | null;
  bulk_label_png_url?: string | null;
  bulk_label_pdf_url?: string | null; 
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
