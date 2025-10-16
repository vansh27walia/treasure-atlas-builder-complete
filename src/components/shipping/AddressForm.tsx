import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { SavedAddress } from '@/services/AddressService';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutoComplete from './AddressAutoComplete'; // Assuming this path is correct
import { extractAddressComponents } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';

// Define the schema for address form values using Zod
const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  name: z.string().min(1, 'Address type is required'),
  company: z.string().optional(),
  street1: z.string().min(1, 'Address line 1 is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().min(1, 'Phone number is required'),
  is_default_from: z.boolean().default(false),
  is_default_to: z.boolean().default(false),
});

// Export the inferred type for use in other components
export type AddressFormValues = z.infer<typeof addressSchema>;

// Define props for the AddressForm component
interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>; // Optional initial values for the form
  onSubmit: (values: AddressFormValues) => void; // Callback function for form submission
  isLoading?: boolean; // Boolean to indicate if the form is in a loading state
  buttonText?: string; // Text to display on the submit button
  showDefaultOptions?: boolean; // Boolean to control visibility of default address checkboxes
  isPickupAddress?: boolean; // Boolean to differentiate between pickup and delivery addresses
  enableGoogleAutocomplete?: boolean; // Boolean to enable/disable Google Autocomplete
}

const AddressForm: React.FC<AddressFormProps> = ({
  defaultValues = {},
  onSubmit,
  isLoading = false,
  buttonText = 'Save Address',
  showDefaultOptions = true,
  isPickupAddress = true,
  enableGoogleAutocomplete = false,
}) => {
  // Initialize react-hook-form with Zod resolver for validation
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      is_default_from: false,
      is_default_to: false,
      ...defaultValues, // Spread any provided default values
    },
  });

  // Effect to update form values when defaultValues prop changes (e.g., for editing an address)
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        if (value !== undefined) {
          // Set form value, ensuring validation and dirty state are updated
          form.setValue(key as keyof AddressFormValues, value as any, { shouldValidate: true, shouldDirty: true });
        }
      });
    }
  }, [defaultValues, form]); // Dependencies: defaultValues and form instance

  // Handler for when a Google Place suggestion is selected from AddressAutoComplete
  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      console.log("Google Place selected in AddressForm:", place); // Log the raw place object

      if (!place) {
        console.warn("No place data received from Google Autocomplete.");
        return;
      }

      // Extract structured address components using a utility function
      const { street1, city, state, zip, country } = extractAddressComponents(place);

      console.log("Extracted components:", { street1, city, state, zip, country }); // Log extracted components

      // Populate form fields with the extracted values
      // Use shouldValidate, shouldDirty, shouldTouch for proper form state management
      if (street1) {
        form.setValue('street1', street1, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
      if (city) {
        form.setValue('city', city, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
      if (state) {
        form.setValue('state', state, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
      if (zip) {
        form.setValue('zip', zip, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
      if (country) {
        form.setValue('country', country, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }

      // Manually trigger validation for the updated fields to show immediate feedback
      form.trigger(['street1', 'city', 'state', 'zip', 'country']);

      toast.success('Address details populated from Google Maps'); // Show success notification
    } catch (error) {
      console.error("Error processing Google place selection:", error);
      toast.error('Failed to process selected address. Please fill in the fields manually.');
    }
  };

  // Removed the redundant handleFullAddressPopulated function as its logic is now
  // consolidated within handleGooglePlaceSelected, mirroring the working InstantAddressForm.

// Handler for direct changes to the street1 input field (when not using autocomplete suggestions)
const handleAddressLineChange = (value: string) => {
  form.setValue('street1', value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
};

// Handlers for Address Line 2 with autocomplete
const handleAddressLine2Selected = (place: GoogleMapsPlace) => {
  try {
    const line2 = place.formatted_address || '';
    form.setValue('street2', line2, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  } catch (e) {
    console.error('Error setting Address Line 2 from autocomplete:', e);
  }
};
const handleAddressLine2Change = (value: string) => {
  form.setValue('street2', value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
};

  // Custom submit handler that performs additional validation before calling the parent onSubmit
  const handleFormSubmit = (values: AddressFormValues) => {
    console.log("Form submitted with values:", values);

    // Basic validation check to ensure required address fields are not empty
    if (!values.street1 || !values.city || !values.state || !values.zip) {
      toast.error('Please fill in all required address fields');
      return;
    }

    // Call the onSubmit prop provided by the parent component
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name Field */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} value={field.value || ''} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name Field */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} value={field.value || ''} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Field (Optional) */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Company name" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone Field (Required) */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Street Address Field with Conditional Autocomplete */}
        <FormField
          control={form.control}
          name="street1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                {enableGoogleAutocomplete ? (
                  // Render AddressAutoComplete if enabled
                  <AddressAutoComplete
                    placeholder="Enter your address"
                    defaultValue={field.value}
                    onAddressSelected={handleGooglePlaceSelected} // Primary handler for place selection
                    onChange={handleAddressLineChange} // For manual typing
                    // Removed onFullAddressPopulated prop to consolidate logic in onAddressSelected
                    id="address-autocomplete"
                    required
                  />
                ) : (
                  // Fallback to a standard Input component if autocomplete is disabled
                  <Input
                    placeholder="Enter your address manually"
                    required
                    {...field}
                    value={field.value || ''}
                    id="address-manual-input" // Unique ID for the manual input
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

{/* Address Line 2 Field with optional Autocomplete */}
<FormField
  control={form.control}
  name="street2"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Address Line 2 (Optional)</FormLabel>
      <FormControl>
        {enableGoogleAutocomplete ? (
          <AddressAutoComplete
            placeholder="Apartment, suite, unit, building, floor, etc."
            defaultValue={field.value}
            onAddressSelected={handleAddressLine2Selected}
            onChange={handleAddressLine2Change}
            id="address-line2-autocomplete"
          />
        ) : (
          <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} value={field.value || ''} />
        )}
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

        {/* City and State Fields in a 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" required {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="State" required {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ZIP Code and Country Fields in a 2-column grid */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP code" required {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country" required {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Type Dropdown */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Type</FormLabel>
              <FormControl>
                <select 
                  {...field} 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select address type...</option>
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Building">Building</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Other">Other</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Options Checkboxes (Conditional) */}
        {showDefaultOptions && (
          <div className="flex flex-col space-y-2">
            {isPickupAddress && (
              <FormField
                control={form.control}
                name="is_default_from"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default pickup location
                      </FormLabel>
                      <FormDescription>
                        This address will be automatically selected when creating new shipments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {!isPickupAddress && (
              <FormField
                control={form.control}
                name="is_default_to"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default recipient location
                      </FormLabel>
                      <FormDescription>
                        This address will be automatically selected as the recipient when creating new shipments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Saving...' : buttonText}
        </Button>
      </form>
    </Form>
  );
};

export default AddressForm;
