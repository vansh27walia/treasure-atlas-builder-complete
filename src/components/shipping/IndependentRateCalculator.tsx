
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MapPin, Package, Loader2, ArrowRight, Globe } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

const calculatorSchema = z.object({
  fromCountry: z.string().min(1, "From country is required"),
  fromZip: z.string().min(1, "From ZIP code is required"),
  toCountry: z.string().min(1, "To country is required"),
  toZip: z.string().min(1, "To ZIP code is required"),
  packageType: z.string().min(1, "Package type is required"),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
  weightUnit: z.enum(["lb", "kg", "oz"]),
  length: z.coerce.number().min(0.1, "Length must be greater than 0"),
  width: z.coerce.number().min(0.1, "Width must be greater than 0"),
  height: z.coerce.number().min(0.1, "Height must be greater than 0"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
];

const packageTypes = [
  { value: 'box', label: 'Standard Box', icon: '📦' },
  { value: 'envelope', label: 'Envelope', icon: '✉️' },
  { value: 'FlatRateEnvelope', label: 'USPS Flat Rate Envelope', icon: '📮' },
  { value: 'SmallFlatRateBox', label: 'USPS Small Flat Rate Box', icon: '📦' },
  { value: 'MediumFlatRateBox', label: 'USPS Medium Flat Rate Box', icon: '📦' },
];

const IndependentRateCalculator: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const navigate = useNavigate();

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      fromCountry: 'US',
      fromZip: '',
      toCountry: 'US',
      toZip: '',
      packageType: '',
      weight: 0,
      weightUnit: 'lb',
      length: 0,
      width: 0,
      height: 0,
    }
  });

  const handleCalculateRates = async (values: CalculatorFormValues) => {
    setIsCalculating(true);
    setRates([]);
    
    try {
      // Get Google API key
      const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('get-google-api-key');
      
      if (apiKeyError || !apiKeyData?.apiKey) {
        throw new Error('Google API key not configured');
      }

      // Get addresses from Google Maps using ZIP codes
      const getAddressFromZip = async (countryCode: string, zipCode: string) => {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode},${countryCode}&key=${apiKeyData.apiKey}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const components = result.address_components;
          
          // Extract address components
          const getComponent = (types: string[]) => {
            const component = components.find((comp: any) => 
              comp.types.some((type: string) => types.includes(type))
            );
            return component?.long_name || '';
          };

          return {
            name: 'Customer',
            street1: getComponent(['street_number']) + ' ' + getComponent(['route']),
            city: getComponent(['locality', 'administrative_area_level_2']),
            state: getComponent(['administrative_area_level_1']),
            zip: zipCode,
            country: countryCode,
            phone: '555-555-5555'
          };
        }
        throw new Error(`Could not find address for ZIP code: ${zipCode}`);
      };

      // Get both addresses
      const fromAddress = await getAddressFromZip(values.fromCountry, values.fromZip);
      const toAddress = await getAddressFromZip(values.toCountry, values.toZip);

      // Convert weight to ounces for consistent processing
      let weightOz = values.weight;
      if (values.weightUnit === 'kg') {
        weightOz = values.weight * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = values.weight * 16;
      }

      // Build parcel object
      const parcel = {
        length: values.length,
        width: values.width,
        height: values.height,
        weight: weightOz,
      };

      // Prepare the request payload
      const payload = {
        fromAddress,
        toAddress,
        parcel,
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };

      console.log('Rate calculator payload:', JSON.stringify(payload, null, 2));

      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data.rates && Array.isArray(data.rates)) {
        setRates(data.rates);
        toast.success("Rates calculated successfully!");
      } else {
        toast.info('No rates available for this route');
      }
      
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to calculate rates. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleShipThis = (rate: any) => {
    // Store the rate data in localStorage to pre-fill the main form
    const shipmentData = {
      rate,
      fromCountry: form.getValues('fromCountry'),
      fromZip: form.getValues('fromZip'),
      toCountry: form.getValues('toCountry'),
      toZip: form.getValues('toZip'),
      packageType: form.getValues('packageType'),
      weight: form.getValues('weight'),
      weightUnit: form.getValues('weightUnit'),
      length: form.getValues('length'),
      width: form.getValues('width'),
      height: form.getValues('height'),
    };
    
    localStorage.setItem('preFilledShipment', JSON.stringify(shipmentData));
    
    // Navigate to main shipping form
    navigate('/create-label');
    toast.success('Shipping form pre-filled with your selection!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Independent Rate Calculator</h1>
        </div>
        <p className="text-lg text-gray-600">
          Get instant shipping rate estimates using just country and ZIP code
        </p>
      </div>

      {/* Calculator Form */}
      <Card className="shadow-lg border-blue-200/50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCalculateRates)} className="space-y-6">
              
              {/* From Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">From Location</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="Enter ZIP code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* To Location */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-800">To Location</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="toCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.value} value={country.value}>
                                {country.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="Enter ZIP code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Package Type */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Package Type</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Package Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose package type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {packageTypes.map((pkg) => (
                            <SelectItem key={pkg.value} value={pkg.value}>
                              <div className="flex items-center gap-2">
                                <span>{pkg.icon}</span>
                                <span>{pkg.label}</span>
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

              {/* Dimensions and Weight */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Dimensions & Weight</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dimensions */}
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
                            <FormLabel>Width</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                placeholder="0"
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
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  {/* Weight */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Weight</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.1" 
                                placeholder="0"
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
                            <FormLabel>Unit</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="lb">Pounds (lb)</SelectItem>
                                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                <SelectItem value="oz">Ounces (oz)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Calculating Rates...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate Shipping Rates
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Rate Results */}
      {rates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Available Rates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rates.map((rate, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rate.carrier?.toUpperCase()}</CardTitle>
                    <div className="text-2xl font-bold text-blue-600">
                      ${parseFloat(rate.rate).toFixed(2)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rate.service}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {rate.delivery_days && (
                      <p className="text-sm text-gray-600">
                        Delivery: {rate.delivery_days} business days
                      </p>
                    )}
                    {rate.est_delivery_date && (
                      <p className="text-sm text-gray-600">
                        Est. Delivery: {new Date(rate.est_delivery_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => handleShipThis(rate)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    Ship This
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndependentRateCalculator;
