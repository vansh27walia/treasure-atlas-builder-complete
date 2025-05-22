
// Extract address components from Google Place result
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
  
  // Check if we have address_components
  if (!place.address_components || place.address_components.length === 0) {
    console.warn('No address components found in Google place object');
    
    // Try to parse from formatted_address as a fallback
    if (place.formatted_address) {
      const parts = place.formatted_address.split(',');
      if (parts.length >= 3) {
        // Typical format: "123 Main St, City, State ZIP"
        street_number = parts[0].trim();
        city = parts[1].trim();
        // Last part typically contains state and zip
        const stateZip = parts[2].trim().split(' ');
        if (stateZip.length >= 2) {
          state = stateZip[0].trim();
          zip = stateZip[stateZip.length - 1].trim();
        }
      }
    }
  } else {
    // Extract each component
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
  
  // Combine street number and route for street address
  let street1 = '';
  if (street_number && route) {
    street1 = `${street_number} ${route}`;
  } else if (route) {
    street1 = route;
  } else if (street_number) {
    street1 = street_number;
  } else if (place.formatted_address) {
    // If we couldn't extract street components but have a formatted address, use the first part
    const parts = place.formatted_address.split(',');
    if (parts.length > 0) {
      street1 = parts[0].trim();
    }
  }
  
  console.log('Extracted address components:', { street1, city, state, zip, country });
  
  return {
    street1,
    city,
    state,
    zip,
    country
  };
}
