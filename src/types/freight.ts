
export interface FreightLocation {
  locationType: string;
  country: string;
  address: string;
}

export interface LooseCargoLoad {
  id: string;
  calculateBy: 'unit' | 'total';
  unitType?: 'pallets' | 'boxes';
  quantity: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  weight: {
    value: number;
    unit: 'kg' | 'lbs';
  };
  totalVolume?: number;
}

export interface ContainerLoad {
  id: string;
  quantity: number;
  containerSize: string;
  isOverweight: boolean;
}

export interface FreightLoadDetails {
  type: 'loose-cargo' | 'containers';
  loads: (LooseCargoLoad | ContainerLoad)[];
}

export interface FreightFormData {
  origin: FreightLocation;
  destination: FreightLocation;
  loadDetails: FreightLoadDetails;
}

export interface FreightRate {
  mode: string;
  minPrice: number;
  maxPrice: number;
  minTransitTime: number;
  maxTransitTime: number;
  originPort?: string;
  destinationPort?: string;
}
