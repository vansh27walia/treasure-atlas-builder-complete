
import { ShippingAddress, Parcel } from './shipping';

export interface ShippingToRequest {
  fromAddress: ShippingAddress;
  toAddress: ShippingAddress;
  parcel: Parcel;
  options?: {
    insurance?: number;
    signature?: 'required' | 'not_required';
    label_format?: 'pdf' | 'zpl';
    label_size?: '4x6' | '8.5x11';
  };
}

export interface ShippingToRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  original_rate?: string;
  isPremium?: boolean;
}

export interface ShippingToLabel {
  labelUrl: string;
  trackingCode: string;
  shipmentId: string;
}
