
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

interface GoogleMapsEventAPI {
  clearInstanceListeners: (instance: any) => void;
}

interface GoogleMapsAPI {
  places: GoogleMapsPlacesAPI;
  event: GoogleMapsEventAPI;
}

interface Window {
  google?: {
    maps?: GoogleMapsAPI;
  };
  initGoogleMapsCallback?: () => void;
  initTestMap?: () => void;
}
