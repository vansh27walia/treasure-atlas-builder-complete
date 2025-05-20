import { supabase } from '@/integrations/supabase/client';

export interface PickupAddress {
  id?: number;
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
}

export class PickupAddressService {
  /**
   * Get all saved addresses for the current user
   */
  public async getSavedAddresses(): Promise<PickupAddress[]> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('is_default_from', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data as unknown as PickupAddress[] || [];
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
      return [];
    }
  }
  
  /**
   * Alias for getSavedAddresses to maintain compatibility
   */
  public async getAddresses(): Promise<PickupAddress[]> {
    return this.getSavedAddresses();
  }
  
  /**
   * Get the default pickup address for the current user
   */
  public async getDefaultAddress(): Promise<PickupAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.session.user.id)
        .eq('is_default_from', true)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      return data as unknown as PickupAddress | null;
    } catch (error) {
      console.error('Error fetching default address:', error);
      return null;
    }
  }
  
  /**
   * Create a new address
   */
  public async createAddress(address: PickupAddress): Promise<PickupAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const { data, error } = await supabase.functions.invoke('create-address', {
        body: {
          address,
          userId: session.session.user.id
        }
      });
      
      if (error || !data.success) {
        throw error || new Error('Failed to create address');
      }
      
      return data.address;
    } catch (error) {
      console.error('Error creating address:', error);
      return null;
    }
  }
  
  /**
   * Update an existing address
   */
  public async updateAddress(id: number, address: PickupAddress): Promise<PickupAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // First verify that the address belongs to the user
      const { data: existingAddress, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.session.user.id)
        .single();
      
      if (fetchError || !existingAddress) {
        throw new Error('Address not found or you do not have permission to update it');
      }
      
      const { data, error } = await supabase
        .from('addresses')
        .update({
          name: address.name,
          company: address.company,
          street1: address.street1,
          street2: address.street2,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country,
          phone: address.phone,
          is_default_from: address.is_default_from
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // If this is set as default, update any other addresses
      if (address.is_default_from) {
        await supabase
          .from('addresses')
          .update({ is_default_from: false })
          .neq('id', id)
          .eq('user_id', session.session.user.id);
      }
      
      return data as unknown as PickupAddress;
    } catch (error) {
      console.error('Error updating address:', error);
      return null;
    }
  }
  
  /**
   * Delete an address
   */
  public async deleteAddress(id: number): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      return false;
    }
  }
  
  /**
   * Set an address as default
   */
  public async setDefaultAddress(id: number): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // First, unset any existing default
      await supabase
        .from('addresses')
        .update({ is_default_from: false })
        .eq('user_id', session.session.user.id)
        .eq('is_default_from', true);
      
      // Then set the new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default_from: true })
        .eq('id', id)
        .eq('user_id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error setting default address:', error);
      return false;
    }
  }
}

export const pickupAddressService = new PickupAddressService();
