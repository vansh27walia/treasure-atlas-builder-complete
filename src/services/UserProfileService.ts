
import { supabase } from '@/integrations/supabase/client';
import { SavedAddress } from './AddressService';

export interface UserProfile {
  id: string;
  home_address?: HomeAddress;
  default_pickup_address_id?: number;
  payment_info?: PaymentInfo;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

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

export class UserProfileService {
  /**
   * Get the current user's profile
   */
  public async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.session.user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Cast and transform the data to match our UserProfile interface
      if (data) {
        // Safely cast the JSON fields by first checking if they exist and are objects
        const homeAddress = data.home_address ? 
          data.home_address as Record<string, any> : undefined;
        
        const paymentInfo = data.payment_info ? 
          data.payment_info as Record<string, any> : undefined;
        
        return {
          id: data.id,
          home_address: homeAddress as HomeAddress | undefined,
          default_pickup_address_id: data.default_pickup_address_id,
          payment_info: paymentInfo as PaymentInfo | undefined,
          onboarding_completed: data.onboarding_completed || false,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  /**
   * Check if the current user has completed onboarding
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
   * Update the user's home address
   */
  public async updateHomeAddress(homeAddress: HomeAddress): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return false;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          home_address: homeAddress as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating home address:', error);
      return false;
    }
  }
  
  /**
   * Update the user's payment information
   */
  public async updatePaymentInfo(paymentInfo: PaymentInfo): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return false;
      }
      
      // Add last4 and mask full card number for security
      const last4 = paymentInfo.card_number.slice(-4);
      const paymentData = {
        ...paymentInfo,
        last4,
        // Don't store full card number in database, just for demo purposes
        card_number: `XXXX-XXXX-XXXX-${last4}`
      };
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          payment_info: paymentData as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating payment info:', error);
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
        return false;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          default_pickup_address_id: addressId,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error updating default pickup address:', error);
      return false;
    }
  }
  
  /**
   * Complete the onboarding process
   */
  public async completeOnboarding(): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        return false;
      }
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.session.user.id);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }
}

export const userProfileService = new UserProfileService();
