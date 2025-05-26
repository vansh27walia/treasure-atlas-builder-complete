
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader, Search, Package, MapPin, ArrowRight, Globe } from 'lucide-react';
import useRateCalculator from '@/hooks/useRateCalculator';
import ZipCodeInput from './ZipCodeInput';
import { Input } from '@/components/ui/input';
import CountrySelector from '../freight/CountrySelector';
import { GeocodingService } from '@/services/GeocodingService';
import { toast } from '@/components/ui/sonner';

const rateFormSchema = z.object({
  fromZip: z.string().min(3, { message: 'ZIP/Postal code must be at least 3 characters' }),
  toZip: z.string().min(3, { message: 'ZIP/Postal code must be at least 3 characters' }),
  fromCountry: z.string().min(2, { message: 'Please select origin country' }),
  toCountry: z.string().min(2, { message: 'Please select destination country' }),
  weight: z.coerce.number().min(0.1, { message: 'Weight must be greater than 0' }),
  length: z.coerce.number().min(0.1, { message: 'Length must be greater than 0' }),
  width: z.coerce.number().min(0.1, { message: 'Width must be greater than 0' }),
  height: z.coerce.number().min(0.1, { message: 'Height must be greater than 0' }),
  weightUnit: z.enum(['lb', 'kg']),
  dimensionUnit: z.enum(['in', 'cm']),
  carrierFilter: z.string(),
});

type RateFormValues = z.infer<typeof rateFormSchema>;

const CARRIER_OPTIONS = [
  { value: 'all', label: 'All Carriers' },
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'canadapost', label: 'Canada Post' },
  { value: 'royalmail', label: 'Royal Mail (UK)' },
];

const RateCalculator: React.FC = () => {
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  const { fetchRates, isLoading } = useRateCalculator();
  
  const form = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: {
      fromZip: '',
      toZip: '',
      fromCountry: 'US',
      toCountry: 'US',
      weight: 1,
      length: 8,
      width: 8,
      height: 2,
      weightUnit: 'lb',
      dimensionUnit: 'in',
      carrierFilter: 'all',
    },
  });

  const onSubmit = async (data: RateFormValues) => {
    try {
      setIsGeneratingAddress(true);
      
      // Generate addresses from ZIP codes using Google Maps API
      const [fromAddress, toAddress] = await Promise.all([
        GeocodingService.generateAddressFromZip(data.fromZip),
        GeocodingService.generateAddressFromZip(data.toZip)
      ]);
      
      // Update addresses with selected countries
      fromAddress.country = data.fromCountry;
      toAddress.country = data.toCountry;
      
      console.log('Generated addresses:', { fromAddress, toAddress });
      
      // Calculate weight in ounces based on selected unit
      const weightInOz = data.weightUnit === 'lb' 
        ? data.weight * 16
        : data.weight * 35.274;
      
      // Convert dimensions to inches if in cm
      const conversionFactor = data.dimensionUnit === 'cm' ? 0.393701 : 1;
      
      // Get selected carriers
      let selectedCarriers: string[] = [];
      if (data.carrierFilter === 'all') {
        selectedCarriers = ['usps', 'ups', 'fedex', 'dhl', 'canadapost', 'royalmail'];
      } else {
        selectedCarriers = [data.carrierFilter];
      }
      
      // Prepare the request data for the API
      const requestData = {
        fromAddress,
        toAddress,
        parcel: {
          weight: weightInOz,
          length: data.length * conversionFactor,
          width: data.width * conversionFactor,
          height: data.height * conversionFactor,
        },
        carriers: selectedCarriers
      };
      
      console.log("Sending rate request with generated addresses:", requestData);

      // Fetch rates from the API
      await fetchRates(requestData);
      
      // Smooth scroll to rates section without jumping
      setTimeout(() => {
        const ratesSection = document.getElementById('shipping-rates-section');
        if (ratesSection) {
          ratesSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast.error(error.message || 'Failed to calculate shipping rates');
    } finally {
      setIsGeneratingAddress(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
        <CardHeader className="text-center pb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-4xl font-bold mb-3">
            Global Shipping Rate Calculator
          </CardTitle>
          <p className="text-blue-100 text-lg font-medium">
            Compare rates from major carriers worldwide
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Carrier Selection - Moved to top */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-semibold text-blue-800">Carrier Selection</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="carrierFilter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-gray-700">
                        Choose Shipping Carriers
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 text-lg border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500">
                            <SelectValue placeholder="Select carriers to compare" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-2 border-blue-200 shadow-xl z-50">
                          {CARRIER_OPTIONS.map((carrier) => (
                            <SelectItem 
                              key={carrier.value} 
                              value={carrier.value}
                              className="py-3 px-4 text-lg hover:bg-blue-50 focus:bg-blue-50"
                            >
                              {carrier.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Origin and Destination Section */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-semibold text-blue-800">Shipping Locations</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Origin */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <span className="text-green-600 font-bold text-lg">FROM</span>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800">Origin</h4>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="fromCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            Origin Country
                          </FormLabel>
                          <FormControl>
                            <CountrySelector
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select origin country"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fromZip"
                      render={({ field }) => (
                        <ZipCodeInput
                          label="Origin ZIP/Postal Code"
                          placeholder="Enter ZIP or postal code"
                          value={field.value}
                          onChange={field.onChange}
                          error={form.formState.errors.fromZip?.message}
                        />
                      )}
                    />
                  </div>
                  
                  {/* Destination */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <span className="text-blue-600 font-bold text-lg">TO</span>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800">Destination</h4>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="toCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            Destination Country
                          </FormLabel>
                          <FormControl>
                            <CountrySelector
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select destination country"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="toZip"
                      render={({ field }) => (
                        <ZipCodeInput
                          label="Destination ZIP/Postal Code"
                          placeholder="Enter ZIP or postal code"
                          value={field.value}
                          onChange={field.onChange}
                          error={form.formState.errors.toZip?.message}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Package Details Section */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-semibold text-blue-800">Package Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-lg font-medium">Package Weight</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500" 
                                {...field} 
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
                          <FormItem className="w-28">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border-2 border-blue-200 shadow-xl z-50">
                                <SelectItem value="lb" className="text-lg">lb</SelectItem>
                                <SelectItem value="kg" className="text-lg">kg</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="dimensionUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-medium">Dimension Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-2 border-blue-200 shadow-xl z-50">
                              <SelectItem value="in" className="text-lg">inches</SelectItem>
                              <SelectItem value="cm" className="text-lg">centimeters</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-lg font-medium">Length</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500" 
                                {...field} 
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
                            <FormLabel className="text-lg font-medium">Width</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500" 
                                {...field} 
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
                            <FormLabel className="text-lg font-medium">Height</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                className="h-12 text-lg border-2 border-blue-200 focus:border-blue-500" 
                                {...field} 
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
              
              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button 
                  type="submit" 
                  disabled={isLoading || isGeneratingAddress}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-16 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                >
                  {isGeneratingAddress ? (
                    <>
                      <Loader className="mr-4 h-6 w-6 animate-spin" />
                      Generating Addresses...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader className="mr-4 h-6 w-6 animate-spin" />
                      Finding Best Rates...
                    </>
                  ) : (
                    <>
                      <Search className="mr-4 h-6 w-6" />
                      Get Shipping Quotes
                      <ArrowRight className="ml-4 h-6 w-6" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RateCalculator;
