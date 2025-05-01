
import { supabase } from '@/integrations/supabase/client';

export interface SavedAddress {
  id: number; // Changed from string to number to match Supabase table structure
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
   * Get all saved addresses for the current user
   */
  public async getSavedAddresses(): Promise<SavedAddress[]> {
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
      
      return data as unknown as SavedAddress[] || [];
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
        .from('addresses')
        .insert({
          ...address,
          user_id: session.session.user.id
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as unknown as SavedAddress;
    } catch (error) {
      console.error('Error creating saved address:', error);
      return null;
    }
  }
  
  /**
   * Delete a saved address
   */
  public async deleteAddress(addressId: number): Promise<boolean> { // Changed parameter type from string to number
    try {
      const { error } = await supabase
        .from('addresses')
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
   * Set an address as the default shipping from address
   */
  public async setDefaultFromAddress(addressId: number): Promise<boolean> { // Changed parameter type from string to number
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
        .eq('id', addressId);
      
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
  public async setDefaultToAddress(addressId: number): Promise<boolean> { // Changed parameter type from string to number
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
        .eq('id', addressId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error setting default to address:', error);
      return false;
    }
  }
}

export const addressService = new AddressService();
