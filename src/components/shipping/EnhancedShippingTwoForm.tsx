
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Package, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { carrierService } from '@/services/CarrierService';
import { ShippingAddress } from '@/types/shipping';
import { cn } from '@/lib/utils';
import { addressSchema } from '@/utils/addressUtils';

// Form validation schema
const shippingFormSchema = z.object({
  // From address
  fromName: z.string().min(2, { message: "Name is required" }),
  fromCompany: z.string().optional(),
  fromStreet1: z.string().min(3, { message: "Street address is required" }),
  fromStreet2: z.string().optional(),
  fromCity: z.string().min(2, { message: "City is required" }),
  fromState: z.string().min(2, { message: "State is required" }),
  fromZip: z.string().min(5, { message: "ZIP code is required" }),
  fromCountry: z.string().min(2, { message: "Country is required" }),
  fromPhone: z.string().optional(),
  fromEmail: z.string().email({ message: "Valid email is required" }).optional(),
  
  // To address
  toName: z.string().min(2, { message: "Name is required" }),
  toCompany: z.string().optional(),
  toStreet1: z.string().min(3, { message: "Street address is required" }),
  toStreet2: z.string().optional(),
  toCity: z.string().min(2, { message: "City is required" }),
  toState: z.string().min(2, { message: "State is required" }),
  toZip: z.string().min(5, { message: "ZIP code is required" }),
  toCountry: z.string().min(2, { message: "Country is required" }),
  toPhone: z.string().optional(),
  toEmail: z.string().email({ message: "Valid email is required" }).optional(),
  toIsResidential: z.boolean().default(true),
  
  // Package details
  packageLength: z.coerce.number().min(0.1, { message: "Length must be greater than 0" }),
  packageWidth: z.coerce.number().min(0.1, { message: "Width must be greater than 0" }),
  packageHeight: z.coerce.number().min(0.1, { message: "Height must be greater than 0" }),
  packageWeight: z.coerce.number().min(0.1, { message: "Weight must be greater than 0" }),
  
  // Options
  signature: z.boolean().default(false),
  insurance: z.boolean().default(false),
  insuranceValue: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof shippingFormSchema>;

const EnhancedShippingTwoForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'address' | 'package'>('address');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fromName: '',
      fromCompany: '',
      fromStreet1: '',
      fromStreet2: '',
      fromCity: '',
      fromState: '',
      fromZip: '',
      fromCountry: 'US',
      fromPhone: '',
      fromEmail: '',
      
      toName: '',
      toCompany: '',
      toStreet1: '',
      toStreet2: '',
      toCity: '',
      toState: '',
      toZip: '',
      toCountry: 'US',
      toPhone: '',
      toEmail: '',
      toIsResidential: true,
      
      packageLength: 12,
      packageWidth: 9,
      packageHeight: 6,
      packageWeight: 1,
      
      signature: false,
      insurance: false,
      insuranceValue: 0,
      description: '',
    }
  });
  
  const usStates = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ];
  
  const handleNextTab = () => {
    if (activeTab === 'address') {
      // Validate address fields before proceeding
      form.trigger([
        'fromName', 'fromStreet1', 'fromCity', 'fromState', 'fromZip', 'fromCountry',
        'toName', 'toStreet1', 'toCity', 'toState', 'toZip', 'toCountry'
      ]).then((isValid) => {
        if (isValid) {
          setActiveTab('package');
          // Update workflow step
          document.dispatchEvent(new CustomEvent('shipping-step-change', { 
            detail: { step: 'package' }
          }));
        }
      });
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format addresses for the API
      const fromAddress: ShippingAddress = {
        name: data.fromName,
        company: data.fromCompany,
        street1: data.fromStreet1,
        street2: data.fromStreet2,
        city: data.fromCity,
        state: data.fromState,
        zip: data.fromZip,
        country: data.fromCountry,
        phone: data.fromPhone,
        email: data.fromEmail,
        addressType: 'from'
      };
      
      const toAddress: ShippingAddress = {
        name: data.toName,
        company: data.toCompany,
        street1: data.toStreet1,
        street2: data.toStreet2,
        city: data.toCity,
        state: data.toState,
        zip: data.toZip,
        country: data.toCountry,
        phone: data.toPhone,
        email: data.toEmail,
        residential: data.toIsResidential,
        addressType: 'to'
      };
      
      const parcel = {
        length: data.packageLength,
        width: data.packageWidth,
        height: data.packageHeight,
        weight: data.packageWeight
      };
      
      // Additional options
      const options = {
        signature: data.signature,
        insurance: data.insurance ? {
          amount: data.insuranceValue,
          currency: 'USD'
        } : undefined,
        description: data.description
      };
      
      // Get shipping rates from CarrierService
      const rates = await carrierService.getShippingRates({
        fromAddress,
        toAddress,
        parcel,
        options
      });
      
      if (rates && rates.length > 0) {
        // Find the first rate's shipmentId
        const firstRate = rates[0];
        const shipmentId = firstRate.shipment_id;
        
        // Dispatch rates received event with the rates and shipmentId
        document.dispatchEvent(new CustomEvent('easypost-rates-received', {
          detail: {
            rates,
            shipmentId
          }
        }));
        
        toast.success('Shipping rates retrieved successfully');
      } else {
        toast.error('No shipping rates available for this shipment');
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error('Failed to fetch shipping rates');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Update workflow step when component mounts
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step: 'address' }
    }));
  }, []);

  const toStateWatchValue = form.watch('toState');
  const insuranceWatchValue = form.watch('insurance');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'address' | 'package')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-indigo-50 p-1 rounded-lg">
            <TabsTrigger 
              value="address" 
              className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger 
              value="package" 
              className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Package Details
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="address" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* From Address */}
              <Card className="p-6 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-indigo-500" />
                  From Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} className="border-indigo-200 focus:border-indigo-400" />
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
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name (Optional)" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="fromStreet1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="fromStreet2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apt/Suite</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt 4B (Optional)" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="fromCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} className="border-indigo-200 focus:border-indigo-400" />
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
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usStates.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="fromZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} className="border-indigo-200 focus:border-indigo-400" />
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
                        <FormLabel>Country *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="fromPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
              
              {/* To Address */}
              <Card className="p-6 border border-indigo-100 shadow-sm">
                <h3 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-indigo-500" />
                  To Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="toName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" {...field} className="border-indigo-200 focus:border-indigo-400" />
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
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name (Optional)" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="toStreet1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="456 Oak Ave" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="toStreet2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apt/Suite</FormLabel>
                        <FormControl>
                          <Input placeholder="Suite 101 (Optional)" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="toCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} className="border-indigo-200 focus:border-indigo-400" />
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
                        <FormLabel>State *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {usStates.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="toZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="67890" {...field} className="border-indigo-200 focus:border-indigo-400" />
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
                        <FormLabel>Country *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-indigo-200 focus:border-indigo-400">
                              <SelectValue placeholder="Select Country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="toPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="555-987-6543" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="toEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="recipient@example.com" {...field} className="border-indigo-200 focus:border-indigo-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="toIsResidential"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-gray-100">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium">Residential Address</FormLabel>
                          <p className="text-xs text-gray-500">
                            Check if this is a home address, not a business
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Card>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="button" 
                onClick={handleNextTab}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
              >
                Next: Package Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="package" className="space-y-6">
            <Card className="p-6 border border-indigo-100 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center">
                <Package className="mr-2 h-5 w-5 text-indigo-500" />
                Package Dimensions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="packageLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length (in) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-indigo-200 focus:border-indigo-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="packageWidth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (in) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-indigo-200 focus:border-indigo-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="packageHeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (in) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-indigo-200 focus:border-indigo-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="packageWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (lb) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} className="border-indigo-200 focus:border-indigo-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
            
            <Card className="p-6 border border-indigo-100 shadow-sm">
              <h3 className="text-lg font-semibold text-indigo-700 mb-4">Shipping Options</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="signature"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-gray-100">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">Require Signature</FormLabel>
                        <p className="text-xs text-gray-500">
                          Recipient signature will be required for delivery
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="insurance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-gray-100">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">Add Insurance</FormLabel>
                        <p className="text-xs text-gray-500">
                          Protect your package against loss or damage
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                {insuranceWatchValue && (
                  <FormField
                    control={form.control}
                    name="insuranceValue"
                    render={({ field }) => (
                      <FormItem className="ml-10">
                        <FormLabel>Declared Value ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="100.00" 
                            {...field}
                            className="max-w-xs border-indigo-200 focus:border-indigo-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of package contents" 
                          className="resize-none border-indigo-200 focus:border-indigo-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
            
            <div className="flex justify-between">
              <Button 
                type="button" 
                onClick={() => {
                  setActiveTab('address');
                  document.dispatchEvent(new CustomEvent('shipping-step-change', { 
                    detail: { step: 'address' }
                  }));
                }}
                variant="outline" 
                className="border-indigo-200"
              >
                Back to Addresses
              </Button>
              
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Getting Rates...' : 'Get Shipping Rates'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
};

export default EnhancedShippingTwoForm;
