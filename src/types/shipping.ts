import { Address } from "@/services/AddressService";

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
  weight: number;
  value?: number;
  currency?: string;
}

export interface ShipmentDetails {
  id: string; // Ensure ID is string for consistency
  // Recipient Address
  recipient: string; // Typically name
  customer_name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string; // Add if not present
  is_residential?: boolean; // Add if not present

  // Package Details
  weight: number; // in ounces or a consistent unit
  length: number;
  width: number;
  height: number;
  value?: number;
  currency?: string;

  // Service Details (optional, might be populated after rate selection)
  carrier?: string;
  service?: string;
  rate?: number;
  selectedRateId?: string | null;
  
  // Metadata
  reference?: string; // User-defined reference (e.g., order number)
  notes?: string;
}

export interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days?: number;
  currency: string;
}

export interface BulkShipment extends ShipmentDetails {
  row?: number; // Original row from CSV for easy reference
  status?: ShipmentStatus;
  availableRates?: Rate[];
  easypost_id?: string;
  selected_rate_id?: string;
  selectedRateId?: string | null; // Explicitly ensure this is here
  label_url?: string; // URL for individual PNG label
  label_urls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  tracking_code?: string;
  tracking_number?: string; // Alias for tracking_code
  isFetchingRates?: boolean; // To indicate if rates are currently being fetched for this specific shipment
  rate?: number; // This should be the selected rate's cost
  details?: any; // For any other miscellaneous details
  customer_address?: string; // Often a concatenation for display
}


export interface ConsolidatedLabelUrls {
  pdf?: string;
  zpl?: string;
  epl?: string;
  pdfZip?: string; // Link to a ZIP file of all PDFs
  zplZip?: string; // Link to a ZIP file of all ZPLs
  eplZip?: string; // Link to a ZIP file of all EPLs
}

export interface BatchResult {
  batchId: string;
  consolidatedLabelUrls: ConsolidatedLabelUrls;
  scanFormUrl?: string | null; // URL for the generated scan form/manifest
  status?: string; // e.g., "creating", "completed", "failed"
  labelCount?: number;
  // ... any other batch related info like creation date, messages etc.
}

export interface BulkUploadResult {
  total: number; // Total shipments processed
  successful: number; // Number of shipments successfully processed (labels created or rates fetched)
  failed: number; // Number of shipments that failed
  totalCost?: number; // Total cost of selected rates
  processedShipments: BulkShipment[];
  failedShipments?: Array<{ shipmentId?: string; error: string; row?: number; details?: any }>;
  batchResult?: BatchResult | null; // Holds URLs for batch labels (PDF, ZPL) and scan form
  uploadStatus?: UploadStatus; // Overall status of the bulk upload process
  pickupAddress?: SavedAddress; // The pickup address used for this batch
  bulk_label_png_url?: string;
  bulk_label_pdf_url?: string;
}

export type UploadStatus =
  | 'idle'
  | 'uploading' // File is being uploaded/parsed
  | 'editing' // Shipments parsed, rates being fetched or user is editing
  | 'success' // Labels generated and available
  | 'error' // An error occurred in the process
  | 'creating-labels'; // Labels are actively being generated

export interface SavedAddress {
  id: string; // Ensure ID is string here too
  user_id: string;
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
  // Add any other fields that might come from the database or are used in forms
  address_type?: 'residential' | 'business'; // Example, if you use this
  instructions?: string; // Delivery instructions
}
