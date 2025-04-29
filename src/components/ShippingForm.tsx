
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Box, ArrowRight, Scale } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";

interface FormValues {
  fromName: string;
  fromCompany: string;
  fromAddress1: string;
  fromAddress2: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  fromCountry: string;
  toName: string;
  toCompany: string;
  toAddress1: string;
  toAddress2: string;
  toCity: string;
  toState: string;
  toZip: string;
  toCountry: string;
  packageType: string;
  weightLb: number;
  weightOz: number;
  packageValue: number;
  length: number;
  width: number;
  height: number;
  shippingMethod: string;
  signatureRequired: boolean;
  insurance: boolean;
}

const ShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Using react-hook-form to manage form state
  const form = useForm<FormValues>({
    defaultValues: {
      fromName: '',
      fromCompany: '',
      fromAddress1: '',
      fromAddress2: '',
      fromCity: '',
      fromState: '',
      fromZip: '',
      fromCountry: 'US',
      toName: '',
      toCompany: '',
      toAddress1: '',
      toAddress2: '',
      toCity: '',
      toState: '',
      toZip: '',
      toCountry: 'US',
      packageType: 'custom',
      weightLb: 0,
      weightOz: 0,
      packageValue: 0,
      length: 0,
      width: 0,
      height: 0,
      shippingMethod: 'usps',
      signatureRequired: false,
      insurance: false,
    }
  });

  const handleGetRates = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Calculate total weight in ounces
      const weightOz = (values.weightLb * 16) + (values.weightOz || 0);
      
      // Prepare the request payload for EasyPost API
      const payload = {
        fromAddress: {
          name: values.fromName,
          company: values.fromCompany || undefined,
          street1: values.fromAddress1,
          street2: values.fromAddress2 || undefined,
          city: values.fromCity,
          state: values.fromState,
          zip: values.fromZip,
          country: values.fromCountry || 'US',
        },
        toAddress: {
          name: values.toName,
          company: values.toCompany || undefined,
          street1: values.toAddress1,
          street2: values.toAddress2 || undefined,
          city: values.toCity,
          state: values.toState,
          zip: values.toZip,
          country: values.toCountry || 'US',
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
        }
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
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error("Failed to get shipping rates. Please check your input and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Ship a Package</h2>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGetRates)}>
              <Tabs defaultValue="domestic" className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="domestic">Domestic</TabsTrigger>
                  <TabsTrigger value="international">International</TabsTrigger>
                </TabsList>
                
                <TabsContent value="domestic" className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Origin Address</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="fromName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Name" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="fromCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company (optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Company" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="fromAddress1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Street address" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="fromAddress2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2 (optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Apt, Suite, Unit, etc." />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fromCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="City" />
                                </FormControl>
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
                                  <Input {...field} placeholder="State" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="fromZip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ZIP Code" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="fromCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="US">United States</SelectItem>
                                  <SelectItem value="CA">Canada</SelectItem>
                                  <SelectItem value="MX">Mexico</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Destination Address</h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="toName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Name" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="toCompany"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company (optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Company" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="toAddress1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Street address" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="toAddress2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 2 (optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Apt, Suite, Unit, etc." />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="toCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="City" />
                                </FormControl>
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
                                  <Input {...field} placeholder="State" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="toZip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="ZIP Code" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="toCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Country" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="US">United States</SelectItem>
                                  <SelectItem value="CA">Canada</SelectItem>
                                  <SelectItem value="MX">Mexico</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="international" className="pt-6">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    International shipping options will appear here
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Package Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base">Shipping Service</FormLabel>
                          <div className="flex flex-col space-y-2 mt-2">
                            <div className="flex items-center">
                              <input
                                id="usps"
                                name="shipping-method"
                                type="radio"
                                checked={field.value === 'usps'}
                                onChange={() => field.onChange('usps')}
                                className="h-4 w-4 text-primary focus:ring-primary"
                              />
                              <label htmlFor="usps" className="ml-3 block text-sm font-medium text-gray-700">
                                USPS
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="ups"
                                name="shipping-method"
                                type="radio"
                                checked={field.value === 'ups'}
                                onChange={() => field.onChange('ups')}
                                className="h-4 w-4 text-primary focus:ring-primary"
                              />
                              <label htmlFor="ups" className="ml-3 block text-sm font-medium text-gray-700">
                                UPS
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="fedex"
                                name="shipping-method"
                                type="radio"
                                checked={field.value === 'fedex'}
                                onChange={() => field.onChange('fedex')}
                                className="h-4 w-4 text-primary focus:ring-primary"
                              />
                              <label htmlFor="fedex" className="ml-3 block text-sm font-medium text-gray-700">
                                FedEx
                              </label>
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <Label className="text-base">Additional Options</Label>
                      <div className="flex flex-col space-y-2 mt-2">
                        <FormField
                          control={form.control}
                          name="signatureRequired"
                          render={({ field }) => (
                            <div className="flex items-center">
                              <input
                                id="signature"
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 text-primary focus:ring-primary rounded"
                              />
                              <label htmlFor="signature" className="ml-3 block text-sm font-medium text-gray-700">
                                Signature Required
                              </label>
                            </div>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="insurance"
                          render={({ field }) => (
                            <div className="flex items-center">
                              <input
                                id="insurance"
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => field.onChange(e.target.checked)}
                                className="h-4 w-4 text-primary focus:ring-primary rounded"
                              />
                              <label htmlFor="insurance" className="ml-3 block text-sm font-medium text-gray-700">
                                Add Insurance
                              </label>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <span>{isLoading ? 'Getting Rates...' : 'Show Shipping Rates'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </Card>
    </div>
  );
};

export default ShippingForm;
