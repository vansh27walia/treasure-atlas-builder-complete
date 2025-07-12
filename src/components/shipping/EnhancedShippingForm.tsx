
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { MapPin, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import PackageTypeSelector from './PackageTypeSelector';
import DynamicPackageFields from './DynamicPackageFields';
import { PackageType } from '@/types/shipping';

// Form schema with dynamic validation
const createFormSchema = (packageType: PackageType) => {
  const baseSchema = {
    fromName: z.string().min(1, 'From name is required'),
    fromAddress1: z.string().min(1, 'From address is required'),
    fromCity: z.string().min(1, 'From city is required'),
    fromState: z.string().min(1, 'From state is required'),
    fromZip: z.string().min(5, 'Valid ZIP code required'),
    fromCountry: z.string().default('US'),
    toName: z.string().min(1, 'To name is required'),
    toAddress1: z.string().min(1, 'To address is required'),
    toCity: z.string().min(1, 'To city is required'),
    toState: z.string().min(1, 'To state is required'),
    toZip: z.string().min(5, 'Valid ZIP code required'),
    toCountry: z.string().default('US'),
    packageType: z.enum(['custom', 'envelope', 'flat-rate']),
    weight: z.number().min(0.1, 'Weight must be greater than 0'),
  };

  // Add conditional fields based on package type
  if (packageType === 'custom') {
    return z.object({
      ...baseSchema,
      length: z.number().min(0.1, 'Length required'),
      width: z.number().min(0.1, 'Width required'),
      height: z.number().min(0.1, 'Height required'),
    });
  } else if (packageType === 'envelope') {
    return z.object({
      ...baseSchema,
      length: z.number().min(0.1, 'Length required'),
      width: z.number().min(0.1, 'Width required'),
    });
  } else {
    return z.object({
      ...baseSchema,
      carrier: z.string().min(1, 'Carrier selection required'),
      predefinedPackage: z.string().min(1, 'Package selection required'),
    });
  }
};

const EnhancedShippingForm: React.FC = () => {
  const [packageType, setPackageType] = useState<PackageType>('custom');
  const [carrier, setCarrier] = useState<string>('');
  const [predefinedPackage, setPredefinedPackage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(createFormSchema(packageType)),
    defaultValues: {
      fromName: '',
      fromAddress1: '',
      fromCity: '',
      fromState: '',
      fromZip: '',
      fromCountry: 'US',
      toName: '',
      toAddress1: '',
      toCity: '',
      toState: '',
      toZip: '',
      toCountry: 'US',
      packageType: 'custom' as PackageType,
      weight: 1,
      length: 8,
      width: 8,
      height: 4,
    },
  });

  const buildParcelPayload = () => {
    const formData = form.getValues();
    
    if (packageType === 'custom') {
      return {
        length: formData.length,
        width: formData.width,
        height: formData.height,
        weight: formData.weight,
      };
    } else if (packageType === 'envelope') {
      return {
        length: formData.length,
        width: formData.width,
        weight: formData.weight,
      };
    } else {
      return {
        predefined_package: predefinedPackage,
        weight: formData.weight,
      };
    }
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      const parcelPayload = buildParcelPayload();
      
      const requestData = {
        fromAddress: {
          name: data.fromName,
          street1: data.fromAddress1,
          city: data.fromCity,
          state: data.fromState,
          zip: data.fromZip,
          country: data.fromCountry,
        },
        toAddress: {
          name: data.toName,
          street1: data.toAddress1,
          city: data.toCity,
          state: data.toState,
          zip: data.toZip,
          country: data.toCountry,
        },
        parcel: parcelPayload,
      };

      console.log('Sending rate request:', requestData);

      const { data: responseData, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData,
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch shipping rates. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Received rates:', responseData);

      // Dispatch rates to the rates component
      document.dispatchEvent(
        new CustomEvent('easypost-rates-received', {
          detail: {
            rates: responseData.rates || [],
            shipmentId: responseData.shipmentId,
          },
        })
      );

      toast({
        title: 'Success',
        description: `Found ${responseData.rates?.length || 0} shipping rates!`,
      });

    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePackageTypeChange = (type: PackageType) => {
    setPackageType(type);
    form.setValue('packageType', type);
    
    // Reset carrier-specific fields when package type changes
    if (type !== 'flat-rate') {
      setCarrier('');
      setPredefinedPackage('');
    }
  };

  const handleFieldChange = (field: string, value: number) => {
    form.setValue(field as any, value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Create Shipping Label
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Origin Address */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  From Address
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div></div>

                  <FormField
                    control={form.control}
                    name="fromAddress1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fromZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Destination Address */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  To Address
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="toName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Recipient name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div></div>

                  <FormField
                    control={form.control}
                    name="toAddress1"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Package Information */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PackageTypeSelector
                    packageType={packageType}
                    carrier={carrier}
                    predefinedPackage={predefinedPackage}
                    onPackageTypeChange={handlePackageTypeChange}
                    onCarrierChange={setCarrier}
                    onPredefinedPackageChange={setPredefinedPackage}
                  />
                  
                  <DynamicPackageFields
                    packageType={packageType}
                    length={form.watch('length')}
                    width={form.watch('width')}
                    height={form.watch('height')}
                    weight={form.watch('weight')}
                    onFieldChange={handleFieldChange}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Rates...
                    </>
                  ) : (
                    'Get Shipping Rates'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedShippingForm;
