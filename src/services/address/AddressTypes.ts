
export interface SavedAddress {
  id: number; 
  user_id: string;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  is_default_from: boolean;
  is_default_to: boolean;
  created_at?: string;
}
