
export type ShipmentType = 'LTL' | 'FTL' | 'HEAVY_PARCEL';

export interface ShippingFormData {
  // Common fields
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  deliveryDate: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  insuranceRequired: boolean;
  specialInstructions: string;

  // LTL specific
  handlingUnits?: number;
  unitType?: string;
  weightPerUnit?: number;
  freightClass?: string;
  liftgateRequired?: boolean;

  // FTL specific
  equipmentType?: string;
  totalWeight?: number;

  // Heavy Parcel specific
  shipmentTitle?: string;
  materialType?: string;
  parcelCount?: number;
  weightPerParcel?: number;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  transitTime: string;
  currency: string;
  insuranceOptions?: string[];
}
