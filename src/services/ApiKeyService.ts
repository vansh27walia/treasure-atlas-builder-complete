
import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'batch-label-processing-key-2025'; // In production, this should be from environment

export class ApiKeyService {
  static async saveApiKey(serviceName: string, apiKey: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Encrypt the API key
      const encryptedKey = CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();

      // Check if key already exists for this service
      const { data: existingKey } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('service_name', serviceName)
        .single();

      if (existingKey) {
        // Update existing key
        const { error } = await supabase
          .from('api_keys')
          .update({ 
            encrypted_key: encryptedKey,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingKey.id);
        
        if (error) throw error;
      } else {
        // Insert new key
        const { error } = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            service_name: serviceName,
            encrypted_key: encryptedKey
          });
        
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }

  static async getApiKey(serviceName: string): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('api_keys')
        .select('encrypted_key')
        .eq('user_id', user.id)
        .eq('service_name', serviceName)
        .single();

      if (error || !data) return null;

      // Decrypt the API key
      const decryptedBytes = CryptoJS.AES.decrypt(data.encrypted_key, ENCRYPTION_KEY);
      return decryptedBytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error retrieving API key:', error);
      return null;
    }
  }

  static async deleteApiKey(serviceName: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('service_name', serviceName);

      return !error;
    } catch (error) {
      console.error('Error deleting API key:', error);
      return false;
    }
  }
}
