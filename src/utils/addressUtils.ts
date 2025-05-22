
// Just updating the extractAddressComponents function to be more robust
export function extractAddressComponents(place: GoogleMapsPlace): {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  let street_number = '';
  let route = '';
  let city = '';
  let state = '';
  let zip = '';
  let country = 'US';
  
  console.log('Extracting components from place:', place);
  
  try {
    // Extract each component
    if (place.address_components) {
      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          street_number = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (types.includes('locality') || types.includes('sublocality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('postal_code')) {
          zip = component.long_name;
        } else if (types.includes('country')) {
          country = component.short_name;
        }
      });
    }
    
    // If city is still empty, try to get it from other address components
    if (!city) {
      place.address_components?.forEach(component => {
        if (component.types.includes('sublocality_level_1') || 
            component.types.includes('neighborhood') ||
            component.types.includes('postal_town')) {
          city = component.long_name;
        }
      });
    }
    
    // Combine street number and route for street address
    let street1 = '';
    if (street_number && route) {
      street1 = `${street_number} ${route}`;
    } else if (route) {
      street1 = route;
    } else if (place.formatted_address) {
      // Fallback to first line of formatted address
      const addressParts = place.formatted_address.split(',');
      street1 = addressParts[0] || '';
    }
    
    console.log("Extracted address components:", { street1, city, state, zip, country });
    
    return {
      street1,
      city,
      state,
      zip,
      country
    };
  } catch (error) {
    console.error('Error extracting address components:', error);
    // Return default empty values if extraction fails
    return {
      street1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    };
  }
}

// Add the missing getCarrierLogoUrl function
export function getCarrierLogoUrl(carrier: string): string | null {
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
}
