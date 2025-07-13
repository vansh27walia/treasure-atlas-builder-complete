
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Package, Scale, Search, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import AddressSelector from './AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const packageOptions = [
  { value: 'box', label: 'Boxes', type: 'custom' },
  { value: 'envelope', label: 'Envelopes', type: 'custom' },
  
  // USPS Flat Rate Packages
  { value: 'FlatRateEnvelope', label: 'USPS - Flat Rate Envelope', type: 'predefined' },
  { value: 'LegalFlatRateEnvelope', label: 'USPS - Legal Flat Rate Envelope', type: 'predefined' },
  { value: 'PaddedFlatRateEnvelope', label: 'USPS - Padded Flat Rate Envelope', type: 'predefined' },
  { value: 'FlatRateWindowEnvelope', label: 'USPS - Flat Rate Window Envelope', type: 'predefined' },
  { value: 'FlatRateCardboardEnvelope', label: 'USPS - Flat Rate Cardboard Envelope', type: 'predefined' },
  { value: 'SmallFlatRateEnvelope', label: 'USPS - Small Flat Rate Envelope', type: 'predefined' },
  { value: 'SmallFlatRateBox', label: 'USPS - Small Flat Rate Box', type: 'predefined' },
  { value: 'MediumFlatRateBox', label: 'USPS - Medium Flat Rate Box', type: 'predefined' },
  { value: 'LargeFlatRateBox', label: 'USPS - Large Flat Rate Box', type: 'predefined' },
  { value: 'LargeFlatRateBoxAPOFPO', label: 'USPS - Large Flat Rate Box APO/FPO', type: 'predefined' },
  { value: 'RegionalRateBoxA', label: 'USPS - Regional Rate Box A', type: 'predefined' },
  { value: 'RegionalRateBoxB', label: 'USPS - Regional Rate Box B', type: 'predefined' },
  
  // UPS Predefined Packages
  { value: 'UPSLetter', label: 'UPS - Letter', type: 'predefined' },
  { value: 'UPSExpressBox', label: 'UPS - Express Box', type: 'predefined' },
  { value: 'UPS25kgBox', label: 'UPS - 25kg Box', type: 'predefined' },
  { value: 'UPS10kgBox', label: 'UPS - 10kg Box', type: 'predefined' },
  { value: 'Tube', label: 'UPS - Tube', type: 'predefined' },
  { value: 'Pak', label: 'UPS - Pak', type: 'predefined' },
  { value: 'SmallExpressBox', label: 'UPS - Small Express Box', type: 'predefined' },
  { value: 'MediumExpressBox', label: 'UPS - Medium Express Box', type: 'predefined' },
  { value: 'LargeExpressBox', label: 'UPS - Large Express Box', type: 'predefined' },
  
  // FedEx Predefined Packages
  { value: 'FedExEnvelope', label: 'FedEx - Envelope', type: 'predefined' },
  { value: 'FedExBox', label: 'FedEx - Box', type: 'predefined' },
  { value: 'FedExPak', label: 'FedEx - Pak', type: 'predefined' },
  { value: 'FedExTube', label: 'FedEx - Tube', type: 'predefined' },
  { value: 'FedEx10kgBox', label: 'FedEx - 10kg Box', type: 'predefined' },
  { value: 'FedEx25kgBox', label: 'FedEx - 25kg Box', type: 'predefined' },
  { value: 'FedExSmallBox', label: 'FedEx - Small Box', type: 'predefined' },
  { value: 'FedExMediumBox', label: 'FedEx - Medium Box', type: 'predefined' },
  { value: 'FedExLargeBox', label: 'FedEx - Large Box', type: 'predefined' },
  { value: 'FedExExtraLargeBox', label: 'FedEx - Extra Large Box', type: 'predefined' },
  
  // DHL Predefined Packages
  { value: 'DHLExpressEnvelope', label: 'DHL - Express Envelope', type: 'predefined' },
  { value: 'DHLFlyer', label: 'DHL - Flyer', type: 'predefined' },
  { value: 'DHLExpressBox', label: 'DHL - Express Box', type: 'predefined' },
  { value: 'DHLJumboBox', label: 'DHL - Jumbo Box', type: 'predefined' },
  { value: 'DHLSmallBox', label: 'DHL - Small Box', type: 'predefined' },
  { value: 'DHLLargeBox', label: 'DHL - Large Box', type: 'predefined' },
  { value: 'DHLPak', label: 'DHL - Pak', type: 'predefined' },
  { value: 'DHLTube', label: 'DHL - Tube', type: 'predefined' },
];

const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  length: z.coerce.number().min(0, "Length must be greater than 0").optional(),
  width: z.coerce.number().min(0, "Width must be greater than 0").optional(),
  height: z.coerce.number().min(0, "Height must be greater than 0").optional(),
  insurance: z.boolean().default(true),
  declaredValue: z.coerce.number().min(0, "Declared value must be greater than 0").default(100),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const RedesignedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: '',
      weightValue: 0,
      weightUnit: 'oz',
      length: 8,
      width: 8,
      height: 2,
      insurance: true,
      declaredValue: 100,
    }
  });

  const selectedPackageType = form.watch('packageType');
  const selectedPackage = packageOptions.find(p => p.value === selectedPackageType);
  const declaredValue = form.watch('declaredValue');
  const insuranceEnabled = form.watch('insurance');

  // Calculate insurance cost
  const insuranceCost = insuranceEnabled ? Math.ceil(declaredValue / 100) * 4 : 0;

  const getInputFields = () => {
    if (!selectedPackage) return null;

    const showDimensions = selectedPackage.type === 'custom';
    const isEnvelope = selectedPackageType === 'envelope';

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {showDimensions && (
          <>
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Length (in)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      step="0.1"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (in)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0" 
                      step="0.1"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!isEnvelope && (
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (in)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="0.1" 
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}
        
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="weightValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="0"
                    step="0.1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="weightUnit"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="oz">Ounces (oz)</SelectItem>
                    <SelectItem value="lb">Pounds (lb)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    );
  };

  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please provide both origin and destination addresses");
      return;
    }

    setIsLoading(true);
    try {
      // Convert weight to ounces for backend processing
      let weightOz = values.weightValue;
      if (values.weightUnit === 'kg') {
        weightOz = values.weightValue * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = values.weightValue * 16;
      }

      // Build parcel object based on package type
      const selectedPackage = packageOptions.find(p => p.value === values.packageType);
      let parcel: any = {};

      if (selectedPackage?.type === 'custom') {
        if (values.packageType === 'envelope') {
          parcel = {
            length: values.length,
            width: values.width,
            weight: weightOz,
          };
        } else {
          parcel = {
            length: values.length,
            width: values.width,
            height: values.height,
            weight: weightOz,
          };
        }
      } else {
        // Predefined package
        parcel = {
          predefined_package: values.packageType,
          weight: weightOz,
        };
      }

      // Prepare the request payload for EasyPost API
      const payload: any = {
        fromAddress: {
          name: fromAddress.name,
          company: fromAddress.company || '',
          street1: fromAddress.street1,
          street2: fromAddress.street2 || '',
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
          phone: fromAddress.phone || '',
        },
        toAddress: {
          name: toAddress.name,
          company: toAddress.company || '',
          street1: toAddress.street1,
          street2: toAddress.street2 || '',
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
          phone: toAddress.phone || '',
        },
        parcel,
        options: {},
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };

      // Add insurance if enabled
      if (values.insurance) {
        payload.insurance = values.declaredValue;
      }

      console.log('Shipping payload:', JSON.stringify(payload, null, 2));

      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      // Process rates and add insurance cost
      if (data.rates && Array.isArray(data.rates)) {
        const ratesWithInsurance = data.rates.map((rate: any) => ({
          ...rate,
          insurance_cost: insuranceCost,
          total_with_insurance: parseFloat(rate.rate) + insuranceCost,
        }));

        // Dispatch rates to be displayed
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { 
            rates: ratesWithInsurance, 
            shipmentId: data.shipmentId,
            insuranceCost 
          } 
        }));

        toast.success("Shipping rates retrieved successfully");
        
        // Scroll to the rates section
        const ratesSection = document.getElementById('shipping-rates-section');
        if (ratesSection) {
          ratesSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        toast.info('No rates available for this shipment');
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to get shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <Card className="border border-gray-200 w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-200 w-full">
            
            {/* Pickup Address - Top */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Pickup Address
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <AddressSelector 
                  type="from"
                  onAddressSelect={handleFromAddressSelect}
                  useGoogleAutocomplete={true}
                />
              </div>
            </div>

            {/* Drop-Off Address - Below Pickup */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Drop-Off Address
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <AddressSelector 
                  type="to"
                  onAddressSelect={handleToAddressSelect}
                  useGoogleAutocomplete={true}
                />
              </div>
            </div>

            {/* Full-Width Package Selector */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-700 flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Package Type
              </h2>
              
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full h-12 text-left">
                          <SelectValue placeholder="Select package type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {packageOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Package Dimensions/Weight Inputs */}
              {selectedPackage && (
                <div className="mt-6">
                  <h3 className="text-md font-medium mb-3 text-gray-700 flex items-center">
                    <Scale className="mr-2 h-4 w-4" />
                    Package Details
                  </h3>
                  {getInputFields()}
                </div>
              )}
            </div>

            {/* Insurance Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-700">Insurance Options</h2>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="insurance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Add Insurance ($4 per $100 coverage)
                        </FormLabel>
                        <p className="text-xs text-gray-500">
                          Insurance covers loss, theft, or damage. $4 per $100 of declared value.
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {insuranceEnabled && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <FormField
                      control={form.control}
                      name="declaredValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Declared Value (USD)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="mt-3 p-3 bg-blue-100 rounded border">
                      <p className="text-sm text-blue-800">
                        <strong>Insurance Cost: ${insuranceCost}</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Based on ${declaredValue} declared value
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-6 bg-gray-50">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Getting Rates...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Get Shipping Rates
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>
      </Card>
    </div>
  );
};

export default RedesignedShippingForm;
