import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from './AddressSelector';
import { addressService, SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';
import { Search, Package, MapPin } from 'lucide-react';
import CustomsDocumentationModal from './CustomsDocumentationModal';
import PackageTypeSelector from './PackageTypeSelector';
import InsuranceCalculator from './InsuranceCalculator';
import HazmatSelector from './HazmatSelector';

const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  declaredValue: z.coerce.number().min(0, "Value must be greater than 0"),
  length: z.coerce.number().min(0, "Length must be greater than 0"),
  width: z.coerce.number().min(0, "Width must be greater than 0"),
  height: z.coerce.number().min(0, "Height must be greater than 0"),
  insurance: z.boolean().default(true),
  hazmat: z.boolean().default(false),
  hazmatType: z.string().optional(),
  carriers: z.array(z.string()).default(['usps', 'ups', 'fedex', 'dhl']),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const EnhancedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [customsInfo, setCustomsInfo] = useState<any>(null);

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: 'box',
      weightValue: 0,
      weightUnit: 'lb',
      declaredValue: 0,
      length: 0,
      width: 0,
      height: 0,
      insurance: true,
      hazmat: false,
      hazmatType: '',
      carriers: ['usps', 'ups', 'fedex', 'dhl'],
    }
  });

  // Watch for package type changes to show/hide dimensions
  const watchPackageType = form.watch("packageType");
  const watchInsurance = form.watch("insurance");
  const watchDeclaredValue = form.watch("declaredValue");
  const watchHazmat = form.watch("hazmat");

  // Calculate insurance cost
  const insuranceCost = watchInsurance ? Math.max(2, Math.ceil((watchDeclaredValue / 100) * 2)) : 0;

  // Show dimensions for custom packages
  const showDimensions = ['box', 'envelope'].includes(watchPackageType);

  // Watch for address changes to trigger customs modal
  useEffect(() => {
    if (fromAddress && toAddress && fromAddress.country !== toAddress.country) {
      setShowCustomsModal(true);
    }
  }, [fromAddress, toAddress]);

  const handleCustomsSubmit = (customs: any) => {
    setCustomsInfo(customs);
    setShowCustomsModal(false);
    toast.success("Customs documentation completed");
  };

  const handleInsuranceChange = (enabled: boolean, amount: number) => {
    form.setValue('insurance', enabled);
    form.setValue('declaredValue', amount);
  };

  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please provide both origin and destination addresses");
      return;
    }

    // Check if international shipping requires customs and it's not completed
    if (fromAddress.country !== toAddress.country && !customsInfo) {
      setShowCustomsModal(true);
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
      
      // Prepare the request payload for EasyPost API
      const payload = {
        fromAddress: {
          name: fromAddress.name,
          company: fromAddress.company,
          street1: fromAddress.street1,
          street2: fromAddress.street2,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
        },
        toAddress: {
          name: toAddress.name,
          company: toAddress.company,
          street1: toAddress.street1,
          street2: toAddress.street2,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
        },
        parcel: {
          length: values.length,
          width: values.width,
          height: values.height,
          weight: weightOz,
        },
        options: {
          hazmat: values.hazmat ? values.hazmatType : undefined,
        },
        carriers: values.carriers,
        customs_info: customsInfo,
        // Store insurance info for later use in label creation
        insurance_info: values.insurance ? {
          amount: values.declaredValue,
          cost: insuranceCost
        } : null
      };

      console.log('Submitting payload:', payload);

      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      // Process and dispatch rates
      if (data.rates && Array.isArray(data.rates)) {
        const ratesWithInsurance = data.rates.map(rate => ({
          ...rate,
          insurance_cost: insuranceCost,
          total_cost: parseFloat(rate.rate) + insuranceCost
        }));
        
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { rates: ratesWithInsurance, shipmentId: data.shipmentId } 
        }));
      }

      toast.success("Shipping rates retrieved successfully");
      
      // Scroll to the rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to get shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-border">
            {/* Pickup Address */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Pickup Address
              </h3>
              <AddressSelector 
                type="from"
                onAddressSelect={handleFromAddressSelect}
                useGoogleAutocomplete={true}
              />
            </div>

            {/* Drop-off Address */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Drop-off Address
              </h3>
              <AddressSelector 
                type="to"
                onAddressSelect={handleToAddressSelect}
                useGoogleAutocomplete={true}
              />
            </div>
            
            {/* Package Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package Details
              </h3>
                
              {/* Package Type */}
              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <PackageTypeSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Package Dimensions - Show based on package type */}
              {showDimensions && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Length (in)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="bg-white"
                            placeholder="0"
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
                        <FormLabel className="text-sm">Width (in)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="0.1"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="bg-white"
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchPackageType === 'box' && (
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Height (in)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="bg-white"
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Weight */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <FormField
                  control={form.control}
                  name="weightValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Weight</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="bg-white"
                          placeholder="0"
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
                      <FormLabel className="text-sm">Unit</FormLabel>
                      <FormControl>
                        <select 
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        >
                          <option value="lb">Pounds (lb)</option>
                          <option value="oz">Ounces (oz)</option>
                          <option value="kg">Kilograms (kg)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Insurance */}
            <div className="p-6">
              <InsuranceCalculator
                defaultValue={watchDeclaredValue}
                isEnabled={watchInsurance}
                onInsuranceChange={handleInsuranceChange}
              />
            </div>

            {/* HAZMAT */}
            <div className="p-6">
              <FormField
                control={form.control}
                name="hazmat"
                render={({ field }) => (
                  <FormItem>
                    <HazmatSelector
                      isHazmat={field.value}
                      hazmatType={form.watch('hazmatType') || ''}
                      onHazmatChange={field.onChange}
                      onHazmatTypeChange={(type) => form.setValue('hazmatType', type)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
              
            {/* Submit Section */}
            <div className="p-6 bg-muted/50">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Search className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 mr-2" />
                )}
                Get Shipping Rates
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      {/* Customs Documentation Modal */}
      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => setShowCustomsModal(false)}
        onSubmit={handleCustomsSubmit}
        fromCountry={fromAddress?.country || ''}
        toCountry={toAddress?.country || ''}
      />
    </div>
  );
};

export default EnhancedShippingForm;
