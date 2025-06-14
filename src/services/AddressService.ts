
import { supabase } from '@/integrations/supabase/client';

export interface SavedAddress {
  id: string; // Changed to string for consistency
  user_id?: string;
  name?: string | null;
  company?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string; 
  phone?: string | null;
  email?: string | null; // Added email field
  is_default_from?: boolean;
  is_default_to?: boolean;
  created_at?: string;
  updated_at?: string;
  address_type?: 'residential' | 'commercial' | string | null;
  is_residential?: boolean; // Added is_residential field
  validate_address?: boolean;
}

export class AddressService {
  /**
   * Get the current user session
   */
  public async getSession() {
    return await supabase.auth.getSession();
  }
  
  /**
   * Ensure user exists in the users table
   */
  private async ensureUserExists() {
    try {
      const { data: session } = await this.getSession();
      if (!session?.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const user = session.session.user;
      
      // Check if user exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      // If user doesn't exist, create them
      if (!existingUser) {
        console.log('Creating user record in users table');
        
        try {
          // Try to create user through the edge function to bypass RLS
          await this.createUserViaEdgeFunction(user.id, user.email!);
          return true;
        } catch (edgeFunctionError) {
          console.error('Error creating user via edge function:', edgeFunctionError);
          
          // Try direct insertion as fallback
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email
            });
          
          if (insertError) {
            console.warn('Failed to create user record directly:', insertError);
            throw insertError;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      throw error;
    }
  }
  
  /**
   * Create user via edge function
   */
  private async createUserViaEdgeFunction(userId: string, email: string) {
    try {
      // Create a temporary address that will be used just to ensure user creation
      // We'll delete this later
      const { data, error } = await supabase.functions.invoke('update-address-encryption', {
        body: {
          action: 'encrypt',
          addressData: {
            user_id: userId,
            name: 'Temporary Address',
            street1: 'To Be Updated',
            city: 'To Be Updated',
            state: 'NA',
            zip: '00000',
            country: 'US',
            is_default_from: false,
            is_default_to: false
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // If we got here, the user was created successfully via the edge function
      // Now we can delete the temporary address
      if (data && data.data && data.data.id) {
        await this.deleteAddress(data.data.id);
      }
    } catch (error) {
      console.error('Error creating user via edge function:', error);
      throw error;
    }
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
      // Convert database records to SavedAddress format
      return (data || []).map(addr => ({
        ...addr,
        id: String(addr.id), // Convert id to string
        email: addr.email || null,
        is_residential: addr.is_residential || false
      })) as SavedAddress[];
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
      
      const userId = session.session.user.id;
      
      console.log('Creating address with user ID:', userId);
      console.log('Address data:', address);
      
      // Ensure required fields are never undefined
      const addressData = {
        ...address,
        phone: address.phone || '',
        email: address.email || '',
        is_residential: address.is_residential || false
      };
      
      // Before proceeding, try to ensure the user exists in the users table
      try {
        await this.ensureUserExists();
      } catch (userError) {
        console.warn('Could not ensure user exists, but will try to create address anyway:', userError);
      }
      
      if (useEncryption) {
        // Use edge function for encryption
        console.log('Creating address using edge function with encryption');
        const { data, error } = await supabase.functions.invoke('update-address-encryption', {
          body: {
            action: 'encrypt',
            addressData: {
              ...addressData,
              user_id: userId
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
        return {
          ...data.data,
          id: String(data.data.id), // Ensure id is string
          email: data.data.email || null,
          is_residential: data.data.is_residential || false
        } as SavedAddress;
      } else {
        // Use standard approach without encryption
        console.log('Creating address using standard approach');
        
        const { data, error } = await supabase
          .from('addresses')
          .insert({
            ...addressData,
            user_id: userId
          })
          .select();
        
        if (error) {
          console.error('Supabase error creating address:', error);
          throw error;
        }
        
        console.log('Address created via direct insertion:', data);
        return {
          ...data[0],
          id: String(data[0].id), // Convert id to string
          email: data[0].email || null,
          is_residential: data[0].is_residential || false
        } as SavedAddress;
      }
    } catch (error) {
      console.error('Error creating saved address:', error);
      throw error; // Re-throw to handle in the UI layer
    }
  }
  
  /**
   * Update an existing address
   */
  public async updateAddress(addressId: string, address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>, useEncryption: boolean = false): Promise<SavedAddress | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // Ensure required fields are never undefined
      const addressData = {
        ...address,
        phone: address.phone || '',
        email: address.email || '',
        is_residential: address.is_residential || false
      };
      
      // First verify that the address belongs to the user
      const { data: existingAddress, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('id', parseInt(addressId)) // Convert string id back to number for database query
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
            addressId: parseInt(addressId),
            addressData: addressData
          }
        });
        
        if (error) {
          throw error;
        }
        
        return {
          ...data.data,
          id: String(data.data.id), // Ensure id is string
          email: data.data.email || null,
          is_residential: data.data.is_residential || false
        } as SavedAddress;
      } else {
        // Standard address update
        const { data, error } = await supabase
          .from('addresses')
          .update({
            ...addressData,
            // Ensure user_id remains unchanged
            user_id: session.session.user.id
          })
          .eq('id', parseInt(addressId)) // Convert string id back to number for database query
          .select();
        
        if (error) {
          throw error;
        }
        
        return {
          ...data[0],
          id: String(data[0].id), // Convert id to string
          email: data[0].email || null,
          is_residential: data[0].is_residential || false
        } as SavedAddress;
      }
    } catch (error) {
      console.error('Error updating saved address:', error);
      throw error;
    }
  }
  
  /**
   * Delete a saved address
   */
  public async deleteAddress(addressId: string): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      // Delete the address
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', parseInt(addressId)) // Convert string id back to number for database query
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
  public async setDefaultFromAddress(addressId: string): Promise<boolean> {
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
        .eq('id', parseInt(addressId)) // Convert string id back to number for database query
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
  public async setDefaultToAddress(addressId: string): Promise<boolean> {
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
        .eq('id', parseInt(addressId)) // Convert string id back to number for database query
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
      
      if (!data) return null;
      
      return {
        ...data,
        id: String(data.id), // Convert id to string
        email: data.email || null,
        is_residential: data.is_residential || false
      } as SavedAddress;
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
      
      if (!data) return null;
      
      return {
        ...data,
        id: String(data.id), // Convert id to string
        email: data.email || null,
        is_residential: data.is_residential || false
      } as SavedAddress;
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
