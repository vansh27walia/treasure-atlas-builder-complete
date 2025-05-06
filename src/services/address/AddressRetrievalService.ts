
import { supabase } from '@/integrations/supabase/client';
import { SavedAddress } from './AddressTypes';

/**
 * Retrieves saved addresses from the database
 */
export class AddressRetrievalService {
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
      
      return data as unknown as SavedAddress | null;
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
      
      return data as unknown as SavedAddress | null;
    } catch (error) {
      console.error('Error fetching default to address:', error);
      return null;
    }
  }
}

export const addressRetrievalService = new AddressRetrievalService();
