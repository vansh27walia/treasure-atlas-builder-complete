
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Box, ArrowRight, Scale, AlertCircle, Check, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { carrierService } from '@/services/CarrierService';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from './AddressSelector';
import { addressService, SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const shippingFormSchema = z.object({
  // Address fields will be handled separately
  packageType: z.string().min(1, "Please select a package type"),
  weightLb: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightOz: z.coerce.number().min(0, "Weight must be greater than 0").max(15, "Ounces must be less than 16"),
  packageValue: z.coerce.number().min(0, "Value must be greater than 0"),
  length: z.coerce.number().min(0, "Length must be greater than 0"),
  width: z.coerce.number().min(0, "Width must be greater than 0"),
  height: z.coerce.number().min(0, "Height must be greater than 0"),
  signatureRequired: z.boolean().default(false),
  insurance: z.boolean().default(false),
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

  // Using react-hook-form to manage form state
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: 'custom',
      weightLb: 0,
      weightOz: 0,
      packageValue: 0,
      length: 8,
      width: 8,
      height: 2,
      signatureRequired: false,
      insurance: false,
      carriers: {
        usps: true,
        ups: true,
        fedex: true,
        dhl: true,
      },
      allCarriers: true,
    }
  });

  // Update carrier checkboxes when allCarriers changes
  const watchAllCarriers = form.watch("allCarriers");
  
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

  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please select both pickup and delivery addresses");
      return;
    }

    setIsLoading(true);
    try {
      // Calculate total weight in ounces
      const weightOz = (values.weightLb * 16) + (values.weightOz || 0);
      
      // Get selected carriers
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
          insurance: values.insurance ? (values.packageValue * 100) : undefined, // EasyPost expects cents
        },
        carriers: selectedCarriers
      };

      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      // Publish the rates to be displayed in the ShippingRates component
      document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
        detail: { rates: data.rates, shipmentId: data.shipmentId } 
      }));

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
    <div className="mb-8 w-full">
      <Card className="border-2 border-gray-200 w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-gray-200 w-full">
            {/* Addresses Section */}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Shipping Addresses</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {/* Origin Address Section */}
                <div className="space-y-4 w-full">
                  <div className="bg-blue-50 p-4 rounded-lg w-full">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Origin</h3>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={createAddressSelectHandler(setFromAddress)}
                    />
                  </div>
                </div>
                
                {/* Destination Address Section */}
                <div className="space-y-4 w-full">
                  <div className="bg-blue-50 p-4 rounded-lg w-full">
                    <h3 className="text-lg font-medium text-blue-700 mb-2">Destination</h3>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={createAddressSelectHandler(setToAddress)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Package Details Section */}
            <div className="p-6 w-full">
              <h2 className="text-xl font-semibold mb-6 text-blue-700">Package Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Package Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="custom">Custom Package</SelectItem>
                            <SelectItem value="usps_medium_flat_rate_box">USPS Medium Flat Rate Box</SelectItem>
                            <SelectItem value="usps_small_flat_rate_box">USPS Small Flat Rate Box</SelectItem>
                            <SelectItem value="usps_flat_rate_envelope">USPS Flat Rate Envelope</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="weightLb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (lb)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="0"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="weightOz"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>oz</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number"
                              min="0"
                              max="15"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="packageValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value ($)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0.00" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length (in)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="0"
                              onChange={(e) => field.onChange(Number(e.target.value))}
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
                          <FormLabel>Width (in)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="0"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0" 
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
                          <FormLabel>Height (in)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              type="number"
                              min="0"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium text-blue-700 mb-2">Shipping Carriers</FormLabel>
                    
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center">
                        <FormField
                          control={form.control}
                          name="allCarriers"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-medium">
                                All Carriers
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <FormField
                          control={form.control}
                          name="carriers.usps"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>
                                USPS
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="carriers.ups"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>
                                UPS
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="carriers.fedex"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>
                                FedEx
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="carriers.dhl"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>
                                DHL
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <FormLabel className="text-base font-medium text-blue-700 mb-2">Additional Options</FormLabel>
                    
                    <div className="space-y-3 mt-3">
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
                            <div className="space-y-0.5">
                              <FormLabel>
                                Signature Required
                              </FormLabel>
                              <p className="text-xs text-gray-500">
                                Delivery person will collect a signature
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="insurance"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel>
                                Add Insurance
                              </FormLabel>
                              <p className="text-xs text-gray-500">
                                Protect your package against loss or damage
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
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
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting Rates...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Show Shipping Rates
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default EnhancedShippingForm;
