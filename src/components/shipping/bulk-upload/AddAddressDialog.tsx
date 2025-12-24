import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddressForm, { AddressFormValues } from '@/components/shipping/AddressForm';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (created: SavedAddress) => void;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const AddAddressDialog: React.FC<AddAddressDialogProps> = ({ open, onOpenChange, onSaved, isSaving, setIsSaving }) => {
  const handleSubmit = async (values: AddressFormValues) => {
    try {
      setIsSaving(true);
      const created = await addressService.createAddress({
        name: values.name || '',
        company: values.company || '',
        street1: values.street1,
        street2: values.street2 || '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        phone: values.phone || '',
        is_default_from: !!values.is_default_from,
        is_default_to: !!values.is_default_to,
      }, false);
      if (created) {
        toast.success('Address saved');
        onSaved(created);
        onOpenChange(false);
      }
    } catch (e) {
      console.error('Failed to save address', e);
      toast.error('Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent closing when clicking on Google Places autocomplete dropdown
          const target = e.target as HTMLElement;
          if (target.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Pickup Address</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <AddressForm onSubmit={handleSubmit} isPickupAddress showDefaultOptions buttonText={isSaving ? 'Saving...' : 'Save Address'} enableGoogleAutocomplete={true} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddAddressDialog;
