
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Package, Truck, Shield, AlertTriangle, DollarSign, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import EnhancedWorkflowTracker from './EnhancedWorkflowTracker';
import { Checkbox } from '@/components/ui/checkbox';

const shippingSchema = z.object({
  fromName: z.string().min(1, "Name is required"),
  fromStreet: z.string().min(1, "Street address is required"),
  fromCity: z.string().min(1, "City is required"),
  fromState: z.string().min(1, "State is required"),
  fromZip: z.string().min(5, "Valid ZIP code required"),
  toName: z.string().min(1, "Name is required"),
  toStreet: z.string().min(1, "Street address is required"),
  toCity: z.string().min(1, "City is required"),
  toState: z.string().min(1, "State is required"),
  toZip: z.string().min(5, "Valid ZIP code required"),
  boxType: z.string().min(1, "Box type is required"),
  carrier: z.string().min(1, "Carrier is required"),
  weightLbs: z.coerce.number().min(0, "Weight must be 0 or greater").default(0),
  weightOz: z.coerce.number().min(0, "Weight must be 0 or greater").max(15, "Ounces must be 15 or less").default(0),
  length: z.coerce.number().min(0.1, "Length must be greater than 0").default(0),
  width: z.coerce.number().min(0.1, "Width must be greater than 0").default(0),
  height: z.coerce.number().min(0.1, "Height must be greater than 0").default(0),
  enableTracking: z.boolean().default(true),
  insuranceValue: z.coerce.number().min(0).default(100),
  hazardousMaterial: z.boolean().default(false),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

const boxTypes = [
  { id: 'small_box', name: 'Small Box', icon: '📦', description: 'Up to 12x9x3 inches' },
  { id: 'medium_box', name: 'Medium Box', icon: '📦', description: 'Up to 18x14x8 inches' },
  { id: 'large_box', name: 'Large Box', icon: '📦', description: 'Up to 24x18x12 inches' },
  { id: 'envelope', name: 'Envelope', icon: '📨', description: 'Flat documents' },
  { id: 'usps_priority', name: 'USPS Priority Mail Box', icon: '🇺🇸', description: 'Free USPS packaging' },
  { id: 'usps_flat_rate', name: 'USPS Flat Rate Box', icon: '🇺🇸', description: 'One rate, any weight' },
  { id: 'fedex_box', name: 'FedEx Box', icon: '🚚', description: 'FedEx branded packaging' },
  { id: 'ups_box', name: 'UPS Box', icon: '🚛', description: 'UPS branded packaging' },
  { id: 'custom', name: 'Custom Dimensions', icon: '📏', description: 'Enter your own size' },
];

const carriers = [
  { id: 'usps', name: 'USPS', logo: '🇺🇸', description: 'United States Postal Service' },
  { id: 'ups', name: 'UPS', logo: '🚛', description: 'United Parcel Service' },
  { id: 'fedex', name: 'FedEx', logo: '🚚', description: 'Federal Express' },
  { id: 'dhl', name: 'DHL', logo: '🟡', description: 'DHL Express' },
];

const RedesignedShippingForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates'>('address');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fromName: '',
      fromStreet: '',
      fromCity: '',
      fromState: '',
      fromZip: '',
      toName: '',
      toStreet: '',
      toCity: '',
      toState: '',
      toZip: '',
      boxType: '',
      carrier: '',
      weightLbs: 0,
      weightOz: 0,
      length: 0,
      width: 0,
      height: 0,
      enableTracking: true,
      insuranceValue: 100,
      hazardousMaterial: false,
    }
  });

  const handleSubmit = async (values: ShippingFormValues) => {
    setIsSubmitting(true);
    setCurrentStep('rates');
    
    try {
      // Calculate total weight in ounces
      const totalWeightOz = (values.weightLbs * 16) + values.weightOz;
      
      const payload = {
        fromAddress: {
          name: values.fromName,
          street1: values.fromStreet,
          city: values.fromCity,
          state: values.fromState,
          zip: values.fromZip,
          country: 'US',
        },
        toAddress: {
          name: values.toName,
          street1: values.toStreet,
          city: values.toCity,
          state: values.toState,
          zip: values.toZip,
          country: 'US',
        },
        parcel: {
          length: values.length,
          width: values.width,
          height: values.height,
          weight: totalWeightOz,
        },
        options: {
          signature_confirmation: values.enableTracking,
          insurance: values.insuranceValue * 100, // Convert to cents
        }
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) throw error;

      // Dispatch rates to ShippingRates component
      document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
        detail: { rates: data.rates, shipmentId: data.shipmentId } 
      }));

      toast.success("Shipping rates retrieved successfully!");
      
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error("Failed to get shipping rates. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnhancedWorkflowTracker currentStep={currentStep} />
      
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-3">
              <Package className="h-8 w-8" />
              Create Shipping Label
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                
                {/* Pickup Address Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Pickup Address</h3>
                      <p className="text-sm text-gray-600">Where are you shipping from?</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="fromStreet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="fromCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="fromState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
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
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Box Type Selection */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Box Type Selection</h3>
                      <p className="text-sm text-gray-600">Choose your packaging type</p>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="boxType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full h-16 text-left">
                              <SelectValue placeholder="Select a box type..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80">
                            {boxTypes.map((box) => (
                              <SelectItem key={box.id} value={box.id} className="h-16">
                                <div className="flex items-center gap-4 w-full">
                                  <span className="text-2xl">{box.icon}</span>
                                  <div className="flex-1">
                                    <div className="font-medium">{box.name}</div>
                                    <div className="text-sm text-gray-500">{box.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Carrier Selection */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Carrier Selection</h3>
                      <p className="text-sm text-gray-600">Choose your preferred carrier</p>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full h-16 text-left">
                              <SelectValue placeholder="Select a carrier..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carriers.map((carrier) => (
                              <SelectItem key={carrier.id} value={carrier.id} className="h-16">
                                <div className="flex items-center gap-4 w-full">
                                  <span className="text-2xl">{carrier.logo}</span>
                                  <div className="flex-1">
                                    <div className="font-medium">{carrier.name}</div>
                                    <div className="text-sm text-gray-500">{carrier.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dimensions Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Package Dimensions</h3>
                      <p className="text-sm text-gray-600">Enter package size and weight</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weight Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Weight</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="weightLbs"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pounds</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                              <FormLabel>Ounces</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="15"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Dimensions Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Dimensions (inches)</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="length"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Length</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.1"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                              <FormLabel>Width</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.1"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                              <FormLabel>Height</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.1"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Shipping Options</h3>
                      <p className="text-sm text-gray-600">Additional services and protection</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tracking Option */}
                    <FormField
                      control={form.control}
                      name="enableTracking"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Enable Tracking
                            </FormLabel>
                            <p className="text-sm text-gray-600">Track your package in real-time</p>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    {/* Insurance Option */}
                    <FormField
                      control={form.control}
                      name="insuranceValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Insurance Value ($)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input 
                                type="number" 
                                min="0"
                                step="10"
                                className="pl-10"
                                placeholder="100"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value) || 100)}
                              />
                            </div>
                          </FormControl>
                          <p className="text-sm text-gray-600">Default: $100 coverage</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Hazardous Material Option */}
                    <FormField
                      control={form.control}
                      name="hazardousMaterial"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              Hazardous Material
                            </FormLabel>
                            <p className="text-sm text-gray-600">Contains dangerous goods</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Drop-off Address Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Drop-off Address</h3>
                      <p className="text-sm text-gray-600">Where are you shipping to?</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="toName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="toStreet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="456 Oak Avenue" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="toCity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Los Angeles" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="toState"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="CA" {...field} />
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
                              <Input placeholder="90210" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-4 text-lg font-semibold rounded-lg shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Package className="h-5 w-5 animate-spin mr-2" />
                        Getting Rates...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Get Shipping Rates
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedesignedShippingForm;
