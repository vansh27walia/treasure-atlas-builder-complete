
// Carrier options for filtering with services
export interface CarrierService {
  id: string;
  name: string;
}

export interface CarrierOption {
  label: string;
  value: string;
  id: string;
  name: string;
  services: CarrierService[];
}

export const CARRIER_OPTIONS: CarrierOption[] = [
  { 
    label: 'All Carriers', 
    value: 'all',
    id: 'all',
    name: 'All Carriers',
    services: []
  },
  { 
    label: 'USPS', 
    value: 'usps',
    id: 'usps',
    name: 'USPS',
    services: [
      { id: 'priority', name: 'Priority Mail' },
      { id: 'express', name: 'Priority Mail Express' },
      { id: 'first_class', name: 'First Class Mail' },
      { id: 'ground', name: 'Ground Advantage' }
    ]
  },
  { 
    label: 'UPS', 
    value: 'ups',
    id: 'ups',
    name: 'UPS',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: '3day', name: '3-Day Select' },
      { id: '2day', name: '2nd Day Air' },
      { id: 'next_day', name: 'Next Day Air' }
    ]
  },
  { 
    label: 'FedEx', 
    value: 'fedex',
    id: 'fedex',
    name: 'FedEx',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: 'express_saver', name: 'Express Saver' },
      { id: '2day', name: '2Day' },
      { id: 'overnight', name: 'Overnight' }
    ]
  },
  { 
    label: 'DHL', 
    value: 'dhl',
    id: 'dhl',
    name: 'DHL',
    services: [
      { id: 'express', name: 'Express' },
      { id: 'parcel', name: 'Parcel' }
    ]
  }
];
