
export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency?: string;
  delivery_days?: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  original_rate?: string;
  isPremium?: boolean;
  parcel: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
}

// Shipping workflow step types
export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export interface ShippingWorkflowStep {
  id: ShippingStep;
  label: string;
  status: 'active' | 'completed' | 'upcoming';
}

// Interface for Google API Key response
export interface GoogleApiKeyResponse {
  apiKey?: string;
  error?: string;
}

// Interface for saved address type
export interface SavedAddress {
  id: number;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}
