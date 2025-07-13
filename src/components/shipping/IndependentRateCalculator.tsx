
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
import CarrierLogo from './CarrierLogo';

const calculatorSchema = z.object({
  fromCountry: z.string().min(1, "From country is required"),
  fromZip: z.string().min(1, "From ZIP code is required"),
  toCountry: z.string().min(1, "To country is required"),
  toZip: z.string().min(1, "To ZIP code is required"),
  packageType: z.string().min(1, "Package type is required"),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
  weightUnit: z.enum(["lb", "kg", "oz"]),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
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
  { value: 'envelope', label: 'Standard Envelope', icon: '✉️', requiresDimensions: true },
  { value: 'large-envelope', label: 'Large Envelope', icon: '📨', requiresDimensions: true },
  { value: 'small-box', label: 'Small Box', icon: '📦', requiresDimensions: true },
  { value: 'medium-box', label: 'Medium Box', icon: '📦', requiresDimensions: true },
  { value: 'large-box', label: 'Large Box', icon: '📦', requiresDimensions: true },
  { value: 'usps-flat-envelope', label: 'USPS Flat Rate Envelope', icon: '📮', requiresDimensions: false },
  { value: 'usps-small-flat-box', label: 'USPS Small Flat Rate Box', icon: '📦', requiresDimensions: false },
  { value: 'usps-medium-flat-box', label: 'USPS Medium Flat Rate Box', icon: '📦', requiresDimensions: false },
];

const IndependentRateCalculator: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedPackageType, setSelectedPackageType] = useState<string>('');
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

  const selectedPackage = packageTypes.find(pkg => pkg.value === selectedPackageType);
  const requiresDimensions = selectedPackage?.requiresDimensions ?? true;

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

      // Build parcel object based on package type
      let parcel;
      if (requiresDimensions) {
        parcel = {
          length: values.length || 1,
          width: values.width || 1,
          height: values.height || 1,
          weight: weightOz,
        };
      } else {
        // For flat rate packages, use predefined dimensions
        parcel = {
          length: 12,
          width: 9,
          height: 1,
          weight: weightOz,
        };
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
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
          <Card className="shadow-lg border-blue-200/50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle className="text-xl flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Rate Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCalculateRates)} className="space-y-8">
                  
                  {/* Location Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* From Location */}
                    <Card className="border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                          <Globe className="h-5 w-5" />
                          From Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
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
                      </CardContent>
                    </Card>

                    {/* To Location */}
                    <Card className="border-red-200">
                      <CardHeader className="bg-red-50">
                        <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                          <MapPin className="h-5 w-5" />
                          To Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
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
                      </CardContent>
                    </Card>
                  </div>

                  {/* Package Details Section */}
                  <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                        <Package className="h-5 w-5" />
                        Package Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      
                      {/* Package Type Selection */}
                      <FormField
                        control={form.control}
                        name="packageType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">Select Package Type</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {packageTypes.map((pkg) => (
                                <div 
                                  key={pkg.value}
                                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                                    field.value === pkg.value ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => {
                                    field.onChange(pkg.value);
                                    setSelectedPackageType(pkg.value);
                                  }}
                                >
                                  <input 
                                    type="radio" 
                                    name="packageType" 
                                    value={pkg.value} 
                                    checked={field.value === pkg.value}
                                    onChange={() => {}}
                                    className="text-blue-600" 
                                  />
                                  <span className="text-lg">{pkg.icon}</span>
                                  <span className="text-xs text-center">{pkg.label}</span>
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Weight Section - Always visible */}
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Weight</Label>
                        <div className="flex gap-2 mb-3">
                          <Button 
                            type="button" 
                            variant={form.getValues('weightUnit') === 'lb' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => form.setValue('weightUnit', 'lb')}
                          >
                            Pounds
                          </Button>
                          <Button 
                            type="button" 
                            variant={form.getValues('weightUnit') === 'kg' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => form.setValue('weightUnit', 'kg')}
                          >
                            Kilograms
                          </Button>
                          <Button 
                            type="button" 
                            variant={form.getValues('weightUnit') === 'oz' ? 'default' : 'outline'} 
                            size="sm"
                            onClick={() => form.setValue('weightUnit', 'oz')}
                          >
                            Ounces
                          </Button>
                        </div>
                        <FormField
                          control={form.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.1" 
                                  placeholder={`Weight in ${form.getValues('weightUnit')}`}
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Dimensions Section - Only for non-flat rate packages */}
                      {requiresDimensions && (
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
                      )}
                    </CardContent>
                  </Card>

                  {/* Calculate Button */}
                  <div className="text-center">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
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
                  <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-200 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CarrierLogo carrier={rate.carrier} size="sm" />
                          <CardTitle className="text-lg">{rate.carrier?.toUpperCase()}</CardTitle>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ${parseFloat(rate.rate).toFixed(2)}
                          </div>
                          {rate.list_rate && rate.list_rate !== rate.rate && (
                            <div className="text-sm text-gray-500 line-through">
                              ${parseFloat(rate.list_rate).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{rate.service}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 mb-4">
                        {rate.delivery_days && (
                          <p className="text-sm text-gray-600">
                            <strong>Delivery:</strong> {rate.delivery_days} business days
                          </p>
                        )}
                        {rate.est_delivery_date && (
                          <p className="text-sm text-gray-600">
                            <strong>Est. Delivery:</strong> {new Date(rate.est_delivery_date).toLocaleDateString()}
                          </p>
                        )}
                        {rate.list_rate && rate.list_rate !== rate.rate && (
                          <p className="text-sm text-green-600">
                            <strong>You Save:</strong> ${(parseFloat(rate.list_rate) - parseFloat(rate.rate)).toFixed(2)}
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
      </div>
    </div>
  );
};

export default IndependentRateCalculator;
