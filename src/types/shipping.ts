
// Add the GoogleApiKeyResponse type
export interface GoogleApiKeyResponse {
  apiKey: string;
  error?: string;
  message?: string;
}

export type ShippingStep = 'address' | 'package' | 'rates' | 'label' | 'complete';

export interface ShippingWorkflowStep {
  id: ShippingStep;
  label: string;
  status: 'completed' | 'active' | 'upcoming';
}
