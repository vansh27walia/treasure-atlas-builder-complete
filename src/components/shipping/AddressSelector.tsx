
import React, { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { SavedAddress } from '@/utils/addressUtils';

interface AddressSelectionProps {
  form?: any; // The form instance from useForm
  onAddressSelect?: (address: any) => void;
  type?: string; // Added type prop for "from" or "to" address
  selectedAddressId?: string | number; // Added for selected address tracking
  useGoogleAutocomplete?: boolean; // Flag to indicate if Google autocomplete should be used
}

// Exporting named component instead of default
export const AddressSelector: React.FC<AddressSelectionProps> = ({
  form,
  onAddressSelect,
  type, // New type prop
  selectedAddressId,
  useGoogleAutocomplete = false // Default to false
}) => {
  // State for manual form inputs
  const [addressData, setAddressData] = useState({
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  // Handle address input change
  const handleInputChange = (field: string, value: string) => {
    setAddressData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle manual address input
  const handleAddressInput = (addressData: Partial<SavedAddress>) => {
    try {
      // Update form values with entered address components
      if (addressData.street1 && form) form.setValue('street1', addressData.street1, { shouldValidate: true });
      if (addressData.city && form) form.setValue('city', addressData.city, { shouldValidate: true });
      if (addressData.state && form) form.setValue('state', addressData.state, { shouldValidate: true });
      if (addressData.zip && form) form.setValue('zip', addressData.zip, { shouldValidate: true });
      if (addressData.country && form) form.setValue('country', addressData.country, { shouldValidate: true });
      
      // Trigger form validation
      if (form) form.trigger(['street1', 'city', 'state', 'zip', 'country']);
      
      // Submit form values if all required fields are populated
      if (addressData.street1 && addressData.city && 
          addressData.state && addressData.zip) {
        if (onAddressSelect) {
          const values = form ? form.getValues() : addressData;
          onAddressSelect(values);
        }
      }
    } catch (error) {
      console.error('Error processing address input:', error);
      toast.error('Failed to process address. Please try again.');
    }
  };

  // Submit the entered address
  const submitAddress = () => {
    handleAddressInput(addressData);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        {type === 'from' ? 'Enter pickup address details:' : 'Enter destination address details:'}
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor={`${type}-street1`}>Address Line 1</Label>
          <Input
            id={`${type}-street1`}
            value={addressData.street1}
            onChange={(e) => handleInputChange('street1', e.target.value)}
            placeholder="Street address"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <Label htmlFor={`${type}-city`}>City</Label>
            <Input
              id={`${type}-city`}
              value={addressData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City"
            />
          </div>
          
          <div className="col-span-1">
            <Label htmlFor={`${type}-state`}>State</Label>
            <Input
              id={`${type}-state`}
              value={addressData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
            />
          </div>
          
          <div className="col-span-1">
            <Label htmlFor={`${type}-zip`}>ZIP</Label>
            <Input
              id={`${type}-zip`}
              value={addressData.zip}
              onChange={(e) => handleInputChange('zip', e.target.value)}
              placeholder="ZIP Code"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="button" 
            size="sm" 
            onClick={submitAddress}
          >
            Use This Address
          </Button>
        </div>
      </div>
    </div>
  );
};

// Also export as default for backward compatibility
export default AddressSelector;
