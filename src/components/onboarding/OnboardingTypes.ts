
// Shared types for onboarding components
export interface OnboardingFormValues {
  // Pickup Address
  pickupName: string;
  pickupCompany: string;
  pickupStreet1: string;
  pickupStreet2: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupCountry: string;
  pickupPhone: string;
  
  // Payment Info
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  cvv: string;
}
