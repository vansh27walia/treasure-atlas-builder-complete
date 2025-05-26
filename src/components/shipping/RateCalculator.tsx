
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader, Search, Package, MapPin, ArrowRight } from 'lucide-react';
import useRateCalculator from '@/hooks/useRateCalculator';
import ZipCodeInput from './ZipCodeInput';
import { Input } from '@/components/ui/input';
import { GeocodingService } from '@/services/GeocodingService';
import { toast } from '@/components/ui/sonner';

const rateFormSchema = z.object({
  fromZip: z.string().min(5, { message: 'ZIP code must be at least 5 digits' }),
  toZip: z.string().min(5, { message: 'ZIP code must be at least 5 digits' }),
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
      
      // Scroll to the rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast.error(error.message || 'Failed to calculate shipping rates');
    } finally {
      setIsGeneratingAddress(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-blue-800 mb-2">
            Instant Shipping Quotes
          </CardTitle>
          <p className="text-blue-600 text-lg">
            Enter ZIP codes to get rates from major carriers
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* ZIP Code Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-semibold text-blue-800">Shipping Locations</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                        <span className="text-blue-600 font-bold">FROM</span>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="fromZip"
                      render={({ field }) => (
                        <ZipCodeInput
                          label="Origin ZIP Code"
                          placeholder="Enter ZIP code (e.g., 10001)"
                          value={field.value}
                          onChange={field.onChange}
                          error={form.formState.errors.fromZip?.message}
                        />
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                        <span className="text-green-600 font-bold">TO</span>
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="toZip"
                      render={({ field }) => (
                        <ZipCodeInput
                          label="Destination ZIP Code"
                          placeholder="Enter ZIP code (e.g., 90210)"
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
              <div className="bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-6">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-xl font-semibold text-blue-800">Package Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Weight</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0.1" className="text-lg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="weightUnit"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-lg">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="lb">lb</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="carrierFilter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Carrier Selection</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-lg">
                                <SelectValue placeholder="Select carriers" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CARRIER_OPTIONS.map((carrier) => (
                                <SelectItem key={carrier.value} value={carrier.value}>
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

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dimensionUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dimension Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-lg">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in">inches</SelectItem>
                              <SelectItem value="cm">centimeters</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" min="0.1" className="text-lg" {...field} />
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
                              <Input type="number" step="0.1" min="0.1" className="text-lg" {...field} />
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
                              <Input type="number" step="0.1" min="0.1" className="text-lg" {...field} />
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
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || isGeneratingAddress}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  {isGeneratingAddress ? (
                    <>
                      <Loader className="mr-3 h-5 w-5 animate-spin" />
                      Generating Addresses...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader className="mr-3 h-5 w-5 animate-spin" />
                      Finding Best Rates...
                    </>
                  ) : (
                    <>
                      <Search className="mr-3 h-5 w-5" />
                      Get Shipping Quotes
                      <ArrowRight className="ml-3 h-5 w-5" />
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
