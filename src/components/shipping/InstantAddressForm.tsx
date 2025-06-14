import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SavedAddress } from '@/types/shipping';
import { addressService } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import AddressFormFields from './AddressFormFields';

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  zip: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  is_residential: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface InstantAddressFormProps {
  addressType: 'from' | 'to';
  onAddressSubmit: (address: SavedAddress) => void;
  onCancel?: () => void;
  initialData?: Partial<SavedAddress>;
  isLoading?: boolean;
}

const InstantAddressForm: React.FC<InstantAddressFormProps> = ({
  addressType,
  onAddressSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const [saveAddress, setSaveAddress] = useState(true);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: 'US',
      is_residential: true,
      ...initialData,
    },
  });

  const processSubmit = async (data: AddressFormData) => {
    const addressPayload: Omit<SavedAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      ...data,
      is_default_from: addressType === 'from' && saveAddress ? true : undefined,
      is_default_to: addressType === 'to' && saveAddress ? true : undefined,
    };

    try {
      if (saveAddress) {
        const savedAddress = await addressService.addAddress(addressPayload);
        toast.success(`${addressType === 'from' ? 'Sender' : 'Recipient'} address saved and selected.`);
        onAddressSubmit(savedAddress);
      } else {
        const temporaryAddress: SavedAddress = {
          id: `temp-${Date.now()}`,
          ...addressPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        toast.info(`${addressType === 'from' ? 'Sender' : 'Recipient'} address used for this shipment only.`);
        onAddressSubmit(temporaryAddress);
      }
      reset();
    } catch (error: any) {
      toast.error(`Error saving address: ${error.message}`);
      console.error("Address submission error:", error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-4 p-1">
        <AddressFormFields control={control} errors={errors} />
        <div className="flex items-center space-x-2">
            <Checkbox
            id="saveAddress"
            checked={saveAddress}
            onCheckedChange={(checked) => setSaveAddress(Boolean(checked))}
            />
            <Label htmlFor="saveAddress" className="text-sm font-normal">
            Save this address to your address book
            </Label>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
            {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
            </Button>
            )}
            <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : `Use This ${addressType === 'from' ? 'Sender' : 'Recipient'} Address`}
            </Button>
        </div>
    </form>
  );
};

export default InstantAddressForm;
