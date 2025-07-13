
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MapPin, Package, Loader2, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import useRateCalculator from '@/hooks/useRateCalculator';
import { GeocodingService, GeneratedAddress } from '@/services/GeocodingService';

const calculatorSchema = z.object({
  fromStreet: z.string().min(1, "From address is required"),
  fromCity: z.string().min(1, "From city is required"),
  fromState: z.string().min(1, "From state is required"),
  fromZip: z.string().min(5, "Valid zip code required"),
  toStreet: z.string().min(1, "To address is required"),
  toCity: z.string().min(1, "To city is required"),
  toState: z.string().min(1, "To state is required"),
  toZip: z.string().min(5, "Valid zip code required"),
  weight: z.coerce.number().min(0.1, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "lb", "kg"]),
  length: z.coerce.number().min(0.1, "Length must be greater than 0"),
  width: z.coerce.number().min(0.1, "Width must be greater than 0"),
  height: z.coerce.number().min(0.1, "Height must be greater than 0"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

const RateCalculator: React.FC = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const { fetchRates, aiRecommendation, isLoading, isAiLoading, selectRateAndProceed } = useRateCalculator();

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      fromStreet: '',
      fromCity: '',
      fromState: '',
      fromZip: '',
      toStreet: '',
      toCity: '',
      toState: '',
      toZip: '',
      weight: 0,
      weightUnit: 'lb',
      length: 0,
      width: 0,
      height: 0,
    }
  });

  const handleCalculateRates = async (values: CalculatorFormValues) => {
    setIsCalculating(true);
    
    try {
      // Create address objects for geocoding
      const fromAddressString = `${values.fromStreet}, ${values.fromCity}, ${values.fromState} ${values.fromZip}`;
      const toAddressString = `${values.toStreet}, ${values.toCity}, ${values.toState} ${values.toZip}`;
      
      // Generate addresses using geocoding service
      const fromAddress: GeneratedAddress = {
        name: 'Sender',
        street1: values.fromStreet,
        city: values.fromCity,
        state: values.fromState,
        zip: values.fromZip,
        country: 'US'
      };

      const toAddress: GeneratedAddress = {
        name: 'Recipient',
        street1: values.toStreet,
        city: values.toCity,
        state: values.toState,
        zip: values.toZip,
        country: 'US'
      };

      // Convert weight to ounces for consistent processing
      let weightOz = values.weight;
      if (values.weightUnit === 'kg') {
        weightOz = values.weight * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = values.weight * 16;
      }

      const parcelData = {
        weight: weightOz,
        length: values.length,
        width: values.width,
        height: values.height,
      };

      // Use the rate calculator hook to fetch rates
      await fetchRates({
        fromAddress,
        toAddress,
        parcel: parcelData,
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      });

      toast.success("Rates calculated successfully!");
      
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error("Failed to calculate rates. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Rate Calculator</h1>
        </div>
        <p className="text-lg text-gray-600">
          Get instant shipping rate estimates from multiple carriers
        </p>
      </div>

      {/* Calculator Form */}
      <Card className="shadow-lg border-blue-200/50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quick Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCalculateRates)} className="space-y-6">
              
              {/* From Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800">From Address</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="fromStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter street address" {...field} />
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
                          <Input placeholder="City" {...field} />
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
                            <Input placeholder="State" {...field} />
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
                            <Input placeholder="ZIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* To Address Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-800">To Address</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="toStreet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter street address" {...field} />
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
                          <Input placeholder="City" {...field} />
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
                            <Input placeholder="State" {...field} />
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
                            <Input placeholder="ZIP" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Package Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Package Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              <SelectItem value="oz">Ounces</SelectItem>
                              <SelectItem value="lb">Pounds</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <FormLabel>Width (in)</FormLabel>
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
                          <FormLabel>Height (in)</FormLabel>
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
              </div>

              {/* Calculate Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                  disabled={isCalculating || isLoading}
                >
                  {(isCalculating || isLoading) ? (
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

      {/* AI Recommendations */}
      {aiRecommendation && (
        <Card className="shadow-lg border-green-200/50">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardTitle className="text-xl">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-gray-700">{aiRecommendation.analysisText}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiRecommendation.bestOverall && (
                  <Button
                    onClick={() => selectRateAndProceed(aiRecommendation.bestOverall!)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Select Best Overall
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                
                {aiRecommendation.bestValue && (
                  <Button
                    onClick={() => selectRateAndProceed(aiRecommendation.bestValue!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Select Best Value
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateCalculator;
