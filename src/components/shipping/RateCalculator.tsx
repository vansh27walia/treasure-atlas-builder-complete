
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const rateFormSchema = z.object({
  fromZip: z.string().min(3, { message: 'ZIP/Postal code is required' }),
  toZip: z.string().min(3, { message: 'ZIP/Postal code is required' }),
  fromCountry: z.string().min(2, { message: 'Country is required' }),
  toCountry: z.string().min(2, { message: 'Country is required' }),
  weight: z.coerce.number().min(0.1, { message: 'Weight must be greater than 0' }),
  length: z.coerce.number().min(0.1, { message: 'Length must be greater than 0' }),
  width: z.coerce.number().min(0.1, { message: 'Width must be greater than 0' }),
  height: z.coerce.number().min(0.1, { message: 'Height must be greater than 0' }),
  weightUnit: z.enum(['lb', 'kg', 'oz']),
  dimensionUnit: z.enum(['in', 'cm']),
  packageType: z.string().optional(),
  comments: z.string().optional(),
  signatureRequired: z.boolean().default(false),
  insurance: z.boolean().default(false),
});

type RateFormValues = z.infer<typeof rateFormSchema>;

const packageOptions = [
  { value: 'custom', label: 'Custom Package' },
  { value: 'usps_medium_flat_rate_box', label: 'USPS Medium Flat Rate Box' },
  { value: 'usps_small_flat_rate_box', label: 'USPS Small Flat Rate Box' },
  { value: 'usps_flat_rate_envelope', label: 'USPS Flat Rate Envelope' },
  { value: 'usps_priority_mail', label: 'USPS Priority Mail' },
  { value: 'usps_first_class_mail', label: 'USPS First Class Mail' },
];

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
      packageType: 'custom',
      comments: '',
      signatureRequired: false,
      insurance: false,
    },
  });

  const handleCountryChange = (value: string, fieldName: 'fromCountry' | 'toCountry') => {
    form.setValue(fieldName, value);
    
    // Check if either origin or destination is not US
    const otherCountry = fieldName === 'fromCountry' ? form.getValues('toCountry') : form.getValues('fromCountry');
    setIsInternational(value !== 'US' || otherCountry !== 'US');
  };

  const convertWeight = (weight: number, unit: string): number => {
    // Convert to ounces for EasyPost API
    switch (unit) {
      case 'lb': return weight * 16; // 1 lb = 16 oz
      case 'kg': return weight * 35.274; // 1 kg = 35.274 oz
      case 'oz': return weight; // Already in ounces
      default: return weight;
    }
  };

  const convertDimension = (value: number, unit: string): number => {
    // Convert to inches for EasyPost API
    return unit === 'cm' ? value * 0.393701 : value;
  };

  const onSubmit = async (data: RateFormValues) => {
    try {
      // Convert weight to ounces
      const weightInOz = convertWeight(data.weight, data.weightUnit);
      
      // Convert dimensions to inches
      const lengthInInches = convertDimension(data.length, data.dimensionUnit);
      const widthInInches = convertDimension(data.width, data.dimensionUnit);
      const heightInInches = convertDimension(data.height, data.dimensionUnit);
      
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
          length: lengthInInches,
          width: widthInInches,
          height: heightInInches,
        },
        options: {
          packageType: data.packageType,
          comments: data.comments,
          signatureRequired: data.signatureRequired,
          insurance: data.insurance
        }
      };

      // Fetch rates from the API
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
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
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
                        <SelectContent>
                          <SelectItem value="US">United States</SelectItem>
                          <SelectItem value="CA">Canada</SelectItem>
                          <SelectItem value="MX">Mexico</SelectItem>
                          <SelectItem value="GB">United Kingdom</SelectItem>
                          <SelectItem value="AU">Australia</SelectItem>
                          <SelectItem value="DE">Germany</SelectItem>
                          <SelectItem value="JP">Japan</SelectItem>
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="IT">Italy</SelectItem>
                          <SelectItem value="ES">Spain</SelectItem>
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
              
              <FormField
                control={form.control}
                name="packageType"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Package Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select package type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packageOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                              <SelectItem value="oz">oz</SelectItem>
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
              
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-blue-700">Additional Options</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="signatureRequired"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="signatureRequired" 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                        <Label htmlFor="signatureRequired">Signature Required</Label>
                      </div>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="insurance" 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                        <Label htmlFor="insurance">Add Insurance</Label>
                      </div>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any special instructions here" 
                          className="resize-none" 
                          {...field} 
                        />
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
