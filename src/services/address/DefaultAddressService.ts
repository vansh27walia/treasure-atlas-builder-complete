
import { supabase } from '@/integrations/supabase/client';

/**
 * Manages default address settings
 */
export class DefaultAddressService {
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

export const defaultAddressService = new DefaultAddressService();
