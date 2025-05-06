
import { SavedAddress } from './AddressTypes';
import { addressRetrievalService } from './AddressRetrievalService';
import { addressMutationService } from './AddressMutationService';
import { defaultAddressService } from './DefaultAddressService';

/**
 * Main address service that combines all address operations
 */
export class AddressService {
  /**
   * Get all saved addresses for the current user
   */
  public async getSavedAddresses(): Promise<SavedAddress[]> {
    return addressRetrievalService.getSavedAddresses();
  }
  
  /**
   * Create a new saved address
   */
  public async createAddress(address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>): Promise<SavedAddress | null> {
    return addressMutationService.createAddress(address);
  }
  
  /**
   * Update an existing address
   */
  public async updateAddress(addressId: number, address: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'>): Promise<SavedAddress | null> {
    return addressMutationService.updateAddress(addressId, address);
  }
  
  /**
   * Delete a saved address
   */
  public async deleteAddress(addressId: number): Promise<boolean> {
    return addressMutationService.deleteAddress(addressId);
  }
  
  /**
   * Set an address as the default shipping from address
   */
  public async setDefaultFromAddress(addressId: number): Promise<boolean> {
    return defaultAddressService.setDefaultFromAddress(addressId);
  }
  
  /**
   * Set an address as the default shipping to address
   */
  public async setDefaultToAddress(addressId: number): Promise<boolean> {
    return defaultAddressService.setDefaultToAddress(addressId);
  }
  
  /**
   * Get the default shipping from address for the current user
   */
  public async getDefaultFromAddress(): Promise<SavedAddress | null> {
    return addressRetrievalService.getDefaultFromAddress();
  }
  
  /**
   * Get the default shipping to address for the current user
   */
  public async getDefaultToAddress(): Promise<SavedAddress | null> {
    return addressRetrievalService.getDefaultToAddress();
  }
}

export const addressService = new AddressService();
export type { SavedAddress };
