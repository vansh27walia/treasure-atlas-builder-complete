
import { supabase } from '@/integrations/supabase/client';

export interface SavedAddress {
  id: string;
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
  is_default: boolean;
  created_at: string;
}

export class AddressService {
  /**
   * Get all saved addresses for the current user
   */
  public async getSavedAddresses(): Promise<SavedAddress[]> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const { data, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
      return [];
    }
  }
  
  /**
   * Create a new saved address
   */
  public async createAddress(address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>): Promise<SavedAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const { data, error } = await supabase
        .from('saved_addresses')
        .insert({
          ...address,
          user_id: session.session.user.id
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error creating saved address:', error);
      return null;
    }
  }
  
  /**
   * Delete a saved address
   */
  public async deleteAddress(addressId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_addresses')
        .delete()
        .eq('id', addressId);
      
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
   * Set an address as the default
   */
  public async setDefaultAddress(addressId: string): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // First, unset any existing default
      await supabase
        .from('saved_addresses')
        .update({ is_default: false })
        .eq('user_id', session.session.user.id)
        .eq('is_default', true);
      
      // Then set the new default
      const { error } = await supabase
        .from('saved_addresses')
        .update({ is_default: true })
        .eq('id', addressId);
      
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

export const addressService = new AddressService();
