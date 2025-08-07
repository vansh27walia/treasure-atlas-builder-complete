// Utility function to standardize carrier names from API responses
export const standardizeCarrierName = (apiCarrierName: string): string => {
  const normalizedName = apiCarrierName.toUpperCase().trim();
  
  // UPS variants
  if (normalizedName.includes('UPS')) {
    return 'UPS';
  }
  
  // FedEx variants
  if (normalizedName.includes('FEDEX') || normalizedName.includes('FEDERAL EXPRESS')) {
    return 'FedEx';
  }
  
  // USPS variants
  if (normalizedName.includes('USPS') || normalizedName.includes('US POSTAL') || normalizedName.includes('UNITED STATES POSTAL')) {
    return 'USPS';
  }
  
  // DHL variants
  if (normalizedName.includes('DHL')) {
    return 'DHL';
  }
  
  // Canada Post variants
  if (normalizedName.includes('CANADA POST') || normalizedName.includes('CANADAPOST')) {
    return 'Canada Post';
  }
  
  // If no match found, return the original name but cleaned up
  return apiCarrierName.trim();
};

// Function to clean service names as well
export const standardizeServiceName = (apiServiceName: string, carrier: string): string => {
  const serviceName = apiServiceName.trim();
  
  switch (carrier) {
    case 'UPS':
      // Remove UPS prefixes and standardize
      return serviceName.replace(/^UPS\s*/i, '').trim();
    
    case 'FedEx':
      // Remove FedEx prefixes and standardize
      return serviceName.replace(/^(FedEx|Federal Express)\s*/i, '').trim();
    
    case 'USPS':
      // Keep USPS services as they are, just clean them
      return serviceName.replace(/^USPS\s*/i, '').trim();
    
    case 'DHL':
      // Remove DHL prefixes and standardize
      return serviceName.replace(/^DHL\s*/i, '').trim();
    
    default:
      return serviceName;
  }
};
