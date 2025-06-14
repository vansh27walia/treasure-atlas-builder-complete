// Removed import { Address } from "@/services/AddressService"; 
// It was causing an error and SavedAddress is more specific here.

export type ShipmentStatus =
  | 'pending_rates' // Initial status, waiting for rates
  | 'rates_fetched' // Rates have been fetched
  | 'rate_selected' // User has selected a rate
  | 'label_purchased' // Label has been purchased (but not necessarily batch-processed yet)
  | 'error' // An error occurred with this shipment
  | 'failed' // Label creation failed for this shipment
  | 'completed'; // Label successfully created and included in results (e.g., part of a batch)

export interface PackageDetails {
  length: number;
  width: number;
  height: number;
  weight: number; // Consider units, e.g. ounces or grams
  value?: number;
  currency?: string; // e.g. "USD"
}

export interface ShipmentDetails { // Basic details for creating a shipment
  id: string; 
  recipient: string; 
  customer_name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string; 
  is_residential?: boolean; 

  // Package Details (can be directly on shipment or as separate PackageDetails object)
  weight: number; 
  length: number;
  width: number;
  height: number;
  value?: number; // Package value
  currency?: string; // Currency for package value

  carrier?: string; // Populated after rate selection or if pre-defined
  service?: string; // Populated after rate selection or if pre-defined
  rate?: number; // Cost of selected rate
  rate_amount?: number; // Alternative for rate if it's stored as number directly
  selectedRateId?: string | null; // ID of the selected rate object
  
  reference?: string; 
  notes?: string;
}

export interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string; // This is often a string from APIs like "23.45"
  rate_float?: number; // Optional: numeric rate for calculations
  delivery_days?: number;
  currency: string;
  shipment_id?: string; // Easypost specific field
  carrier_account_id?: string; // Easypost specific
}

export interface BulkShipment extends ShipmentDetails {
  row?: number; 
  status?: ShipmentStatus;
  availableRates?: Rate[];
  easypost_id?: string; 
  // selectedRateId is already in ShipmentDetails
  label_url?: string; 
  label_urls?: { 
    png?: string;
    pdf?: string;
    zpl?: string;
    epl?: string; 
  };
  tracking_code?: string;
  tracking_number?: string; 
  isFetchingRates?: boolean; 
  details?: any; 
  customer_address?: string; // Concatenated address for display
  scan_form_url?: string | null; // For individual shipment scan forms
}


export interface ConsolidatedLabelUrls {
  pdf?: string;
  zpl?: string;
  epl?: string;
  pdfZip?: string; 
  zplZip?: string; 
  eplZip?: string; 
}

export interface BatchResult {
  batchId: string;
  consolidatedLabelUrls: ConsolidatedLabelUrls;
  scanFormUrl?: string | null; // scanFormUrl is optional
  status?: string; 
  labelCount?: number;
}

export interface BulkUploadResult {
  total: number; 
  successful: number; 
  failed: number; 
  totalCost?: number; 
  processedShipments: BulkShipment[];
  failedShipments?: Array<{ shipmentId?: string; error: string; row?: number; details?: any }>;
  batchResult?: BatchResult | null; 
  uploadStatus?: UploadStatus; 
  pickupAddress?: SavedAddress; 
  isFetchingRates?: boolean; // Indicates if rates are being fetched for the whole batch
  errorMessage?: string; // Top-level error message for the batch
}

export type UploadStatus =
  | 'idle'
  | 'uploading' // Parsing file
  | 'processing' // Fetching rates, API calls
  | 'editing' // User is reviewing/editing shipments
  | 'creating-labels' 
  | 'success' 
  | 'error'; 


export interface SavedAddress {
  id: string; // Keep as string for frontend consistency
  user_id?: string; 
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
  is_default_from?: boolean;
  is_default_to?: boolean;
  created_at?: string;
  updated_at?: string;
  address_type?: 'residential' | 'business'; 
  instructions?: string; 
}

export const CARRIER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Carriers', value: '' },
  { label: 'USPS', value: 'USPS' },
  { label: 'UPS', value: 'UPS' },
  { label: 'FedEx', value: 'FedEx' },
  { label: 'DHL Express', value: 'DHLExpress' },
  // Add other carriers as needed
];

export type ShippingStepId = 'address' | 'parcel' | 'rates' | 'payment' | 'label'; // Renamed from ShippingStep

export interface ShippingWorkflowStep {
  id: ShippingStepId;
  name: string; 
  status: 'current' | 'upcoming' | 'complete' | 'error';
}
