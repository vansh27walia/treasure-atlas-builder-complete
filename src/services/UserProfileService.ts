
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  default_pickup_address_id?: number;
  home_address?: any;
  created_at?: string;
  updated_at?: string;
  onboarding_completed: boolean;
  payment_info?: any;
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
      
      return data as UserProfile;
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
        return existingProfile as UserProfile;
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
      
      return data as UserProfile;
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
}

export const userProfileService = new UserProfileService();
