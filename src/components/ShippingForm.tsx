import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Box, ArrowRight, Scale, AlertCircle, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { carrierService } from '@/services/CarrierService';
import AddressSelector from '@/components/shipping/AddressSelector';
import { SavedAddress } from '@/services/AddressService';

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

interface AddressVerificationState {
  isVerifying: boolean;
  isVerified: boolean;
  messages: string[];
  verifiedAddress?: {
    name?: string;
    company?: string;
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
}

const ShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toAddressVerification, setToAddressVerification] = useState<AddressVerificationState>({
    isVerifying: false,
    isVerified: false,
    messages: []
  });
  const [selectedFromAddressId, setSelectedFromAddressId] = useState<number | undefined>(undefined);
  const [selectedToAddressId, setSelectedToAddressId] = useState<number | undefined>(undefined);
  const [useAddressSelector, setUseAddressSelector] = useState(true);
  
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
  
  // Handle pickup address selection
  const handleFromAddressSelect = (address: SavedAddress) => {
    setSelectedFromAddressId(address.id);
    
    // Update form values with selected address
    form.setValue('fromName', address.name || '');
    form.setValue('fromCompany', address.company || '');
    form.setValue('fromAddress1', address.street1);
    form.setValue('fromAddress2', address.street2 || '');
    form.setValue('fromCity', address.city);
    form.setValue('fromState', address.state);
    form.setValue('fromZip', address.zip);
    form.setValue('fromCountry', address.country);
    
    toast.success(`Pickup address set to ${address.name || address.city}`);
  };
  
  // Handle delivery address selection
  const handleToAddressSelect = (address: SavedAddress) => {
    setSelectedToAddressId(address.id);
    
    // Update form values with selected address
    form.setValue('toName', address.name || '');
    form.setValue('toCompany', address.company || '');
    form.setValue('toAddress1', address.street1);
    form.setValue('toAddress2', address.street2 || '');
    form.setValue('toCity', address.city);
    form.setValue('toState', address.state);
    form.setValue('toZip', address.zip);
    form.setValue('toCountry', address.country);
    
    toast.success(`Delivery address set to ${address.name || address.city}`);
  };

  // Toggle between address selector and manual entry
  const toggleAddressSelector = () => {
    setUseAddressSelector(!useAddressSelector);
  };
  
  // Handle address verification
  const handleVerifyAddress = async () => {
    const values = form.getValues();
    
    // Check if we have the minimum required address fields
    if (!values.toAddress1 || !values.toCity || !values.toState || !values.toZip) {
      toast.error("Please fill in all required address fields before verification");
      return;
    }
    
    setToAddressVerification({
      ...toAddressVerification,
      isVerifying: true,
      isVerified: false,
      messages: []
    });
    
    try {
      const addressToVerify = {
        name: values.toName,
        company: values.toCompany || undefined,
        street1: values.toAddress1,
        street2: values.toAddress2 || undefined,
        city: values.toCity,
        state: values.toState,
        zip: values.toZip,
        country: values.toCountry,
      };
      
      const result = await carrierService.verifyAddress(addressToVerify);
      
      // Get the verification response
      const { data, error } = await supabase.functions.invoke('verify-address', {
        body: { address: addressToVerify, carrier: 'easypost' }
      });
      
      if (error) {
        throw new Error(`Error verifying address: ${error.message}`);
      }
      
      if (data.success) {
        // Address is valid
        setToAddressVerification({
          isVerifying: false,
          isVerified: true,
          messages: ['Address is valid'],
          verifiedAddress: data.verifiedAddress
        });
        
        // Update form with verified address
        form.setValue('toAddress1', data.verifiedAddress.street1 || values.toAddress1);
        form.setValue('toAddress2', data.verifiedAddress.street2 || values.toAddress2 || '');
        form.setValue('toCity', data.verifiedAddress.city || values.toCity);
        form.setValue('toState', data.verifiedAddress.state || values.toState);
        form.setValue('toZip', data.verifiedAddress.zip || values.toZip);
        
        toast.success("Address verified successfully");
      } else {
        // Address has issues
        setToAddressVerification({
          isVerifying: false,
          isVerified: false,
          messages: data.messages || ['Unable to verify this address'],
          verifiedAddress: data.verifiedAddress
        });
        
        toast.warning("Address verification found issues");
      }
    } catch (error) {
      console.error('Error verifying address:', error);
      setToAddressVerification({
        isVerifying: false,
        isVerified: false,
        messages: ['Failed to verify address. Please check the address and try again.']
      });
      
      toast.error("Address verification failed");
    }
  };

  // Use verified address when available
  const useVerifiedAddress = () => {
    if (!toAddressVerification.verifiedAddress) return;
    
    const verified = toAddressVerification.verifiedAddress;
    
    if (verified.street1) form.setValue('toAddress1', verified.street1);
    if (verified.street2) form.setValue('toAddress2', verified.street2 || '');
    if (verified.city) form.setValue('toCity', verified.city);
    if (verified.state) form.setValue('toState', verified.state);
    if (verified.zip) form.setValue('toZip', verified.zip);
    
    toast.success("Using verified address");
  };

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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Origin Address</h3>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={toggleAddressSelector}
                        >
                          {useAddressSelector ? "Manual Entry" : "Saved Addresses"}
                        </Button>
                      </div>
                      
                      {useAddressSelector ? (
                        <AddressSelector 
                          type="from"
                          onAddressSelect={handleFromAddressSelect}
                          selectedAddressId={selectedFromAddressId}
                        />
                      ) : (
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
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium">Destination Address</h3>
                        {/* Optional: Add a similar toggle for destination address if needed */}
                      </div>
                      
                      {/* Address verification status */}
                      {toAddressVerification.messages.length > 0 && (
                        <Alert className="mb-4" variant={toAddressVerification.isVerified ? "default" : "destructive"}>
                          {toAddressVerification.isVerified ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <AlertCircle className="h-4 w-4" />
                          )}
                          <AlertTitle>{toAddressVerification.isVerified ? "Address Verified" : "Address Issues"}</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc pl-4 mt-2">
                              {toAddressVerification.messages.map((message, i) => (
                                <li key={i}>{message}</li>
                              ))}
                            </ul>
                            {!toAddressVerification.isVerified && toAddressVerification.verifiedAddress && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="mt-2"
                                onClick={useVerifiedAddress}
                              >
                                Use Suggested Address
                              </Button>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      
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
                        
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleVerifyAddress}
                            disabled={toAddressVerification.isVerifying}
                          >
                            {toAddressVerification.isVerifying ? 'Verifying...' : 'Verify Address'}
                          </Button>
                        </div>
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
