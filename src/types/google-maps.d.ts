
// Type definitions for Google Maps JavaScript API
interface GoogleMapsPlace {
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address?: string;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface GoogleMapsAutocomplete {
  addListener: (event: string, callback: () => void) => void;
  getPlace: () => GoogleMapsPlace;
}

interface GoogleMapsPlacesAPI {
  Autocomplete: new (
    input: HTMLInputElement,
    options?: {
      types?: string[];
      componentRestrictions?: { country: string | string[] };
      fields?: string[];
    }
  ) => GoogleMapsAutocomplete;
}

interface GoogleMapsAPI {
  places: GoogleMapsPlacesAPI;
  // Note: We're not using the event property directly in our code
  // so we don't need to define it here
}

interface Window {
  google?: {
    maps?: GoogleMapsAPI;
  };
  initGoogleMapsCallback?: () => void;
  initTestMap?: () => void;
}
