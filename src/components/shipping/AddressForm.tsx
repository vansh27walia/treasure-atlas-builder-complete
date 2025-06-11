
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

export interface AddressFormValues {
  name: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  residential?: boolean;
  is_default_from?: boolean;
  is_default_to?: boolean;
}

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => Promise<void>;
  isLoading?: boolean;
  buttonText?: string;
  isPickupAddress?: boolean;
  showDefaultOptions?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  defaultValues = {},
  onSubmit,
  isLoading = false,
  buttonText = 'Save Address',
  isPickupAddress = false,
  showDefaultOptions = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AddressFormValues>({
    defaultValues: {
      name: '',
      first_name: '',
      last_name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      email: '',
      residential: true,
      is_default_from: false,
      is_default_to: false,
      ...defaultValues,
    },
  });

  // Reset form when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name || '',
        first_name: defaultValues.first_name || '',
        last_name: defaultValues.last_name || '',
        company: defaultValues.company || '',
        street1: defaultValues.street1 || '',
        street2: defaultValues.street2 || '',
        city: defaultValues.city || '',
        state: defaultValues.state || '',
        zip: defaultValues.zip || '',
        country: defaultValues.country || 'US',
        phone: defaultValues.phone || '',
        email: defaultValues.email || '',
        residential: defaultValues.residential ?? true,
        is_default_from: defaultValues.is_default_from || false,
        is_default_to: defaultValues.is_default_to || false,
      });
    }
  }, [defaultValues, reset]);

  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      console.log("Google Place selected in AddressForm:", place);
      
      if (!place) {
        console.warn("No place data received");
        return;
      }
      
      const { street1, city, state, zip, country } = extractAddressComponents(place);
      
      console.log("Extracted components:", { street1, city, state, zip, country });
      
      // Only set values that are not empty
      if (street1) {
        setValue('street1', street1, { shouldValidate: true, shouldDirty: true });
        console.log("Set street1:", street1);
      }
      if (city) {
        setValue('city', city, { shouldValidate: true, shouldDirty: true });
        console.log("Set city:", city);
      }
      if (state) {
        setValue('state', state, { shouldValidate: true, shouldDirty: true });
        console.log("Set state:", state);
      }
      if (zip) {
        setValue('zip', zip, { shouldValidate: true, shouldDirty: true });
        console.log("Set zip:", zip);
      }
      
      toast.success('Address details populated from Google Maps');
    } catch (error) {
      console.error("Error processing Google place selection:", error);
      toast.error('Failed to process selected address. Please fill in the fields manually.');
    }
  };

  const handleAddressLineChange = (value: string) => {
    setValue('street1', value, { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = async (values: AddressFormValues) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedValues = watch();

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Address Name / Location Name *</Label>
            <Input
              id="name"
              {...register('name', { required: 'Address name is required' })}
              placeholder="Home, Office, Warehouse, etc."
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Give this address a memorable name (e.g., "Main Office", "Home", "Warehouse")</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                {...register('first_name')}
                placeholder="First name"
              />
            </div>
            
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                {...register('last_name')}
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              {...register('company')}
              placeholder="Company or business name (optional)"
            />
          </div>

          <div>
            <Label htmlFor="street1">Street Address *</Label>
            <AddressAutoComplete 
              placeholder="Start typing your address (Google autofill enabled)..."
              defaultValue={watchedValues.street1}
              onAddressSelected={handleGooglePlaceSelected}
              onChange={handleAddressLineChange}
              id="address-form-autocomplete"
              required
            />
            <input
              type="hidden"
              {...register('street1', { required: 'Street address is required' })}
            />
            {errors.street1 && (
              <p className="text-red-500 text-sm mt-1">{errors.street1.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Start typing and select from Google suggestions to auto-fill city, state, and ZIP</p>
          </div>

          <div>
            <Label htmlFor="street2">Apartment, Suite, Unit, Floor</Label>
            <Input
              id="street2"
              {...register('street2')}
              placeholder="Apt, Suite, Unit, Floor, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register('city', { required: 'City is required' })}
                placeholder="City"
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="state">State / Province *</Label>
              <Input
                id="state"
                {...register('state', { required: 'State is required' })}
                placeholder="State or Province"
                className={errors.state ? 'border-red-500' : ''}
              />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="zip">ZIP / Postal Code *</Label>
              <Input
                id="zip"
                {...register('zip', { required: 'ZIP code is required' })}
                placeholder="ZIP or Postal Code"
                className={errors.zip ? 'border-red-500' : ''}
              />
              {errors.zip && (
                <p className="text-red-500 text-sm mt-1">{errors.zip.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="Phone number (recommended)"
                type="tel"
              />
              <p className="text-gray-500 text-xs mt-1">Required by most carriers for pickup/delivery</p>
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                {...register('email')}
                placeholder="Email address (optional)"
                type="email"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="residential"
              {...register('residential')}
              defaultChecked={watchedValues.residential}
            />
            <Label htmlFor="residential">This is a residential address</Label>
            <p className="text-gray-500 text-xs ml-2">(Uncheck if this is a business/commercial address)</p>
          </div>

          {showDefaultOptions && (
            <div className="space-y-2">
              {isPickupAddress && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default_from"
                    {...register('is_default_from')}
                    defaultChecked={watchedValues.is_default_from}
                  />
                  <Label htmlFor="is_default_from">Set as default pickup address</Label>
                </div>
              )}
              
              {!isPickupAddress && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_default_to"
                    {...register('is_default_to')}
                    defaultChecked={watchedValues.is_default_to}
                  />
                  <Label htmlFor="is_default_to">Set as default shipping address</Label>
                </div>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading || isSubmitting} 
            className="w-full"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : buttonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddressForm;
