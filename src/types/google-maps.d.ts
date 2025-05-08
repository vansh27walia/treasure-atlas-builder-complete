
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
}

interface Window {
  google?: {
    maps?: GoogleMapsAPI;
  };
  initTestMap?: () => void;
}
