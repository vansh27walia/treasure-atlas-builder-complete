
import { supabase } from '@/integrations/supabase/client';
import { SavedAddress } from '@/types/shipping';

interface DbAddress {
  id: number;
  user_id: string;
  name?: string | null;
  company?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
  email?: string | null;
  is_residential?: boolean | null;
  is_default_from?: boolean | null;
  is_default_to?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  address_type?: 'residential' | 'business' | null;
  instructions?: string | null;
}

const mapDbAddressToSavedAddress = (dbAddress: DbAddress | null): SavedAddress | null => {
  if (!dbAddress) return null;
  return {
    id: String(dbAddress.id),
    user_id: dbAddress.user_id,
    name: dbAddress.name ?? '',
    company: dbAddress.company ?? '',
    street1: dbAddress.street1,
    street2: dbAddress.street2 ?? '',
    city: dbAddress.city,
    state: dbAddress.state,
    zip: dbAddress.zip,
    country: dbAddress.country,
    phone: dbAddress.phone ?? '',
    email: dbAddress.email ?? '',
    is_residential: dbAddress.is_residential ?? true,
    is_default_from: dbAddress.is_default_from ?? false,
    is_default_to: dbAddress.is_default_to ?? false,
    created_at: dbAddress.created_at ?? undefined,
    updated_at: dbAddress.updated_at ?? undefined,
    address_type: dbAddress.address_type ?? undefined,
    instructions: dbAddress.instructions ?? undefined,
  };
};

export const addressService = {
  getSavedAddresses: async (): Promise<SavedAddress[]> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated:', sessionError);
      return [];
    }
    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
    return data ? data.map(addr => mapDbAddressToSavedAddress(addr as DbAddress)).filter(Boolean) as SavedAddress[] : [];
  },

  addAddress: async (address: Omit<SavedAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<SavedAddress> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('User not authenticated for adding address:', sessionError);
      throw new Error('User not authenticated');
    }
    const userId = sessionData.session.user.id;
    
    const addressToInsert = {
      user_id: userId,
      name: address.name || '',
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || '',
      email: address.email || '',
      is_residential: address.is_residential ?? true,
      is_default_from: address.is_default_from ?? false,
      is_default_to: address.is_default_to ?? false,
    };

    const { data, error } = await supabase
      .from('addresses')
      .insert(addressToInsert)
      .select()
      .single();

    if (error) {
      console.error('Error adding address:', error);
      throw error;
    }
    return mapDbAddressToSavedAddress(data as DbAddress) as SavedAddress;
  },

  updateAddress: async (addressId: string, updates: Partial<SavedAddress>): Promise<SavedAddress> => {
    const { id, user_id, created_at, updated_at, ...validUpdates } = updates;

    const { data, error } = await supabase
      .from('addresses')
      .update(validUpdates)
      .eq('id', Number(addressId))
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      throw error;
    }
    return mapDbAddressToSavedAddress(data as DbAddress) as SavedAddress;
  },

  deleteAddress: async (addressId: string): Promise<void> => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', Number(addressId)); 

    if (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  },

  getDefaultFromAddress: async (): Promise<SavedAddress | null> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return null;
    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default_from', true)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { 
      console.error('Error fetching default from address:', error);
      throw error;
    }
    return mapDbAddressToSavedAddress(data as DbAddress);
  },

  setDefaultFromAddress: async (addressId: string): Promise<SavedAddress> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) throw new Error('User not authenticated');
    const userId = sessionData.session.user.id;

    // Clear existing defaults first
    await supabase
      .from('addresses')
      .update({ is_default_from: false })
      .eq('user_id', userId);

    // Set new default
    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default_from: true })
      .eq('id', Number(addressId))
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error setting default from address:', error);
      throw error;
    }
    
    return mapDbAddressToSavedAddress(data as DbAddress) as SavedAddress;
  },

  getDefaultToAddress: async (): Promise<SavedAddress | null> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) return null;
    const userId = sessionData.session.user.id;
    
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default_to', true)
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching default to address:', error);
      throw error;
    }
    return mapDbAddressToSavedAddress(data as DbAddress);
  },

  setDefaultToAddress: async (addressId: string): Promise<SavedAddress> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) throw new Error('User not authenticated');
    const userId = sessionData.session.user.id;

    // Clear existing defaults first
    await supabase
      .from('addresses')
      .update({ is_default_to: false })
      .eq('user_id', userId);

    // Set new default
    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default_to: true })
      .eq('id', Number(addressId))
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error setting default to address:', error);
      throw error;
    }
    
    return mapDbAddressToSavedAddress(data as DbAddress) as SavedAddress;
  },

  getAddressById: async (addressId: string): Promise<SavedAddress | null> => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', Number(addressId))
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching address by id ${addressId}:`, error);
      throw error;
    }
    return mapDbAddressToSavedAddress(data as DbAddress);
  },
};

// Export the SavedAddress type for external use
export type { SavedAddress };
