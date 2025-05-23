import { supabase } from '@/integrations/supabase/client';

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

export class AddressService {
  /**
   * Get the current user session
   */
  public async getSession() {
    return await supabase.auth.getSession();
  }
  
  /**
   * Get all saved addresses for the current user
   */
  public async getSavedAddresses(): Promise<SavedAddress[]> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.warn('User is not authenticated when getting addresses');
        return [];
      }
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.session.user.id)
        .order('is_default_from', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error fetching addresses:', error);
        throw error;
      }
      
      console.log('Fetched addresses:', data);
      return data as SavedAddress[] || [];
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
      return [];
    }
  }
  
  /**
   * Create a new saved address with optional encryption
   */
  public async createAddress(address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>, useEncryption: boolean = false): Promise<SavedAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        console.error('User is not authenticated when creating address');
        throw new Error('User is not authenticated');
      }
      
      console.log('Creating address with user ID:', session.session.user.id);
      console.log('Address data:', address);
      
      if (useEncryption) {
        // Use edge function to create encrypted address
        const { data, error } = await supabase.functions.invoke('update-address-encryption', {
          body: {
            action: 'encrypt',
            addressData: {
              ...address,
              user_id: session.session.user.id
            }
          }
        });
        
        if (error) {
          console.error('Supabase functions error:', error);
          throw error;
        }
        
        if (!data?.data) {
          console.error('No data returned from edge function');
          throw new Error('No data returned from function');
        }
        
        console.log('Address created via edge function:', data.data);
        return data.data as SavedAddress;
      } else {
        // Standard address creation
        const { data, error } = await supabase
          .from('addresses')
          .insert({
            ...address,
            user_id: session.session.user.id
          })
          .select();
        
        if (error) {
          console.error('Supabase error creating address:', error);
          throw error;
        }
        
        console.log('Address created via direct insertion:', data);
        return data[0] as SavedAddress;
      }
    } catch (error) {
      console.error('Error creating saved address:', error);
      throw error; // Re-throw to handle in the UI layer
    }
  }
  
  /**
   * Update an existing address
   */
  public async updateAddress(addressId: number, address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>, useEncryption: boolean = false): Promise<SavedAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // First verify that the address belongs to the user
      const { data: existingAddress, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', session.session.user.id)
        .single();
      
      if (fetchError || !existingAddress) {
        throw new Error('Address not found or you do not have permission to update it');
      }
      
      if (useEncryption) {
        // Use edge function to update with encryption
        const { data, error } = await supabase.functions.invoke('update-address-encryption', {
          body: {
            action: 'update',
            addressId,
            addressData: address
          }
        });
        
        if (error) {
          throw error;
        }
        
        return data.data as SavedAddress;
      } else {
        // Standard address update
        const { data, error } = await supabase
          .from('addresses')
          .update({
            ...address,
            // Ensure user_id remains unchanged
            user_id: session.session.user.id
          })
          .eq('id', addressId)
          .select();
        
        if (error) {
          throw error;
        }
        
        return data[0] as SavedAddress;
      }
    } catch (error) {
      console.error('Error updating saved address:', error);
      throw error;
    }
  }
  
  /**
   * Delete a saved address
   */
  public async deleteAddress(addressId: number): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // Delete the address
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting saved address:', error);
      return false;
    }
  }
  
  /**
   * Set an address as the default shipping from address
   */
  public async setDefaultFromAddress(addressId: number): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // First, unset any existing default
      const { error: updateError } = await supabase
        .from('addresses')
        .update({ is_default_from: false })
        .eq('user_id', session.session.user.id)
        .eq('is_default_from', true);
      
      if (updateError) {
        throw updateError;
      }
      
      // Then set the new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default_from: true })
        .eq('id', addressId)
        .eq('user_id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error setting default from address:', error);
      return false;
    }
  }
  
  /**
   * Set an address as the default shipping to address
   */
  public async setDefaultToAddress(addressId: number): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // First, unset any existing default
      await supabase
        .from('addresses')
        .update({ is_default_to: false })
        .eq('user_id', session.session.user.id)
        .eq('is_default_to', true);
      
      // Then set the new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default_to: true })
        .eq('id', addressId)
        .eq('user_id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error setting default to address:', error);
      return false;
    }
  }
  
  /**
   * Get the default shipping from address for the current user
   */
  public async getDefaultFromAddress(): Promise<SavedAddress | null> {
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
      
      return data as SavedAddress | null;
    } catch (error) {
      console.error('Error fetching default from address:', error);
      return null;
    }
  }
  
  /**
   * Get the default shipping to address for the current user
   */
  public async getDefaultToAddress(): Promise<SavedAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', session.session.user.id)
        .eq('is_default_to', true)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      return data as SavedAddress | null;
    } catch (error) {
      console.error('Error fetching default to address:', error);
      return null;
    }
  }
  
  /**
   * Count user's saved addresses
   */
  public async countUserAddresses(): Promise<number> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        return 0;
      }
      
      const { count, error } = await supabase
        .from('addresses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error counting user addresses:', error);
      return 0;
    }
  }
}

export const addressService = new AddressService();
