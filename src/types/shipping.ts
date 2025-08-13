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
  from_address?: AddressDetails; // Optional if using saved pickup
  to_address: AddressDetails;
  parcel: ParcelDetails;
  customs_info?: CustomsInfo; // For international
  options?: Record<string, any>; 
  [key: string]: any; // Allow other fields like to_name, to_company, etc.
}

export interface Rate {
  id: string; // Corresponds to selectedRateId in BulkShipment
  easypost_rate_id?: string; // EasyPost specific rate ID
  carrier: string;
  service: string;
  rate: number;
  formattedRate?: string;
  delivery_days?: number | null;
  est_delivery_days?: number | null;
  shipment_id?: string; // EasyPost shipment ID this rate belongs to
  carrier_account_id?: string;
  retail_rate?: string;
  list_rate?: string;
  [key: string]: any; // For any other properties from the API
}

export interface CustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number; // Weight in ounces
  hs_tariff_number?: string;
  origin_country?: string;
}

export interface CustomsInfo {
  eel_pfc?: string; // E.g., "NOEEI 30.37(a)"
  customs_certify?: boolean;
  customs_signer?: string;
  contents_type?: 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other';
  restriction_type?: 'none' | 'other' | 'quarantine' | 'sanitary_phytosanitary_inspection';
  non_delivery_option?: 'return' | 'abandon';
  customs_items: CustomsItem[];
}

export interface BulkShipment {
  id: string; // Unique ID for this row/entry in the bulk upload
  row?: number; // Original row number from CSV
  easypost_id?: string; // EasyPost shipment ID, populated after rate fetching
  recipient?: string; // For display
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
  label_url?: string; // Primary PNG URL
  label_urls?: { // All available individual label URLs
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  rate?: number; // Populated after rate selection
  carrier?: string; // Populated after rate selection
  service?: string; // Populated after rate selection
  [key: string]: any; // Allow other dynamic fields
}

export interface ConsolidatedLabelUrls {
  pdf?: string;       // Direct URL to consolidated PDF
  png?: string;       // Direct URL to consolidated PNG
  zpl?: string;       // Direct URL to consolidated ZPL
  epl?: string;       // Direct URL to consolidated EPL
  pdfZip?: string;    // URL to ZIP of PDFs (legacy or alternative)
  zplZip?: string;    // URL to ZIP of ZPLs (legacy or alternative)
  eplZip?: string;    // URL to ZIP of EPLs (new)
}

export interface BatchResult {
  batchId: string;
  consolidatedLabelUrls: ConsolidatedLabelUrls;
  scanFormUrl: string | null;
  // Potentially other batch-related info like number of labels in batch, etc.
}

export interface FailedShipmentInfo {
  shipmentId: string; // original shipment ID that failed
  row?: number;
  error: string;
  details?: string; // more detailed error or context
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  totalInsurance?: number; // Added this property
  processedShipments: BulkShipment[];
  failedShipments?: Array<{
    shipmentId: string;
    error: string;
    row?: number;
  }>;
  batchResult?: BatchResult;
  bulk_label_pdf_url?: string | null;
  bulk_label_png_url?: string | null;
  uploadStatus?: string;
  pickupAddress?: any;
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
