
export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days?: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  original_rate?: string;
  isPremium?: boolean;
}

export interface AIRecommendation {
  rateId: string;
  reason: string;
  bestOverall?: string;
  bestValue?: string;
  fastest?: string;
  analysisText?: string;
}

export interface GoogleApiKeyResponse {
  apiKey: string;
  error?: string;
  message?: string;
}

export interface ShippingWorkflowStep {
  id: 'address' | 'package' | 'rates' | 'label' | 'complete';
  label: string;
  status: 'completed' | 'active' | 'upcoming';
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';
