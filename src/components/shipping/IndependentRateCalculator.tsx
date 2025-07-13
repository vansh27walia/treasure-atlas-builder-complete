
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MapPin, Package, Loader2, ArrowRight, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";

const calculatorSchema = z.object({
  country: z.string().min(1, "Country is required"),
  fromZip: z.string().min(5, "Valid ZIP code required"),
  toZip: z.string().min(5, "Valid ZIP code required"),
  weight: z.coerce.number().min(0, "Weight must be 0 or greater").default(0),
  weightUnit: z.enum(["oz", "lb"]).default("lb"),
  length: z.coerce.number().min(0.1, "Length must be greater than 0").default(0),
  width: z.coerce.number().min(0.1, "Width must be greater than 0").default(0),
  height: z.coerce.number().min(0.1, "Height must be greater than 0").default(0),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface RateResult {
  id: string;
  service: string;
  carrier: string;
  rate: number;
  currency: string;
  delivery_days: number;
  delivery_date: string;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
];

const IndependentRateCalculator: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [toAddress, setToAddress] = useState<any>(null);

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      country: 'US',
      fromZip: '',
      toZip: '',
      weight: 0,
      weightUnit: 'lb',
      length: 0,
      width: 0,
      height: 0,
    }
  });

  const fetchAddressFromZip = async (zipCode: string, country: string) => {
    // Simulate Google Maps API call - in real implementation, use Google Places API
    return {
      name: 'Address',
      street1: '123 Main St',
      city: 'City',
      state: 'State',
      zip: zipCode,
      country: country,
      phone: '555-555-5555'
    };
  };

  const handleCalculateRates = async (values: CalculatorFormValues) => {
    setIsCalculating(true);
    setRates([]);
    
    try {
      // Fetch addresses from ZIP codes
      const fromAddr = await fetchAddressFromZip(values.fromZip, values.country);
      const toAddr = await fetchAddressFromZip(values.toZip, values.country);
      
      setFromAddress(fromAddr);
      setToAddress(toAddr);

      // Convert weight to ounces for consistent processing
      let weightOz = values.weight;
      if (values.weightUnit === 'lb') {
        weightOz = values.weight * 16;
      }

      const payload = {
        fromAddress: fromAddr,
        toAddress: toAddr,
        parcel: {
          weight: weightOz,
          length: values.length,
          width: values.width,
          height: values.height,
        }
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) throw error;

      setRates(data.rates || []);
      toast.success("Rates calculated successfully!");
      
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error("Failed to calculate rates. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleShipThis = (rate: RateResult) => {
    // Pre-fill the main shipping form with rate data
    const shipmentData = {
      fromAddress,
      toAddress,
      selectedRate: rate,
      parcel: {
        weight: form.getValues().weight,
        length: form.getValues().length,
        width: form.getValues().width,
        height: form.getValues().height,
      }
    };
    
    // Store in localStorage or context for main form to pick up
    localStorage.setItem('prefilledShipmentData', JSON.stringify(shipmentData));
    
    // Navigate to main shipping form
    window.location.href = '/create-label';
    
    toast.success("Redirecting to shipping form with your selected rate!");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-900">Rate Calculator</h1>
        </div>
        <p className="text-xl text-gray-600">
          Get instant shipping rate estimates from multiple carriers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calculator Form */}
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quick Rate Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCalculateRates)} className="space-y-6">
                
                {/* Country & ZIP Codes */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fromZip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
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
                          <FormLabel>To ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="90210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Weight */}
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
                            onChange={(e) => field.onChange(Number(e.target.value) || 0)}
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
                            <SelectItem value="lb">Pounds</SelectItem>
                            <SelectItem value="oz">Ounces</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length (in)</FormLabel>
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
                        <FormLabel>Width (in)</FormLabel>
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
                        <FormLabel>Height (in)</FormLabel>
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

                {/* Calculate Button */}
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
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Rate Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Rate Results</h2>
          
          {rates.length === 0 && !isCalculating && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 text-center">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Enter your details and calculate rates to see results here</p>
              </CardContent>
            </Card>
          )}
          
          {isCalculating && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Calculating rates from multiple carriers...</p>
              </CardContent>
            </Card>
          )}
          
          {rates.map((rate) => (
            <Card key={rate.id} className="shadow-lg hover:shadow-xl transition-shadow border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rate.service}</h3>
                      <p className="text-sm text-gray-600">{rate.carrier}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 flex items-center">
                      <DollarSign className="h-5 w-5" />
                      {(rate.rate / 100).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {rate.delivery_days} business days
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Estimated delivery: {new Date(rate.delivery_date).toLocaleDateString()}
                  </div>
                  
                  <Button 
                    onClick={() => handleShipThis(rate)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Ship This
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndependentRateCalculator;
