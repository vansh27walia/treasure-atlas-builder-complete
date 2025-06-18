import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useShippingRates } from '@/hooks/useShippingRates';

const addressSchema = z.object({
  name: z.string().optional(),
  street1: z.string().min(1, { message: 'Street address is required' }),
  street2: z.string().optional(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  zip: z.string().min(5, { message: 'Zip code is required' }).max(10),
  country: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

const parcelSchema = z.object({
  length: z.string().min(1, { message: 'Length is required' }),
  width: z.string().min(1, { message: 'Width is required' }),
  height: z.string().min(1, { message: 'Height is required' }),
  weight: z.string().min(1, { message: 'Weight is required' }),
});

const shippingFormSchema = z.object({
  fromAddress: addressSchema,
  toAddress: addressSchema,
  parcel: parcelSchema,
});

type ShippingFormData = z.infer<typeof shippingFormSchema>;

const EnhancedShippingForm: React.FC = () => {
  const [fromAddress, setFromAddress] = useState<ShippingFormData['fromAddress'] | null>(null);
  const [toAddress, setToAddress] = useState<ShippingFormData['toAddress'] | null>(null);
  const [parcel, setParcel] = useState<ShippingFormData['parcel'] | null>(null);
  
  const { rates, isLoading: ratesLoading, fetchRates, clearRates } = useShippingRates();

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fromAddress: {
        name: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        company: '',
      },
      toAddress: {
        name: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        company: '',
      },
      parcel: {
        length: '',
        width: '',
        height: '',
        weight: '',
      },
    },
  });

  const { handleSubmit, setValue, getValues, formState: { errors } } = form;

  const handleAddressChange = (addressType: 'fromAddress' | 'toAddress', field: string, value: string) => {
    setValue(`${addressType}.${field}` as any, value);
    const updatedAddress = { ...getValues(addressType), [field]: value };
    
    if (addressType === 'fromAddress') {
      setFromAddress(updatedAddress);
    } else {
      setToAddress(updatedAddress);
    }
  };

  const handleParcelChange = (field: string, value: string) => {
    setValue(`parcel.${field}` as any, value);
    setParcel({ ...getValues('parcel'), [field]: value });
  };

  const handleGetRates = async () => {
    if (!fromAddress || !toAddress || !parcel) {
      toast.error('Please fill in all required fields');
      return;
    }

    console.log('Getting rates with:', { fromAddress, toAddress, parcel });

    try {
      await fetchRates({
        fromAddress,
        toAddress,
        parcel: {
          length: parseFloat(parcel.length) || 1,
          width: parseFloat(parcel.width) || 1,
          height: parseFloat(parcel.height) || 1,
          weight: parseFloat(parcel.weight) || 1
        },
        options: {}
      });

      // Dispatch event to show rates
      const rateEvent = new CustomEvent('shipping-form-completed', {
        detail: { fromAddress, toAddress, parcel }
      });
      document.dispatchEvent(rateEvent);

    } catch (error) {
      console.error('Error getting rates:', error);
      toast.error('Failed to get shipping rates');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleGetRates)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">From Address</h3>
            <FormField
              control={form.control}
              name="fromAddress.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Sender Name" {...field} onChange={(e) => handleAddressChange('fromAddress', 'name', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromAddress.street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} onChange={(e) => handleAddressChange('fromAddress', 'street1', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fromAddress.street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apt, Suite, Bldg. (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 2B" {...field} onChange={(e) => handleAddressChange('fromAddress', 'street2', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} onChange={(e) => handleAddressChange('fromAddress', 'city', e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromAddress.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} onChange={(e) => handleAddressChange('fromAddress', 'state', e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="fromAddress.zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} onChange={(e) => handleAddressChange('fromAddress', 'zip', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">To Address</h3>
            <FormField
              control={form.control}
              name="toAddress.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Recipient Name" {...field} onChange={(e) => handleAddressChange('toAddress', 'name', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toAddress.street1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} onChange={(e) => handleAddressChange('toAddress', 'street1', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toAddress.street2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apt, Suite, Bldg. (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apt 2B" {...field} onChange={(e) => handleAddressChange('toAddress', 'street2', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="toAddress.city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} onChange={(e) => handleAddressChange('toAddress', 'city', e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="toAddress.state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} onChange={(e) => handleAddressChange('toAddress', 'state', e.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="toAddress.zip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} onChange={(e) => handleAddressChange('toAddress', 'zip', e.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <h3 className="text-lg font-medium mb-2">Parcel Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="parcel.length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (in)</FormLabel>
                <FormControl>
                  <Input placeholder="12" type="number" {...field} onChange={(e) => handleParcelChange('length', e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parcel.width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width (in)</FormLabel>
                <FormControl>
                  <Input placeholder="8" type="number" {...field} onChange={(e) => handleParcelChange('width', e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parcel.height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (in)</FormLabel>
                <FormControl>
                  <Input placeholder="4" type="number" {...field} onChange={(e) => handleParcelChange('height', e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parcel.weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (oz)</FormLabel>
                <FormControl>
                  <Input placeholder="16" type="number" {...field} onChange={(e) => handleParcelChange('weight', e.target.value)} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={ratesLoading}>
          Get Shipping Rates
        </Button>
      </form>
    </Form>
  );
};

export default EnhancedShippingForm;
