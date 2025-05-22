
// Export SavedAddress type for components that need it
export interface SavedAddress {
  id: string;
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

// Function to get carrier logo URL
export const getCarrierLogoUrl = (carrier: string): string | null => {
  const carrierLower = carrier.toLowerCase();
  
  if (carrierLower.includes('usps')) {
    return "https://www.usps.com/assets/images/home/logo-sb.svg";
  } else if (carrierLower.includes('ups')) {
    return "https://www.ups.com/assets/resources/images/UPS_logo.svg";
  } else if (carrierLower.includes('fedex')) {
    return "https://www.fedex.com/content/dam/fedex-com/logos/logo.png";
  } else if (carrierLower.includes('dhl')) {
    return "https://www.dhl.com/img/meta/dhl-logo.png";
  }
  return null;
};

// Function to format address for display
export const formatAddressForDisplay = (address: any): string => {
  if (!address) return 'No address available';
  
  const parts = [];
  
  if (address.name) parts.push(address.name);
  if (address.street1) parts.push(address.street1);
  if (address.street2) parts.push(address.street2);
  if (address.city && address.state) parts.push(`${address.city}, ${address.state} ${address.zip || ''}`);
  else if (address.city) parts.push(address.city);
  if (address.country && address.country !== 'US') parts.push(address.country);
  
  return parts.join(', ');
};

// Function to create an address select handler
export const createAddressSelectHandler = (form: any, onAddressSelect?: (address: any) => void) => {
  return (address: any) => {
    if (!address) return;
    
    if (form) {
      // Set form values from address
      if (address.street1) form.setValue('street1', address.street1);
      if (address.street2) form.setValue('street2', address.street2 || '');
      if (address.city) form.setValue('city', address.city);
      if (address.state) form.setValue('state', address.state);
      if (address.zip) form.setValue('zip', address.zip);
      if (address.country) form.setValue('country', address.country || 'US');

      // Trigger validation
      form.trigger(['street1', 'city', 'state', 'zip', 'country']);
    }
    
    // Call external handler if provided
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };
};
