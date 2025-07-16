import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface HomeAddress {
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface PaymentInfo {
  card_number: string;
  exp_month: string;
  exp_year: string;
  cardholder_name: string;
  last4: string;
  brand?: string;
}

export interface UserProfile {
  id: string;
  default_pickup_address_id?: number;
  home_address?: HomeAddress;
  created_at?: string;
  updated_at?: string;
  onboarding_completed: boolean;
  payment_info?: PaymentInfo;
  shopify_store_url?: string;
  shopify_access_token?: string;
}

// Type for the raw data received from Supabase database
interface UserProfileRaw {
  id: string;
  default_pickup_address_id?: number;
  home_address: Json;
  created_at?: string;
  updated_at?: string;
  onboarding_completed: boolean;
  payment_info: Json;
  shopify_store_url?: string;
  shopify_access_token?: string;
}

export class UserProfileService {
  /**
   * Get the user profile for the current user
   */
  public async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return null;
      }
      
      const userId = session.session.user.id;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error getting user profile:', error);
        return null;
      }
      
      // Convert the raw data to the UserProfile type
      if (data) {
        const rawProfile = data as unknown as UserProfileRaw;
        return {
          id: rawProfile.id,
          default_pickup_address_id: rawProfile.default_pickup_address_id,
          home_address: rawProfile.home_address as unknown as HomeAddress,
          created_at: rawProfile.created_at,
          updated_at: rawProfile.updated_at,
          onboarding_completed: rawProfile.onboarding_completed || false,
          payment_info: rawProfile.payment_info as unknown as PaymentInfo,
          shopify_store_url: rawProfile.shopify_store_url,
          shopify_access_token: rawProfile.shopify_access_token,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
  
  /**
   * Create a user profile for a new user
   */
  public async createUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const userId = session.session.user.id;
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        // Convert to UserProfile type before returning
        const rawProfile = existingProfile as unknown as UserProfileRaw;
        return {
          id: rawProfile.id,
          default_pickup_address_id: rawProfile.default_pickup_address_id,
          home_address: rawProfile.home_address as unknown as HomeAddress,
          created_at: rawProfile.created_at,
          updated_at: rawProfile.updated_at,
          onboarding_completed: rawProfile.onboarding_completed || false,
          payment_info: rawProfile.payment_info as unknown as PaymentInfo,
        };
      }
      
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          onboarding_completed: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }
      
      // Convert to UserProfile type before returning
      return {
        id: data.id,
        default_pickup_address_id: data.default_pickup_address_id,
        home_address: data.home_address as unknown as HomeAddress,
        created_at: data.created_at,
        updated_at: data.updated_at,
        onboarding_completed: data.onboarding_completed || false,
        payment_info: data.payment_info as unknown as PaymentInfo,
      };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }
  
  /**
   * Mark the onboarding process as completed for the current user
   */
  public async completeOnboarding(): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const userId = session.session.user.id;
      
      // Ensure the user profile exists
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.createUserProfile();
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }
  
  /**
   * Check if the user has completed onboarding
   */
  public async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      return profile?.onboarding_completed || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }
  
  /**
   * Update the default pickup address ID
   */
  public async updateDefaultPickupAddressId(addressId: number): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const userId = session.session.user.id;
      
      // Create the profile if it doesn't exist
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.createUserProfile();
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          default_pickup_address_id: addressId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating default pickup address:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating default pickup address:', error);
      return false;
    }
  }

  /**
   * Update the home address
   */
  public async updateHomeAddress(homeAddress: HomeAddress): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const userId = session.session.user.id;
      
      // Create the profile if it doesn't exist
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.createUserProfile();
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          home_address: homeAddress as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating home address:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating home address:', error);
      return false;
    }
  }

  /**
   * Update the payment information
   */
  public async updatePaymentInfo(paymentInfo: PaymentInfo): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const userId = session.session.user.id;
      
      // Create the profile if it doesn't exist
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.createUserProfile();
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          payment_info: paymentInfo as unknown as Json,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating payment info:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating payment info:', error);
      return false;
    }
  }

  /**
   * Update the Shopify store information
   */
  public async updateShopifyInfo(storeUrl: string, accessToken?: string): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('User is not authenticated');
      }
      
      const userId = session.session.user.id;
      
      // Create the profile if it doesn't exist
      const profile = await this.getUserProfile();
      if (!profile) {
        await this.createUserProfile();
      }
      
      const updateData: any = {
        shopify_store_url: storeUrl,
        updated_at: new Date().toISOString()
      };
      
      if (accessToken) {
        updateData.shopify_access_token = accessToken;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating Shopify info:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating Shopify info:', error);
      return false;
    }
  }
}

export const userProfileService = new UserProfileService();
