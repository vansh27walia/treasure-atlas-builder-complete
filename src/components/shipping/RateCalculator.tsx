
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
import PackageTypeSelector from './PackageTypeSelector';
import DynamicPackageFields from './DynamicPackageFields';
import { PackageType } from '@/types/shipping';

const rateFormSchema = z.object({
  fromZip: z.string().min(3, { message: 'ZIP/Postal code must be at least 3 characters' }),
  toZip: z.string().min(3, { message: 'ZIP/Postal code must be at least 3 characters' }),
  fromCountry: z.string().min(2, { message: 'Please select origin country' }),
  toCountry: z.string().min(2, { message: 'Please select destination country' }),
  weight: z.coerce.number().min(0.1, { message: 'Weight must be greater than 0' }),
  length: z.coerce.number().min(0.1, { message: 'Length must be greater than 0' }).optional(),
  width: z.coerce.number().min(0.1, { message: 'Width must be greater than 0' }).optional(),
  height: z.coerce.number().min(0.1, { message: 'Height must be greater than 0' }).optional(),
  weightUnit: z.enum(['lb', 'kg']),
  dimensionUnit: z.enum(['in', 'cm']),
  carrierFilter: z.string(),
  packageType: z.enum(['custom', 'envelope', 'flat-rate']),
  carrier: z.string().optional(),
  predefinedPackage: z.string().optional(),
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
  const [packageType, setPackageType] = useState<PackageType>('custom');
  const [carrier, setCarrier] = useState<string>('');
  const [predefinedPackage, setPredefinedPackage] = useState<string>('');
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
      packageType: 'custom',
    },
  });

  const buildParcelPayload = (data: RateFormValues) => {
    const weightInOz = data.weightUnit === 'lb' 
      ? data.weight * 16
      : data.weight * 35.274;
    
    const conversionFactor = data.dimensionUnit === 'cm' ? 0.393701 : 1;
    
    if (packageType === 'custom') {
      return {
        length: (data.length || 0) * conversionFactor,
        width: (data.width || 0) * conversionFactor,
        height: (data.height || 0) * conversionFactor,
        weight: weightInOz,
      };
    } else if (packageType === 'envelope') {
      return {
        length: (data.length || 0) * conversionFactor,
        width: (data.width || 0) * conversionFactor,
        weight: weightInOz,
      };
    } else {
      return {
        predefined_package: predefinedPackage,
        weight: weightInOz,
      };
    }
  };

  const onSubmit = async (data: RateFormValues) => {
    try {
      setIsGeneratingAddress(true);
      
      const [fromAddress, toAddress] = await Promise.all([
        GeocodingService.generateAddressFromZip(data.fromZip),
        GeocodingService.generateAddressFromZip(data.toZip)
      ]);
      
      fromAddress.country = data.fromCountry;
      toAddress.country = data.toCountry;
      
      console.log('Generated addresses:', { fromAddress, toAddress });
      
      let selectedCarriers: string[] = [];
      if (data.carrierFilter === 'all') {
        selectedCarriers = ['usps', 'ups', 'fedex', 'dhl', 'canadapost', 'royalmail'];
      } else {
        selectedCarriers = [data.carrierFilter];
      }
      
      const parcelPayload = buildParcelPayload(data);
      
      const requestData = {
        fromAddress,
        toAddress,
        parcel: parcelPayload,
        carriers: selectedCarriers
      };
      
      console.log("Sending rate request with generated addresses:", requestData);

      await fetchRates(requestData);
      
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

  const handlePackageTypeChange = (type: PackageType) => {
    setPackageType(type);
    form.setValue('packageType', type);
    
    // Reset carrier-specific fields when package type changes
    if (type !== 'flat-rate') {
      setCarrier('');
      setPredefinedPackage('');
    }
  };

  const handleFieldChange = (field: string, value: number) => {
    form.setValue(field as any, value);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="border border-gray-200 shadow-lg bg-white">
        <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold mb-2">
            Shipping Rate Calculator
          </CardTitle>
          <p className="text-blue-100">
            Compare rates from major carriers worldwide
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Carrier Selection - Moved to top */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <FormField
                  control={form.control}
                  name="carrierFilter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Choose Shipping Carriers
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 text-base border border-blue-300 hover:border-blue-400 focus:border-blue-500 bg-white">
                            <SelectValue placeholder="Select carriers to compare" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-blue-200 shadow-lg max-h-60 overflow-y-auto z-[9999]">
                          {CARRIER_OPTIONS.map((carrier) => (
                            <SelectItem 
                              key={carrier.value} 
                              value={carrier.value}
                              className="py-2 px-3 hover:bg-blue-50 focus:bg-blue-50"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Origin */}
                <div className="space-y-4 bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-2">
                      <span className="text-green-600 font-bold text-sm">FROM</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Origin</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="fromCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          Country
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
                        label="ZIP/Postal Code"
                        placeholder="Enter ZIP or postal code"
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.fromZip?.message}
                      />
                    )}
                  />
                </div>
                
                {/* Destination */}
                <div className="space-y-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2">
                      <span className="text-blue-600 font-bold text-sm">TO</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">Destination</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="toCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          Country
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
                        label="ZIP/Postal Code"
                        placeholder="Enter ZIP or postal code"
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.toZip?.message}
                      />
                    )}
                  />
                </div>
              </div>
              
              {/* Package Details Section */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-4 w-4 text-amber-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Package Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PackageTypeSelector
                    packageType={packageType}
                    carrier={carrier}
                    predefinedPackage={predefinedPackage}
                    onPackageTypeChange={handlePackageTypeChange}
                    onCarrierChange={setCarrier}
                    onPredefinedPackageChange={setPredefinedPackage}
                  />
                  
                  <div className="space-y-4">
                    <div className="flex items-end gap-4">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-sm font-medium">Weight</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="0.1" 
                                className="h-9 text-sm border border-amber-300 focus:border-amber-500" 
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
                          <FormItem className="w-20">
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-9 text-sm border border-amber-300 focus:border-amber-500">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border border-amber-200 shadow-lg z-[9999]">
                                <SelectItem value="lb" className="text-sm">lb</SelectItem>
                                <SelectItem value="kg" className="text-sm">kg</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {(packageType === 'custom' || packageType === 'envelope') && (
                      <>
                        <FormField
                          control={form.control}
                          name="dimensionUnit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Dimension Unit</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-9 text-sm border border-amber-300 focus:border-amber-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border border-amber-200 shadow-lg z-[9999]">
                                  <SelectItem value="in" className="text-sm">inches</SelectItem>
                                  <SelectItem value="cm" className="text-sm">centimeters</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className={`grid gap-3 ${packageType === 'custom' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                          <FormField
                            control={form.control}
                            name="length"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Length</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    min="0.1" 
                                    className="h-9 text-sm border border-amber-300 focus:border-amber-500" 
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
                                <FormLabel className="text-sm font-medium">Width</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    min="0.1" 
                                    className="h-9 text-sm border border-amber-300 focus:border-amber-500" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {packageType === 'custom' && (
                            <FormField
                              control={form.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">Height</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.1" 
                                      min="0.1" 
                                      className="h-9 text-sm border border-amber-300 focus:border-amber-500" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || isGeneratingAddress}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isGeneratingAddress ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Generating Addresses...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Finding Best Rates...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Get Shipping Quotes
                      <ArrowRight className="ml-2 h-4 w-4" />
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
