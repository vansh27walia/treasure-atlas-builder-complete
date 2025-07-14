import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from './AddressSelector';
import { addressService, SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';
import { createAddressSelectHandler } from '@/utils/addressUtils';
import { Search, AlertTriangle, Shield, Package } from 'lucide-react';
import CustomsDocumentationModal from './CustomsDocumentationModal';

const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  packageValue: z.coerce.number().min(0, "Value must be greater than 0"),
  length: z.coerce.number().min(0, "Length must be greater than 0"),
  width: z.coerce.number().min(0, "Width must be greater than 0"),
  height: z.coerce.number().min(0, "Height must be greater than 0"),
  signatureRequired: z.boolean().default(false),
  insurance: z.boolean().default(true),
  hazmat: z.boolean().default(false),
  hazmatType: z.string().optional(),
  carriers: z.object({
    usps: z.boolean().default(true),
    ups: z.boolean().default(true),
    fedex: z.boolean().default(true),
    dhl: z.boolean().default(true),
  }),
  allCarriers: z.boolean().default(true),
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
      packageValue: 0,
      length: 8,
      width: 8,
      height: 4,
      signatureRequired: false,
      insurance: true,
      hazmat: false,
      hazmatType: '',
      carriers: {
        usps: true,
        ups: true,
        fedex: true,
        dhl: true,
      },
      allCarriers: true,
    }
  });

  // Watch for address changes to trigger customs modal
  useEffect(() => {
    if (fromAddress && toAddress && fromAddress.country !== toAddress.country) {
      setShowCustomsModal(true);
    }
  }, [fromAddress, toAddress]);

  // Update carrier checkboxes when allCarriers changes
  const watchAllCarriers = form.watch("allCarriers");
  const watchHazmat = form.watch("hazmat");
  const watchInsurance = form.watch("insurance");
  const watchPackageValue = form.watch("packageValue");
  
  useEffect(() => {
    const carriers = ['usps', 'ups', 'fedex', 'dhl'] as const;
    carriers.forEach(carrier => {
      form.setValue(`carriers.${carrier}`, watchAllCarriers);
    });
  }, [watchAllCarriers, form]);
  
  // Update allCarriers checkbox based on individual carrier selections
  const watchCarriers = form.watch("carriers");
  
  useEffect(() => {
    const allSelected = Object.values(watchCarriers).every(selected => selected === true);
    form.setValue("allCarriers", allSelected);
  }, [watchCarriers, form]);

  // Calculate insurance cost
  const insuranceCost = watchInsurance ? Math.max(4, Math.ceil((watchPackageValue * 0.04) / 4) * 4) : 0;

  const hazmatTypes = [
    { value: 'LITHIUM', label: 'Lithium Batteries' },
    { value: 'CLASS_8_CORROSIVE', label: 'Corrosive Materials' },
    { value: 'CLASS_3_FLAMMABLE', label: 'Flammable Liquids' },
    { value: 'CLASS_9_MISC', label: 'Miscellaneous Dangerous Goods' },
  ];

  const handleCustomsSubmit = (customs: any) => {
    setCustomsInfo(customs);
    setShowCustomsModal(false);
    toast.success("Customs documentation completed");
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
      
      const selectedCarriers = Object.entries(values.carriers)
        .filter(([_, selected]) => selected)
        .map(([carrier]) => carrier);
      
      if (selectedCarriers.length === 0) {
        throw new Error("Please select at least one carrier");
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
          signature_confirmation: values.signatureRequired,
          insurance: values.insurance ? insuranceCost * 100 : undefined, // EasyPost expects cents
          hazmat: values.hazmat ? values.hazmatType : undefined,
        },
        carriers: selectedCarriers,
        customs_info: customsInfo
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
        const ratesWithOriginalPrices = data.rates.map(rate => {
          if (!rate.original_rate && (rate.list_rate || rate.retail_rate)) {
            return {
              ...rate,
              original_rate: rate.list_rate || rate.retail_rate
            };
          }
          return rate;
        });
        
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { rates: ratesWithOriginalPrices, shipmentId: data.shipmentId } 
        }));
      } else {
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { rates: data.rates, shipmentId: data.shipmentId } 
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Main Form - Left Side */}
      <div className="lg:col-span-8">
        <Card className="border border-gray-200 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-100">
              {/* Pickup Address */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  📍 Pickup Address
                </h3>
                <AddressSelector 
                  type="from"
                  onAddressSelect={handleFromAddressSelect}
                  useGoogleAutocomplete={true}
                />
              </div>

              {/* Drop-off Address */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">
                  🎯 Drop-off Address
                </h3>
                <AddressSelector 
                  type="to"
                  onAddressSelect={handleToAddressSelect}
                  useGoogleAutocomplete={true}
                />
              </div>
            
              {/* Package Type & Carriers */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">📦 Package & Carrier Options</h3>
                
                {/* Package Type */}
                <div className="mb-4">
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Package Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select Package Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="box">📦 Box</SelectItem>
                            <SelectItem value="envelope">📨 Envelope</SelectItem>
                            <SelectItem value="usps_medium_flat_rate_box">📮 USPS Medium Flat Rate Box</SelectItem>
                            <SelectItem value="usps_small_flat_rate_box">📮 USPS Small Flat Rate Box</SelectItem>
                            <SelectItem value="usps_flat_rate_envelope">📮 USPS Flat Rate Envelope</SelectItem>
                            <SelectItem value="usps_first_class">📮 USPS First Class</SelectItem>
                            <SelectItem value="fedex_envelope">📦 FedEx Envelope</SelectItem>
                            <SelectItem value="fedex_box">📦 FedEx Box</SelectItem>
                            <SelectItem value="ups_letter">📦 UPS Letter</SelectItem>
                            <SelectItem value="ups_box">📦 UPS Box</SelectItem>
                            <SelectItem value="dhl_flyer">📦 DHL Flyer</SelectItem>
                            <SelectItem value="dhl_express_envelope">📦 DHL Express Envelope</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Carriers Selection */}
                <div className="mb-4">
                  <FormLabel className="text-base font-medium mb-2 block">Carriers</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="carrier-usps"
                        checked={form.watch('carriers.usps')}
                        onCheckedChange={(checked) => form.setValue('carriers.usps', checked as boolean)}
                      />
                      <label htmlFor="carrier-usps" className="text-sm font-medium">USPS</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="carrier-fedex"
                        checked={form.watch('carriers.fedex')}
                        onCheckedChange={(checked) => form.setValue('carriers.fedex', checked as boolean)}
                      />
                      <label htmlFor="carrier-fedex" className="text-sm font-medium">FedEx</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="carrier-ups"
                        checked={form.watch('carriers.ups')}
                        onCheckedChange={(checked) => form.setValue('carriers.ups', checked as boolean)}
                      />
                      <label htmlFor="carrier-ups" className="text-sm font-medium">UPS</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="carrier-dhl"
                        checked={form.watch('carriers.dhl')}
                        onCheckedChange={(checked) => form.setValue('carriers.dhl', checked as boolean)}
                      />
                      <label htmlFor="carrier-dhl" className="text-sm font-medium">DHL</label>
                    </div>
                  </div>
                </div>

                {/* Package Dimensions - Show based on package type */}
                {(form.watch('packageType') === 'box' || form.watch('packageType') === 'envelope') && (
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {form.watch('packageType') === 'box' && (
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Weight and Value */}
                <div className="grid grid-cols-3 gap-3">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lb">Pounds (lb)</SelectItem>
                            <SelectItem value="oz">Ounces (oz)</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="packageValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Value ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="bg-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Insurance */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Insurance Options
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            Add $4 insurance per $100 declared value
                          </FormLabel>
                          {watchInsurance && watchPackageValue > 0 && (
                            <p className="text-xs text-blue-600 font-medium">
                              Insurance cost: +${insuranceCost.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* HAZMAT */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Hazardous Materials
                </h3>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <FormField
                    control={form.control}
                    name="hazmat"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">
                            Hazardous Material?
                          </FormLabel>
                          <p className="text-xs text-gray-600">
                            Check if your package contains hazardous materials
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {watchHazmat && (
                    <div className="mt-3">
                      <FormField
                        control={form.control}
                        name="hazmatType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">HAZMAT Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select HAZMAT type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {hazmatTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Submit Section */}
              <div className="p-6 bg-gray-50">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white" 
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
      </div>

      {/* Right Side - AI Assistant */}
      <div className="lg:col-span-4">
        <div className="sticky top-20">
          <Card className="border border-gray-200 shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                🤖 AI Shipping Assistant
              </h3>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Get smart recommendations for your shipping needs:
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full text-left justify-start">
                      💨 Show Fastest Options
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-left justify-start">
                      💰 Find Cheapest Rates
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-left justify-start">
                      🛡️ Most Reliable Service
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-left justify-start">
                      🌱 Eco-Friendly Options
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium mb-2 block">Ask me anything:</Label>
                  <div className="space-y-2">
                    <Input 
                      placeholder="e.g., What's the difference between UPS and FedEx?"
                      className="bg-white"
                    />
                    <Button size="sm" className="w-full">
                      Send Question
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

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