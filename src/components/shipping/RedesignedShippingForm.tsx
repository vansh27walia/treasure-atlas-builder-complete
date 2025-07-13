
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Shield, AlertTriangle, Search, Loader2, DollarSign, Info, Sparkles, Truck } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import AddressSelector from './AddressSelector';
import { SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const packageOptions = [
  { 
    value: 'box', 
    label: 'Custom Box', 
    type: 'custom' as const,
    icon: '📦',
    description: 'Custom sized boxes',
    image: '/package-images/box.png',
    isRecommended: true
  },
  { 
    value: 'envelope', 
    label: 'Custom Envelope', 
    type: 'custom' as const,
    icon: '📮',
    description: 'Documents & flat items',
    image: '/package-images/envelope.png'
  },
  
  // USPS Flat Rate Packages
  { value: 'FlatRateEnvelope', label: 'USPS - Flat Rate Envelope', type: 'predefined' as const, icon: '🇺🇸', description: 'USPS standard envelope', category: 'USPS' },
  { value: 'LegalFlatRateEnvelope', label: 'USPS - Legal Flat Rate Envelope', type: 'predefined' as const, icon: '🇺🇸', description: 'Legal size envelope', category: 'USPS' },
  { value: 'PaddedFlatRateEnvelope', label: 'USPS - Padded Flat Rate Envelope', type: 'predefined' as const, icon: '🇺🇸', description: 'Padded protection', category: 'USPS' },
  { value: 'FlatRateWindowEnvelope', label: 'USPS - Flat Rate Window Envelope', type: 'predefined' as const, icon: '🇺🇸', description: 'With address window', category: 'USPS' },
  { value: 'FlatRateCardboardEnvelope', label: 'USPS - Flat Rate Cardboard Envelope', type: 'predefined' as const, icon: '🇺🇸', description: 'Rigid cardboard', category: 'USPS' },
  { value: 'SmallFlatRateEnvelope', label: 'USPS - Small Flat Rate Envelope', type: 'predefined' as const, icon: '🇺🇸', description: 'Compact size', category: 'USPS' },
  { value: 'SmallFlatRateBox', label: 'USPS - Small Flat Rate Box', type: 'predefined' as const, icon: '🇺🇸', description: 'Small box', category: 'USPS' },
  { value: 'MediumFlatRateBox', label: 'USPS - Medium Flat Rate Box', type: 'predefined' as const, icon: '🇺🇸', description: 'Medium box', category: 'USPS' },
  { value: 'LargeFlatRateBox', label: 'USPS - Large Flat Rate Box', type: 'predefined' as const, icon: '🇺🇸', description: 'Large box', category: 'USPS' },
  { value: 'LargeFlatRateBoxAPOFPO', label: 'USPS - Large Flat Rate Box APO/FPO', type: 'predefined' as const, icon: '🇺🇸', description: 'Military addresses', category: 'USPS' },
  { value: 'RegionalRateBoxA', label: 'USPS - Regional Rate Box A', type: 'predefined' as const, icon: '🇺🇸', description: 'Regional pricing', category: 'USPS' },
  { value: 'RegionalRateBoxB', label: 'USPS - Regional Rate Box B', type: 'predefined' as const, icon: '🇺🇸', description: 'Regional pricing', category: 'USPS' },
  
  // UPS Predefined Packages
  { value: 'UPSLetter', label: 'UPS - Letter', type: 'predefined' as const, icon: '🤎', description: 'Document envelope', category: 'UPS' },
  { value: 'UPSExpressBox', label: 'UPS - Express Box', type: 'predefined' as const, icon: '🤎', description: 'Express service', category: 'UPS' },
  { value: 'UPS25kgBox', label: 'UPS - 25kg Box', type: 'predefined' as const, icon: '🤎', description: 'Heavy items', category: 'UPS' },
  { value: 'UPS10kgBox', label: 'UPS - 10kg Box', type: 'predefined' as const, icon: '🤎', description: 'Medium weight', category: 'UPS' },
  { value: 'Tube', label: 'UPS - Tube', type: 'predefined' as const, icon: '🤎', description: 'Cylindrical items', category: 'UPS' },
  { value: 'Pak', label: 'UPS - Pak', type: 'predefined' as const, icon: '🤎', description: 'Flat documents', category: 'UPS' },
  { value: 'SmallExpressBox', label: 'UPS - Small Express Box', type: 'predefined' as const, icon: '🤎', description: 'Small express', category: 'UPS' },
  { value: 'MediumExpressBox', label: 'UPS - Medium Express Box', type: 'predefined' as const, icon: '🤎', description: 'Medium express', category: 'UPS' },
  { value: 'LargeExpressBox', label: 'UPS - Large Express Box', type: 'predefined' as const, icon: '🤎', description: 'Large express', category: 'UPS' },
  
  // FedEx Predefined Packages
  { value: 'FedExEnvelope', label: 'FedEx - Envelope', type: 'predefined' as const, icon: '💜', description: 'Standard envelope', category: 'FedEx' },
  { value: 'FedExBox', label: 'FedEx - Box', type: 'predefined' as const, icon: '💜', description: 'Standard box', category: 'FedEx' },
  { value: 'FedExPak', label: 'FedEx - Pak', type: 'predefined' as const, icon: '💜', description: 'Document pak', category: 'FedEx' },
  { value: 'FedExTube', label: 'FedEx - Tube', type: 'predefined' as const, icon: '💜', description: 'Tube container', category: 'FedEx' },
  { value: 'FedEx10kgBox', label: 'FedEx - 10kg Box', type: 'predefined' as const, icon: '💜', description: '10kg capacity', category: 'FedEx' },
  { value: 'FedEx25kgBox', label: 'FedEx - 25kg Box', type: 'predefined' as const, icon: '💜', description: '25kg capacity', category: 'FedEx' },
  { value: 'FedExSmallBox', label: 'FedEx - Small Box', type: 'predefined' as const, icon: '💜', description: 'Small package', category: 'FedEx' },
  { value: 'FedExMediumBox', label: 'FedEx - Medium Box', type: 'predefined' as const, icon: '💜', description: 'Medium package', category: 'FedEx' },
  { value: 'FedExLargeBox', label: 'FedEx - Large Box', type: 'predefined' as const, icon: '💜', description: 'Large package', category: 'FedEx' },
  { value: 'FedExExtraLargeBox', label: 'FedEx - Extra Large Box', type: 'predefined' as const, icon: '💜', description: 'Extra large', category: 'FedEx' },
  
  // DHL Predefined Packages
  { value: 'DHLExpressEnvelope', label: 'DHL - Express Envelope', type: 'predefined' as const, icon: '🟡', description: 'Express delivery', category: 'DHL' },
  { value: 'DHLFlyer', label: 'DHL - Flyer', type: 'predefined' as const, icon: '🟡', description: 'Lightweight docs', category: 'DHL' },
  { value: 'DHLExpressBox', label: 'DHL - Express Box', type: 'predefined' as const, icon: '🟡', description: 'Express package', category: 'DHL' },
  { value: 'DHLJumboBox', label: 'DHL - Jumbo Box', type: 'predefined' as const, icon: '🟡', description: 'Extra large box', category: 'DHL' },
  { value: 'DHLSmallBox', label: 'DHL - Small Box', type: 'predefined' as const, icon: '🟡', description: 'Small package', category: 'DHL' },
  { value: 'DHLLargeBox', label: 'DHL - Large Box', type: 'predefined' as const, icon: '🟡', description: 'Large package', category: 'DHL' },
  { value: 'DHLPak', label: 'DHL - Pak', type: 'predefined' as const, icon: '🟡', description: 'Document pak', category: 'DHL' },
  { value: 'DHLTube', label: 'DHL - Tube', type: 'predefined' as const, icon: '🟡', description: 'Tube container', category: 'DHL' },
];

const carriers = [
  { 
    value: 'all', 
    label: 'All Carriers', 
    logo: '📦',
    color: 'from-blue-500 to-purple-500',
    description: 'Compare all available options'
  },
  { 
    value: 'usps', 
    label: 'USPS', 
    logo: '🇺🇸',
    color: 'from-red-500 to-blue-500',
    description: 'US Postal Service'
  },
  { 
    value: 'ups', 
    label: 'UPS', 
    logo: '🤎',
    color: 'from-yellow-600 to-yellow-800',
    description: 'United Parcel Service'
  },
  { 
    value: 'fedex', 
    label: 'FedEx', 
    logo: '💜',
    color: 'from-purple-600 to-orange-500',
    description: 'Federal Express'
  },
  { 
    value: 'dhl', 
    label: 'DHL', 
    logo: '🟡',
    color: 'from-yellow-400 to-red-500',
    description: 'International Express'
  },
];

const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  length: z.coerce.number().min(0, "Length must be greater than 0").optional(),
  width: z.coerce.number().min(0, "Width must be greater than 0").optional(),
  height: z.coerce.number().min(0, "Height must be greater than 0").optional(),
  insurance: z.boolean().default(true),
  declaredValue: z.coerce.number().min(0, "Declared value must be greater than 0").default(100),
  hazmat: z.boolean().default(false),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const RedesignedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState('all');

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: 'box',
      weightValue: 0,
      weightUnit: 'oz',
      length: 8,
      width: 8,
      height: 2,
      insurance: true,
      declaredValue: 100,
      hazmat: false,
    }
  });

  const selectedPackageType = form.watch('packageType');
  const selectedPackage = packageOptions.find(p => p.value === selectedPackageType);
  const declaredValue = form.watch('declaredValue');
  const insuranceEnabled = form.watch('insurance');
  const hazmatEnabled = form.watch('hazmat');

  // Calculate insurance cost
  const insuranceCost = insuranceEnabled ? Math.ceil(declaredValue / 100) * 4 : 0;

  const getInputFields = () => {
    if (!selectedPackage) return null;

    const showDimensions = selectedPackage.type === 'custom';
    const isEnvelope = selectedPackageType === 'envelope';

    return (
      <div className="space-y-6">
        {showDimensions && (
          <div className="p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100/50 backdrop-blur-sm">
            <Label className="text-base font-semibold text-gray-900 mb-4 block flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Package Dimensions
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Length (inches)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="8"
                        className="h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl"
                        {...field}
                        value={field.value || ''}
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
                    <FormLabel className="text-sm font-medium">Width (inches)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0" 
                        step="0.1"
                        placeholder="8"
                        className="h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!isEnvelope && (
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Height (inches)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="2"
                          className="h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
        )}
        
        <div className="p-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 rounded-2xl border border-green-100/50 backdrop-blur-sm">
          <Label className="text-base font-semibold text-gray-900 mb-4 block flex items-center">
            <Package className="w-5 h-5 mr-2 text-green-600" />
            Package Weight
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weightValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Weight</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="1"
                      className="h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl"
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
                  <FormLabel className="text-sm font-medium">Unit</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl">
                      <SelectItem value="oz">Ounces (oz)</SelectItem>
                      <SelectItem value="lb">Pounds (lb)</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please provide both origin and destination addresses");
      return;
    }

    setIsLoading(true);
    try {
      // Convert weight to ounces for backend processing
      let weightOz = values.weightValue;
      if (values.weightUnit === 'kg') {
        weightOz = values.weightValue * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = values.weightValue * 16;
      }

      // Build parcel object based on package type
      const selectedPackage = packageOptions.find(p => p.value === values.packageType);
      let parcel: any = {};

      if (selectedPackage?.type === 'custom') {
        if (values.packageType === 'envelope') {
          parcel = {
            length: values.length,
            width: values.width,
            weight: weightOz,
          };
        } else {
          parcel = {
            length: values.length,
            width: values.width,
            height: values.height,
            weight: weightOz,
          };
        }
      } else {
        // Predefined package
        parcel = {
          predefined_package: values.packageType,
          weight: weightOz,
        };
      }

      // Prepare the request payload for EasyPost API
      const payload: any = {
        fromAddress: {
          name: fromAddress.name,
          company: fromAddress.company || '',
          street1: fromAddress.street1,
          street2: fromAddress.street2 || '',
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
          phone: fromAddress.phone || '',
        },
        toAddress: {
          name: toAddress.name,
          company: toAddress.company || '',
          street1: toAddress.street1,
          street2: toAddress.street2 || '',
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
          phone: toAddress.phone || '',
        },
        parcel,
        options: {},
        carriers: selectedCarrier === 'all' ? ['usps', 'ups', 'fedex', 'dhl'] : [selectedCarrier]
      };

      // Add insurance if enabled
      if (values.insurance) {
        payload.insurance = values.declaredValue;
      }

      // Add HAZMAT if enabled
      if (values.hazmat) {
        payload.options.hazmat = 'LITHIUM'; // Default HAZMAT code
      }

      console.log('Shipping payload:', JSON.stringify(payload, null, 2));

      // Call the Edge Function to get shipping rates - RESTORE ORIGINAL FUNCTIONALITY
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      // RESTORE ORIGINAL RATES HANDLING - DO NOT MODIFY
      if (data.rates && Array.isArray(data.rates)) {
        // Add original rates for price comparison display
        const ratesWithOriginalPrices = data.rates.map(rate => {
          if (!rate.original_rate && (rate.list_rate || rate.retail_rate)) {
            return {
              ...rate,
              original_rate: rate.list_rate || rate.retail_rate
            };
          }
          return rate;
        });
        
        // Publish the updated rates to be displayed in the ShippingRates component
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { rates: ratesWithOriginalPrices, shipmentId: data.shipmentId } 
        }));
      } else {
        // Publish the rates as is
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { rates: data.rates, shipmentId: data.shipmentId } 
        }));
      }

      toast.success("Shipping rates retrieved successfully");
      
      // Scroll to the rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to get shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGetRates)} className="space-y-8">
          
          {/* Step 1: Addresses - Glass Format */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-8 rounded-t-3xl">
                <CardTitle className="flex items-center text-2xl font-bold">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg mr-4">1</div>
                  <MapPin className="mr-3 h-7 w-7" />
                  Shipping Addresses
                  <Sparkles className="ml-auto h-6 w-6" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8 bg-white/80 backdrop-blur-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-900 flex items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold mr-2">F</div>
                      From Address
                    </Label>
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handleFromAddressSelect}
                      useGoogleAutocomplete={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-lg font-semibold text-gray-900 flex items-center">
                      <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold mr-2">T</div>
                      To Address
                    </Label>
                    <AddressSelector 
                      type="to"
                      onAddressSelect={handleToAddressSelect}
                      useGoogleAutocomplete={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Package Selection & Carrier - Glass Format */}
          <Card className="overflow-hidden border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 text-white p-8 rounded-t-3xl">
              <CardTitle className="flex items-center text-2xl font-bold">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg mr-4">2</div>
                <Package className="mr-3 h-7 w-7" />
                Package & Carrier Selection
                <Sparkles className="ml-auto h-6 w-6" />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8 bg-white/80 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enhanced Package Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-blue-600" />
                    Package Type
                  </Label>
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full h-16 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 rounded-xl shadow-sm">
                              <SelectValue>
                                {selectedPackage && (
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <span className="text-lg">{selectedPackage.icon}</span>
                                    </div>
                                    <div className="text-left">
                                      <div className="font-medium text-gray-900 flex items-center">
                                        {selectedPackage.label}
                                        {selectedPackage.isRecommended && (
                                          <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Recommended</Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">{selectedPackage.description}</div>
                                    </div>
                                  </div>
                                )}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-96 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl">
                            {/* Custom Packages */}
                            <div className="p-2">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
                                Custom Packages
                              </div>
                              {packageOptions.filter(opt => opt.type === 'custom').map((option) => (
                                <SelectItem 
                                  key={option.value} 
                                  value={option.value}
                                  className="p-4 rounded-lg hover:bg-blue-50 cursor-pointer"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                      <span className="text-xl">{option.icon}</span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 flex items-center">
                                        {option.label}
                                        {option.isRecommended && (
                                          <Badge className="ml-2 bg-green-100 text-green-700 text-xs">Recommended</Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500">{option.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>

                            {/* Carrier Packages */}
                            {['USPS', 'UPS', 'FedEx', 'DHL'].map(carrier => {
                              const carrierOptions = packageOptions.filter(opt => opt.category === carrier);
                              if (carrierOptions.length === 0) return null;
                              
                              return (
                                <div key={carrier} className="p-2 border-t border-gray-100">
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 flex items-center">
                                    <span className="mr-2">
                                      {carrier === 'USPS' && '🇺🇸'}
                                      {carrier === 'UPS' && '🤎'}
                                      {carrier === 'FedEx' && '💜'}
                                      {carrier === 'DHL' && '🟡'}
                                    </span>
                                    {carrier} Packages
                                  </div>
                                  <div className="space-y-1">
                                    {carrierOptions.map((option) => (
                                      <SelectItem 
                                        key={option.value} 
                                        value={option.value}
                                        className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer"
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <span className="text-sm">{option.icon}</span>
                                          </div>
                                          <div>
                                            <div className="font-medium text-gray-900 text-sm">
                                              {option.label.replace(`${carrier} - `, '')}
                                            </div>
                                            <div className="text-xs text-gray-500">{option.description}</div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Enhanced Carrier Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-900 flex items-center">
                    <Truck className="w-4 h-4 mr-2 text-blue-600" />
                    Preferred Carrier
                  </Label>
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                    <SelectTrigger className="w-full h-16 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 rounded-xl shadow-sm">
                      <SelectValue>
                        {carriers.find(c => c.value === selectedCarrier) && (
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${carriers.find(c => c.value === selectedCarrier)?.color} flex items-center justify-center shadow-md`}>
                              <span className="text-xl">{carriers.find(c => c.value === selectedCarrier)?.logo}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-gray-900">{carriers.find(c => c.value === selectedCarrier)?.label}</div>
                              <div className="text-xs text-gray-500">{carriers.find(c => c.value === selectedCarrier)?.description}</div>
                            </div>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl">
                      {carriers.map((carrier) => (
                        <SelectItem 
                          key={carrier.value} 
                          value={carrier.value}
                          className="p-4 rounded-lg hover:bg-blue-50 cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${carrier.color} flex items-center justify-center shadow-md`}>
                              <span className="text-2xl">{carrier.logo}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{carrier.label}</div>
                              <div className="text-sm text-gray-500">{carrier.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Package Details */}
              {selectedPackage && (
                <div className="mt-8">
                  {getInputFields()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Additional Options - Glass Format */}
          <Card className="overflow-hidden border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl">
            <CardHeader className="bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white p-8 rounded-t-3xl">
              <CardTitle className="flex items-center text-2xl font-bold">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg mr-4">3</div>
                <Shield className="mr-3 h-7 w-7" />
                Protection & Options
                <Sparkles className="ml-auto h-6 w-6" />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-8 space-y-8 bg-white/80 backdrop-blur-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* HAZMAT Option */}
                <div className="p-6 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border-2 border-yellow-200/50 rounded-2xl backdrop-blur-sm">
                  <FormField
                    control={form.control}
                    name="hazmat"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            className="w-6 h-6 border-2"
                          />
                        </FormControl>
                        <div className="space-y-2 leading-none flex-1">
                          <FormLabel className="text-lg font-bold flex items-center text-yellow-800">
                            <AlertTriangle className="w-6 h-6 mr-2 text-yellow-600" />
                            Hazardous Materials (HAZMAT)
                          </FormLabel>
                          <p className="text-sm text-yellow-700">
                            Contains lithium batteries, chemicals, or other hazardous materials. This may limit available services and require special handling.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Insurance Option */}
                <div className="p-6 bg-gradient-to-r from-blue-50/80 to-green-50/80 border-2 border-blue-200/50 rounded-2xl backdrop-blur-sm">
                  <FormField
                    control={form.control}
                    name="insurance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            className="w-6 h-6 border-2"
                          />
                        </FormControl>
                        <div className="space-y-2 leading-none flex-1">
                          <FormLabel className="text-lg font-bold flex items-center text-gray-900">
                            <Shield className="w-6 h-6 mr-2 text-blue-600" />
                            Package Insurance Protection
                          </FormLabel>
                          <p className="text-sm text-gray-600">
                            Protect your shipment against loss, theft, or damage. Only $4 per $100 of declared value.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {insuranceEnabled && (
                <div className="p-6 bg-gradient-to-r from-green-50/80 to-blue-50/80 border-2 border-green-200/50 rounded-2xl backdrop-blur-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <FormField
                      control={form.control}
                      name="declaredValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold flex items-center">
                            <DollarSign className="w-5 h-5 mr-1" />
                            Declared Value (USD)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="100.00"
                              className="h-12 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl text-lg"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="p-4 bg-white/80 backdrop-blur-sm border-2 border-green-300 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-green-800">Insurance Cost:</span>
                        <span className="text-2xl font-bold text-green-900">${insuranceCost}</span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Based on ${declaredValue} declared value
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card className="overflow-hidden border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-3xl">
            <CardContent className="p-8">
              <Button 
                type="submit" 
                size="lg" 
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-7 w-7 animate-spin mr-4" />
                    Fetching Your Best Rates...
                  </>
                ) : (
                  <>
                    <Search className="h-7 w-7 mr-4" />
                    Compare Shipping Rates from All Carriers
                  </>
                )}
              </Button>
              {!isLoading && (
                <p className="text-center text-lg text-gray-600 mt-4 font-medium">
                  🚀 Get instant quotes from USPS, UPS, FedEx, and DHL
                </p>
              )}
            </CardContent>
          </Card>

        </form>
      </Form>
    </div>
  );
};

export default RedesignedShippingForm;
