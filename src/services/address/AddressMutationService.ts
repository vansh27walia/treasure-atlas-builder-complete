import { supabase } from '@/integrations/supabase/client';
import { SavedAddress } from './AddressTypes';

/**
 * Handles creation, updating and deletion of addresses
 */
export class AddressMutationService {
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
   * Update an existing address
   */
  public async updateAddress(addressId: number, address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>): Promise<SavedAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
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
      
      const { data, error } = await supabase
        .from('addresses')
        .update({
          ...address,
          // Ensure user_id remains unchanged
          user_id: session.session.user.id
        })
        .eq('id', addressId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data as unknown as SavedAddress;
    } catch (error) {
      console.error('Error updating saved address:', error);
      return null;
    }
  }
  
  /**
   * Delete a saved address
   */
  public async deleteAddress(addressId: number): Promise<boolean> {
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
}

export const addressMutationService = new AddressMutationService();
