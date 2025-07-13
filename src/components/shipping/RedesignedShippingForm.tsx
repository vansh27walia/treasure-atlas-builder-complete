
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import AddressInput from './AddressInput';
import CarrierSelector from './CarrierSelector';
import PackageTypeSelector from './PackageTypeSelector';
import PackageDimensionsInput from './PackageDimensionsInput';
import PackageImageDisplay from './PackageImageDisplay';
import InsuranceCalculator from './InsuranceCalculator';

const formSchema = z.object({
  fromName: z.string().min(1, 'Name is required'),
  fromAddress1: z.string().min(1, 'Address is required'),
  fromAddress2: z.string().optional(),
  fromCity: z.string().min(1, 'City is required'),
  fromState: z.string().min(1, 'State is required'),
  fromZip: z.string().min(1, 'ZIP code is required'),
  fromCountry: z.string().default('US'),
  fromPhone: z.string().optional(),
  
  toName: z.string().min(1, 'Name is required'),
  toAddress1: z.string().min(1, 'Address is required'),
  toAddress2: z.string().optional(),
  toCity: z.string().min(1, 'City is required'),
  toState: z.string().min(1, 'State is required'),
  toZip: z.string().min(1, 'ZIP code is required'),
  toCountry: z.string().default('US'),
  toPhone: z.string().optional(),
  
  carrier: z.string().default('all'),
  packageType: z.string().min(1, 'Package type is required'),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  weight: z.number().min(0.1, 'Weight must be greater than 0'),
  
  insuranceEnabled: z.boolean().default(true),
  declaredValue: z.number().min(0).default(0),
});

type FormValues = z.infer<typeof formSchema>;

const RedesignedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fromCountry: 'US',
      toCountry: 'US',
      carrier: 'all',
      packageType: 'custom_box',
      insuranceEnabled: true,
      declaredValue: 100,
      weight: 1,
      length: 8,
      width: 8,
      height: 4,
    },
  });

  const packageType = form.watch('packageType');
  const carrier = form.watch('carrier');
  const insuranceEnabled = form.watch('insuranceEnabled');
  const declaredValue = form.watch('declaredValue');

  const buildParcelPayload = (values: FormValues) => {
    const isCustomBox = values.packageType === 'custom_box';
    const isEnvelope = values.packageType === 'envelope';
    
    if (isCustomBox) {
      return {
        length: values.length,
        width: values.width,
        height: values.height,
        weight: values.weight,
      };
    } else if (isEnvelope) {
      return {
        length: values.length,
        width: values.width,
        weight: values.weight,
      };
    } else {
      // Flat rate package
      return {
        predefined_package: values.packageType,
        weight: values.weight,
      };
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    
    try {
      console.log('Submitting shipping form with values:', values);
      
      // Calculate insurance charge
      const insuranceCharge = values.insuranceEnabled 
        ? Math.ceil(values.declaredValue / 100) * 4 
        : 0;
      
      // Build the request payload
      const requestData = {
        fromAddress: {
          name: values.fromName,
          street1: values.fromAddress1,
          street2: values.fromAddress2 || '',
          city: values.fromCity,
          state: values.fromState,
          zip: values.fromZip,
          country: values.fromCountry,
          phone: values.fromPhone || '',
        },
        toAddress: {
          name: values.toName,
          street1: values.toAddress1,
          street2: values.toAddress2 || '',
          city: values.toCity,
          state: values.toState,
          zip: values.toZip,
          country: values.toCountry,
          phone: values.toPhone || '',
        },
        parcel: buildParcelPayload(values),
        carriers: values.carrier === 'all' ? [] : [values.carrier],
        options: {},
      };
      
      // Add insurance to the request if enabled
      if (values.insuranceEnabled && values.declaredValue > 0) {
        requestData.options = {
          ...requestData.options,
          insurance: values.declaredValue,
        };
      }
      
      console.log('Sending rate request:', requestData);
      
      // Call the shipping rates API
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData,
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error('Failed to fetch shipping rates. Please try again.');
        return;
      }

      if (!data?.rates || data.rates.length === 0) {
        toast.warning('No shipping rates found for the provided details.');
        return;
      }

      console.log('Received rates:', data.rates);
      
      // Add insurance charge to each rate if insurance is enabled
      const ratesWithInsurance = data.rates.map((rate: any) => ({
        ...rate,
        insurance_charge: insuranceCharge,
        total_rate: (parseFloat(rate.rate) + insuranceCharge).toFixed(2),
      }));
      
      // Dispatch event with rates including insurance
      const ratesEvent = new CustomEvent('easypost-rates-received', {
        detail: { 
          rates: ratesWithInsurance, 
          shipmentId: data.shipmentId,
          insuranceCharge,
        }
      });
      
      document.dispatchEvent(ratesEvent);
      
      toast.success(`Found ${data.rates.length} shipping options!`);
      
    } catch (error) {
      console.error('Error in shipping form submission:', error);
      toast.error('An error occurred while fetching shipping rates.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Pickup Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-800">📍 Pickup Address</h2>
            <AddressInput
              type="from"
              form={form}
              title="From"
            />
          </Card>

          {/* Drop-off Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">📍 Drop-off Address</h2>
            <AddressInput
              type="to"
              form={form}
              title="To"
            />
          </Card>

          {/* Carrier and Package Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">📦 Package & Carrier Selection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CarrierSelector
                selectedCarrier={carrier}
                onCarrierChange={(value) => form.setValue('carrier', value)}
              />
              <PackageTypeSelector
                selectedCarrier={carrier}
                selectedPackageType={packageType}
                onPackageTypeChange={(value) => form.setValue('packageType', value)}
              />
            </div>
          </Card>

          {/* Package Image Display */}
          {packageType && (
            <PackageImageDisplay
              packageType={packageType}
              carrier={carrier}
            />
          )}

          {/* Package Dimensions */}
          <PackageDimensionsInput
            packageType={packageType}
            length={form.watch('length') || 0}
            width={form.watch('width') || 0}
            height={form.watch('height') || 0}
            weight={form.watch('weight') || 0}
            onLengthChange={(value) => form.setValue('length', value)}
            onWidthChange={(value) => form.setValue('width', value)}
            onHeightChange={(value) => form.setValue('height', value)}
            onWeightChange={(value) => form.setValue('weight', value)}
          />

          {/* Insurance Calculator */}
          <InsuranceCalculator
            insuranceEnabled={insuranceEnabled}
            onInsuranceToggle={(enabled) => form.setValue('insuranceEnabled', enabled)}
            declaredValue={declaredValue}
            onDeclaredValueChange={(value) => form.setValue('declaredValue', value)}
          />

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fetching Rates...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Get Shipping Rates
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RedesignedShippingForm;
