
export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days?: number;
  est_delivery_days?: number;
  delivery_date?: string;
  shipmentId?: string;
  listRate?: string;
  retailRate?: string;
  isPremium?: boolean;
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export interface ShippingWorkflowStep {
  id: ShippingStep;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
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
}

export interface ShippingParcel {
  length: number;
  width: number;
  height: number;
  weight: number;
  predefined_package?: string;
}
