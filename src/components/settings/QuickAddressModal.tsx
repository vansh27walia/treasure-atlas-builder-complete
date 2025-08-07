
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';

interface QuickAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressSaved: (address: SavedAddress) => void;
}

const QuickAddressModal: React.FC<QuickAddressModalProps> = ({
  open,
  onOpenChange,
  onAddressSaved
}) => {
  const [formData, setFormData] = useState({
    label: '',
    firstName: '',
    lastName: '',
    company: '',
    addressAutocomplete: '',
    addressLine2: '',
    phone: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    
    if (!formData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }
    
    if (!formData.addressAutocomplete.trim()) {
      toast.error('Address is required');
      return;
    }

    setIsLoading(true);

    try {
      // Create the address object
      const addressData = {
        label: formData.label.trim() || undefined,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        company: formData.company.trim() || undefined,
        street1: formData.addressAutocomplete.trim(),
        street2: formData.addressLine2.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        // Parse city, state, zip from address (simplified - would need Google Places integration for full parsing)
        city: '',
        state: '',
        zip: '',
        country: 'US',
        is_default_from: false,
        is_default_to: false
      };

      // Save the address using createAddress method
      const savedAddress = await addressService.createAddress(addressData);
      
      if (savedAddress) {
        // Call the callback to update the parent component
        onAddressSaved(savedAddress);
        
        // Reset form
        setFormData({
          label: '',
          firstName: '',
          lastName: '',
          company: '',
          addressAutocomplete: '',
          addressLine2: '',
          phone: ''
        });
        
        // Close modal
        onOpenChange(false);
        
        toast.success('Address saved successfully');
      }
      
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      label: '',
      firstName: '',
      lastName: '',
      company: '',
      addressAutocomplete: '',
      addressLine2: '',
      phone: ''
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Save Address</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Label */}
          <div>
            <Label htmlFor="label">Label (special)</Label>
            <Input
              id="label"
              placeholder="Nickname or special note (optional)"
              value={formData.label}
              onChange={(e) => handleInputChange('label', e.target.value)}
            />
          </div>

          {/* First Name - Required */}
          <div>
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
            />
          </div>

          {/* Last Name - Required */}
          <div>
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
            />
          </div>

          {/* Company Name - Optional */}
          <div>
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              placeholder="Company name (optional)"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
            />
          </div>

          {/* Address with Google Autocomplete - Required */}
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="Start typing address..."
              value={formData.addressAutocomplete}
              onChange={(e) => handleInputChange('addressAutocomplete', e.target.value)}
              required
            />
          </div>

          {/* Address 2 - Optional */}
          <div>
            <Label htmlFor="address2">Address 2</Label>
            <Input
              id="address2"
              placeholder="Apartment, suite, etc. (optional)"
              value={formData.addressLine2}
              onChange={(e) => handleInputChange('addressLine2', e.target.value)}
            />
          </div>

          {/* Phone Number - Optional */}
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              placeholder="Phone number (optional)"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddressModal;
