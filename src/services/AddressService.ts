
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
    name: dbAddress.name ?? undefined,
    company: dbAddress.company ?? undefined,
    street1: dbAddress.street1,
    street2: dbAddress.street2 ?? undefined,
    city: dbAddress.city,
    state: dbAddress.state,
    zip: dbAddress.zip,
    country: dbAddress.country,
    phone: dbAddress.phone ?? undefined,
    email: dbAddress.email ?? undefined,
    is_residential: dbAddress.is_residential ?? undefined,
    is_default_from: dbAddress.is_default_from ?? undefined,
    is_default_to: dbAddress.is_default_to ?? undefined,
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
    
    const { id, ...addressToInsert } = { ...address, user_id: userId };

    const { data, error } = await supabase
      .from('addresses')
      .insert(addressToInsert as Omit<DbAddress, 'id' | 'created_at' | 'updated_at'>)
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
      .single();

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

    // Ensure DB functions exist or handle this logic in JS if preferred
    await supabase.rpc('transaction_set_default_from_address' as any, {
        p_user_id: userId,
        p_address_id: Number(addressId) 
    });
    
    const updatedAddress = await addressService.getAddressById(addressId);
    if (!updatedAddress) throw new Error("Failed to retrieve updated default address");
    return updatedAddress;
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
      .single();

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

    await supabase.rpc('transaction_set_default_to_address' as any, {
        p_user_id: userId,
        p_address_id: Number(addressId)
    });
    
    const updatedAddress = await addressService.getAddressById(addressId);
    if (!updatedAddress) throw new Error("Failed to retrieve updated default address");
    return updatedAddress;
  },

  // Helper function to get a single address by ID (string)
  getAddressById: async (addressId: string): Promise<SavedAddress | null> => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', Number(addressId))
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`Error fetching address by id ${addressId}:`, error);
      throw error;
    }
    return mapDbAddressToSavedAddress(data as DbAddress);
  },
};
