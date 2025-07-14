
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
    <div className="w-full mb-6">
      <Card className="border border-gray-200 shadow-sm w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-100 w-full">
            {/* Addresses Section */}
            <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Shipping Addresses
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* Origin Address */}
                <div className="space-y-3 w-full">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
                      📍 Origin Address
                    </h3>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handleFromAddressSelect}
                      useGoogleAutocomplete={true}
                    />
                  </div>
                </div>
                
                {/* Destination Address */}
                <div className="space-y-3 w-full">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b border-gray-100 pb-2">
                      🎯 Destination Address
                    </h3>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={handleToAddressSelect}
                      useGoogleAutocomplete={true}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Package Details Section */}
            <div className="p-6 w-full">
              <h2 className="text-xl font-bold mb-6 text-gray-800">📦 Package Details</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="space-y-4">
                  {/* Package Type */}
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dimensions */}
                  <div className="grid grid-cols-3 gap-3">
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
                  </div>
                  
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
                
                <div className="space-y-4">
                  {/* HAZMAT Section */}
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
                            <FormLabel className="font-medium text-orange-800 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Hazardous Material?
                            </FormLabel>
                            <p className="text-xs text-orange-700">
                              Check if package contains dangerous goods
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
                                  {hazmatTypes.map(type => (
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

                  {/* Insurance Section */}
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
                            <FormLabel className="font-medium text-blue-800 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Add Package Insurance
                            </FormLabel>
                            <p className="text-xs text-blue-700">
                              ${insuranceCost} insurance for ${watchPackageValue.toFixed(2)} declared value
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Options */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <FormLabel className="text-base font-medium text-gray-700 mb-3 block">Additional Options</FormLabel>
                    
                    <FormField
                      control={form.control}
                      name="signatureRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Signature Required
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Button Section */}
            <div className="p-6 bg-gray-50 w-full">
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
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
