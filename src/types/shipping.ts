

export interface PackageTypeOption {
  value: string;
  label: string;
  icon?: string;
}

export interface CarrierPackageOption {
  value: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

export interface CarrierPackages {
  [carrier: string]: CarrierPackageOption[];
}

export type PackageType = 'custom' | 'envelope' | 'flat-rate';

export interface ShippingFormData {
  packageType: PackageType;
  carrier?: string;
  predefinedPackage?: string;
  length?: number;
  width?: number;
  height?: number;
  weight: number;
}

// ParcelData interface that supports different package types
export interface ParcelData {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  predefined_package?: string;
}

// Bulk shipping types
export interface BulkShipment {
  id: string;
  row: number;
  recipient: string;
  customer_name?: string;
  customer_address?: string;
  details: {
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
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    // Insurance and declared value fields
    insurance_enabled?: boolean;
    declared_value?: number;
    // Parcel dimension fields used in bulk processing
    parcel_length?: number;
    parcel_width?: number;
    parcel_height?: number;
    parcel_weight?: number;
    // Legacy field names for backward compatibility
    to_name?: string;
    to_company?: string;
    to_phone?: string;
    to_email?: string;
    to_street1?: string;
    to_street2?: string;
    to_city?: string;
    to_state?: string;
    to_zip?: string;
    to_country?: string;
    reference?: string;
  };
  carrier: string;
  service: string;
  rate: number;
  tracking_code?: string;
  tracking_number?: string;
  label_url?: string;
  label_urls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
    epl?: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'pending_rates' | 'error';
  error?: string;
  availableRates?: any[];
  selectedRateId?: string;
  easypost_id?: string;
  shipment_id?: string;
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
  scanFormUrl?: string; // Make this optional to match usage
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: BulkShipment[];
  failedShipments: Array<{
    shipmentId: string;
    error: string;
    row?: number;
    details?: string; // Add details property for failed shipments
  }>;
  batchResult?: BatchResult;
  bulk_label_pdf_url?: string;
  uploadStatus?: string;
  pickupAddress?: any;
}

// Workflow types
export interface ShippingWorkflowStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export const PACKAGE_TYPES: PackageTypeOption[] = [
  { value: 'custom', label: 'Custom Box', icon: '📦' },
  { value: 'envelope', label: 'Envelope', icon: '✉️' },
  { value: 'flat-rate', label: 'Flat Rate Packaging', icon: '📮' }
];

export const CARRIER_OPTIONS = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL Express' }
];

export const CARRIER_PACKAGES: CarrierPackages = {
  usps: [
    { value: 'FlatRateEnvelope', label: 'Flat Rate Envelope', description: 'Up to 70 lbs' },
    { value: 'FlatRateLegalEnvelope', label: 'Legal Flat Rate Envelope', description: 'Legal size, up to 70 lbs' },
    { value: 'FlatRatePaddedEnvelope', label: 'Padded Flat Rate Envelope', description: 'Extra protection, up to 70 lbs' },
    { value: 'SmallFlatRateBox', label: 'Small Flat Rate Box', description: '8.6" x 5.4" x 1.6"' },
    { value: 'MediumFlatRateBox', label: 'Medium Flat Rate Box', description: '11" x 8.5" x 5.5"' },
    { value: 'LargeFlatRateBox', label: 'Large Flat Rate Box', description: '12" x 12" x 5.5"' },
    { value: 'RegionalRateBoxA', label: 'Regional Rate Box A', description: '10" x 7" x 4.75"' },
    { value: 'RegionalRateBoxB', label: 'Regional Rate Box B', description: '12" x 10.25" x 5"' }
  ],
  ups: [
    { value: 'UPSLetter', label: 'UPS Letter', description: 'Document envelope' },
    { value: 'UPSExpressBox', label: 'UPS Express Box', description: 'Small express package' },
    { value: 'UPS25kgBox', label: 'UPS 25kg Box', description: 'Up to 25kg capacity' },
    { value: 'UPS10kgBox', label: 'UPS 10kg Box', description: 'Up to 10kg capacity' },
    { value: 'Tube', label: 'UPS Tube', description: 'Cylindrical packaging' },
    { value: 'Pak', label: 'UPS Pak', description: 'Padded envelope' },
    { value: 'SmallExpressBox', label: 'Small Express Box', description: 'Compact shipping box' },
    { value: 'MediumExpressBox', label: 'Medium Express Box', description: 'Medium-sized box' },
    { value: 'LargeExpressBox', label: 'Large Express Box', description: 'Large capacity box' }
  ],
  fedex: [
    { value: 'FedExEnvelope', label: 'FedEx Envelope', description: 'Standard document envelope' },
    { value: 'FedExBox', label: 'FedEx Box', description: 'Standard shipping box' },
    { value: 'FedExSmallBox', label: 'FedEx Small Box', description: '12.4" x 10.7" x 1.5"' },
    { value: 'FedExMediumBox', label: 'FedEx Medium Box', description: '11.5" x 8.2" x 4"' },
    { value: 'FedExLargeBox', label: 'FedEx Large Box', description: '17.5" x 12.4" x 3"' },
    { value: 'FedExPak', label: 'FedEx Pak', description: 'Padded shipping envelope' },
    { value: 'FedExTube', label: 'FedEx Tube', description: 'Cylindrical container' }
  ],
  dhl: [
    { value: 'DHLEnvelope', label: 'DHL Envelope', description: 'Document envelope' },
    { value: 'DHLFlyer', label: 'DHL Flyer', description: 'Lightweight documents' },
    { value: 'DHLExpressBox', label: 'DHL Express Box', description: 'Standard express box' },
    { value: 'DHLJumboBox', label: 'DHL Jumbo Box', description: 'Large capacity box' },
    { value: 'DHLSmallBox', label: 'DHL Small Box', description: 'Compact shipping box' },
    { value: 'DHLLargeBox', label: 'DHL Large Box', description: 'Large shipping box' },
    { value: 'DHLPak', label: 'DHL Pak', description: 'Padded envelope' },
    { value: 'DHLTube', label: 'DHL Tube', description: 'Cylindrical packaging' }
  ]
};
