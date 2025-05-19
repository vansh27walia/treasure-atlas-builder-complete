
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader, Search } from 'lucide-react';
import useRateCalculator from '@/hooks/useRateCalculator';
import { useNavigate } from 'react-router-dom';
import { COUNTRIES_LIST } from '@/lib/countries';

const rateFormSchema = z.object({
  fromZip: z.string().min(3, { message: 'ZIP/Postal code is required' }),
  toZip: z.string().min(3, { message: 'ZIP/Postal code is required' }),
  fromCountry: z.string().min(2, { message: 'Country is required' }),
  toCountry: z.string().min(2, { message: 'Country is required' }),
  weight: z.coerce.number().min(0.1, { message: 'Weight must be greater than 0' }),
  length: z.coerce.number().min(0.1, { message: 'Length must be greater than 0' }),
  width: z.coerce.number().min(0.1, { message: 'Width must be greater than 0' }),
  height: z.coerce.number().min(0.1, { message: 'Height must be greater than 0' }),
  weightUnit: z.enum(['lb', 'kg']),
  dimensionUnit: z.enum(['in', 'cm']),
});

type RateFormValues = z.infer<typeof rateFormSchema>;

const RateCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [isInternational, setIsInternational] = useState(false);
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
    },
  });

  const handleCountryChange = (value: string, fieldName: 'fromCountry' | 'toCountry') => {
    form.setValue(fieldName, value);
    
    // Check if either origin or destination is not US
    const otherCountry = fieldName === 'fromCountry' ? form.getValues('toCountry') : form.getValues('fromCountry');
    setIsInternational(value !== 'US' || otherCountry !== 'US');
  };

  const onSubmit = async (data: RateFormValues) => {
    try {
      // Calculate weight in ounces or grams based on selected unit
      const weightInOz = data.weightUnit === 'lb' 
        ? data.weight * 16  // Convert pounds to ounces
        : data.weight * 35.274;  // Convert kg to ounces
      
      // Convert dimensions to inches if in cm
      const conversionFactor = data.dimensionUnit === 'cm' ? 0.393701 : 1;
      
      // Prepare the request data for the API
      const requestData = {
        fromAddress: {
          zip: data.fromZip,
          country: data.fromCountry,
        },
        toAddress: {
          zip: data.toZip,
          country: data.toCountry,
        },
        parcel: {
          weight: weightInOz,
          length: data.length * conversionFactor,
          width: data.width * conversionFactor,
          height: data.height * conversionFactor,
        },
        // Store original form values for passing to shipping form
        formData: {
          ...data
        }
      };

      // Fetch rates from the API using the real shipping API
      await fetchRates(requestData);
      
      // Scroll to the rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  return (
    <Card className="border-2 border-gray-200 shadow-lg rounded-xl overflow-hidden mb-8">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Shipping Rate Calculator</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-700">Origin</h3>
                
                <FormField
                  control={form.control}
                  name="fromCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={(value) => handleCountryChange(value, 'fromCountry')}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRIES_LIST.map((country) => (
                            <SelectItem key={`from-${country.code}`} value={country.code}>
                              {country.name}
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
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ZIP/Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-700">Destination</h3>
                
                <FormField
                  control={form.control}
                  name="toCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select
                        onValueChange={(value) => handleCountryChange(value, 'toCountry')}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {COUNTRIES_LIST.map((country) => (
                            <SelectItem key={`to-${country.code}`} value={country.code}>
                              {country.name}
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
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ZIP/Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">Package Details</h3>
              
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
                            <Input type="number" step="0.1" min="0.1" {...field} />
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
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dimensionUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimension Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in">in</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0.1" {...field} />
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
                        <Input type="number" step="0.1" min="0.1" {...field} />
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
                        <Input type="number" step="0.1" min="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Calculating Rates...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Calculate Rates
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default RateCalculator;
