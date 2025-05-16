
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/sonner';
import { AlertCircle, ArrowRight, Check, Package, Scale } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { carrierService } from '@/services/CarrierService';
import { useNavigate } from 'react-router-dom';

const shippingFormSchema = z.object({
  // From address fields
  fromName: z.string().min(1, { message: 'Name is required' }),
  fromCompany: z.string().optional(),
  fromAddress1: z.string().min(1, { message: 'Address line 1 is required' }),
  fromAddress2: z.string().optional(),
  fromCity: z.string().min(1, { message: 'City is required' }),
  fromState: z.string().min(1, { message: 'State is required' }),
  fromZip: z.string().min(1, { message: 'ZIP code is required' }),
  fromCountry: z.string().min(1, { message: 'Country is required' }),
  
  // To address fields
  toName: z.string().min(1, { message: 'Name is required' }),
  toCompany: z.string().optional(),
  toAddress1: z.string().min(1, { message: 'Address line 1 is required' }),
  toAddress2: z.string().optional(),
  toCity: z.string().min(1, { message: 'City is required' }),
  toState: z.string().min(1, { message: 'State is required' }),
  toZip: z.string().min(1, { message: 'ZIP code is required' }),
  toCountry: z.string().min(1, { message: 'Country is required' }),
  
  // Package details
  packageType: z.string().min(1, { message: 'Package type is required' }),
  weightLb: z.coerce.number().min(0, { message: 'Weight must be greater than 0' }),
  weightOz: z.coerce.number().min(0, { message: 'Weight must be greater than 0' }).optional(),
  packageValue: z.coerce.number().min(0, { message: 'Value must be greater than 0' }).optional(),
  length: z.coerce.number().min(0, { message: 'Length must be greater than 0' }),
  width: z.coerce.number().min(0, { message: 'Width must be greater than 0' }),
  height: z.coerce.number().min(0, { message: 'Height must be greater than 0' }),
  
  // Shipping options
  signatureRequired: z.boolean().optional(),
  insurance: z.boolean().optional(),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

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

const EnhancedShippingForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [toAddressVerification, setToAddressVerification] = useState<AddressVerificationState>({
    isVerifying: false,
    isVerified: false,
    messages: []
  });
  
  // Initialize form
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
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
      signatureRequired: false,
      insurance: false,
    }
  });
  
  // Update workflow step on mount
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step: 'address' }
    }));
  }, []);
  
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
      
      // Call the address verification service
      const verifiedAddress = await carrierService.verifyAddress(addressToVerify);
      
      // Address is valid
      setToAddressVerification({
        isVerifying: false,
        isVerified: true,
        messages: ['Address is valid'],
        verifiedAddress
      });
      
      toast.success("Address verified successfully");
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

  // Handle form submission to get rates
  const handleGetRates = async (values: ShippingFormValues) => {
    setIsLoading(true);
    try {
      // Calculate total weight in ounces
      const weightOz = (values.weightLb * 16) + (values.weightOz || 0);
      
      // Prepare the request payload
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
          insurance: values.insurance ? (values.packageValue * 100) : undefined, // Convert to cents
        }
      };

      // Get shipping rates
      const rates = await carrierService.getShippingRates(payload);
      
      // Save form data to session storage
      sessionStorage.setItem('shipping-form-data', JSON.stringify(values));
      
      // Dispatch event to update rates
      document.dispatchEvent(new CustomEvent('shipping-rates-updated', { 
        detail: { rates } 
      }));
      
      // Update workflow step
      document.dispatchEvent(new CustomEvent('shipping-step-change', { 
        detail: { step: 'rates' }
      }));
      
      // Scroll to rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }

      toast.success("Shipping rates retrieved successfully");
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error("Failed to get shipping rates. Please check your input and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-gray-200 bg-white shadow-sm">
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* From Address Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                  <Package className="mr-2 h-5 w-5 text-blue-600" />
                  Origin Address
                </h3>
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
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
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
                            <Input {...field} placeholder="State" />
                          </FormControl>
                          <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* To Address Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                  <Package className="mr-2 h-5 w-5 text-blue-600" />
                  Destination Address
                </h3>
                
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
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
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
                            <Input {...field} placeholder="State" />
                          </FormControl>
                          <FormMessage />
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
                        <FormMessage />
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
                        <FormMessage />
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
            
            {/* Package Details Section */}
            <div className="mt-8 border-t pt-8 border-gray-200">
              <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                <Scale className="mr-2 h-5 w-5 text-blue-600" />
                Package Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left column for package details */}
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
                              step="0.1"
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
                              step="0.1"
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
                              step="0.1"
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
                              step="0.1"
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
                
                {/* Right column for shipping options */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="signatureRequired"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <input
                          id="signature"
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="signature" className="block text-sm font-medium text-gray-700">
                          Signature Required
                        </label>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <input
                          id="insurance"
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="insurance" className="block text-sm font-medium text-gray-700">
                          Add Insurance
                        </label>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="mt-8 flex justify-end border-t pt-6 border-gray-200">
              <Button 
                type="submit" 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? 'Getting Rates...' : 'Show Shipping Rates'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
};

export default EnhancedShippingForm;
