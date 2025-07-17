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
import { MapPin, Package, Shield, AlertTriangle, Search, Loader2, DollarSign, Info } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import AddressSelector from './AddressSelector';
import CarrierSelector from './CarrierSelector';
import PackageTypeCard from './PackageTypeCard';
import { SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const packageOptions = [
  { 
    value: 'box', 
    label: 'Boxes', 
    type: 'custom',
    icon: '📦',
    description: 'Custom sized boxes',
    image: '/package-images/box.png',
    isRecommended: true
  },
  { 
    value: 'envelope', 
    label: 'Envelopes', 
    type: 'custom',
    icon: '📮',
    description: 'Documents & flat items',
    image: '/package-images/envelope.png'
  },
  
  // USPS Flat Rate Packages
  { value: 'FlatRateEnvelope', label: 'USPS - Flat Rate Envelope', type: 'predefined', icon: '🇺🇸', description: 'USPS standard envelope', category: 'USPS' },
  { value: 'LegalFlatRateEnvelope', label: 'USPS - Legal Flat Rate Envelope', type: 'predefined', icon: '🇺🇸', description: 'Legal size envelope', category: 'USPS' },
  { value: 'PaddedFlatRateEnvelope', label: 'USPS - Padded Flat Rate Envelope', type: 'predefined', icon: '🇺🇸', description: 'Padded protection', category: 'USPS' },
  { value: 'FlatRateWindowEnvelope', label: 'USPS - Flat Rate Window Envelope', type: 'predefined', icon: '🇺🇸', description: 'With address window', category: 'USPS' },
  { value: 'FlatRateCardboardEnvelope', label: 'USPS - Flat Rate Cardboard Envelope', type: 'predefined', icon: '🇺🇸', description: 'Rigid cardboard', category: 'USPS' },
  { value: 'SmallFlatRateEnvelope', label: 'USPS - Small Flat Rate Envelope', type: 'predefined', icon: '🇺🇸', description: 'Compact size', category: 'USPS' },
  { value: 'SmallFlatRateBox', label: 'USPS - Small Flat Rate Box', type: 'predefined', icon: '🇺🇸', description: 'Small box', category: 'USPS' },
  { value: 'MediumFlatRateBox', label: 'USPS - Medium Flat Rate Box', type: 'predefined', icon: '🇺🇸', description: 'Medium box', category: 'USPS' },
  { value: 'LargeFlatRateBox', label: 'USPS - Large Flat Rate Box', type: 'predefined', icon: '🇺🇸', description: 'Large box', category: 'USPS' },
  { value: 'LargeFlatRateBoxAPOFPO', label: 'USPS - Large Flat Rate Box APO/FPO', type: 'predefined', icon: '🇺🇸', description: 'Military addresses', category: 'USPS' },
  { value: 'RegionalRateBoxA', label: 'USPS - Regional Rate Box A', type: 'predefined', icon: '🇺🇸', description: 'Regional pricing', category: 'USPS' },
  { value: 'RegionalRateBoxB', label: 'USPS - Regional Rate Box B', type: 'predefined', icon: '🇺🇸', description: 'Regional pricing', category: 'USPS' },
  
  // UPS Predefined Packages
  { value: 'UPSLetter', label: 'UPS - Letter', type: 'predefined', icon: '🤎', description: 'Document envelope', category: 'UPS' },
  { value: 'UPSExpressBox', label: 'UPS - Express Box', type: 'predefined', icon: '🤎', description: 'Express service', category: 'UPS' },
  { value: 'UPS25kgBox', label: 'UPS - 25kg Box', type: 'predefined', icon: '🤎', description: 'Heavy items', category: 'UPS' },
  { value: 'UPS10kgBox', label: 'UPS - 10kg Box', type: 'predefined', icon: '🤎', description: 'Medium weight', category: 'UPS' },
  { value: 'Tube', label: 'UPS - Tube', type: 'predefined', icon: '🤎', description: 'Cylindrical items', category: 'UPS' },
  { value: 'Pak', label: 'UPS - Pak', type: 'predefined', icon: '🤎', description: 'Flat documents', category: 'UPS' },
  { value: 'SmallExpressBox', label: 'UPS - Small Express Box', type: 'predefined', icon: '🤎', description: 'Small express', category: 'UPS' },
  { value: 'MediumExpressBox', label: 'UPS - Medium Express Box', type: 'predefined', icon: '🤎', description: 'Medium express', category: 'UPS' },
  { value: 'LargeExpressBox', label: 'UPS - Large Express Box', type: 'predefined', icon: '🤎', description: 'Large express', category: 'UPS' },
  
  // FedEx Predefined Packages
  { value: 'FedExEnvelope', label: 'FedEx - Envelope', type: 'predefined', icon: '💜', description: 'Standard envelope', category: 'FedEx' },
  { value: 'FedExBox', label: 'FedEx - Box', type: 'predefined', icon: '💜', description: 'Standard box', category: 'FedEx' },
  { value: 'FedExPak', label: 'FedEx - Pak', type: 'predefined', icon: '💜', description: 'Document pak', category: 'FedEx' },
  { value: 'FedExTube', label: 'FedEx - Tube', type: 'predefined', icon: '💜', description: 'Tube container', category: 'FedEx' },
  { value: 'FedEx10kgBox', label: 'FedEx - 10kg Box', type: 'predefined', icon: '💜', description: '10kg capacity', category: 'FedEx' },
  { value: 'FedEx25kgBox', label: 'FedEx - 25kg Box', type: 'predefined', icon: '💜', description: '25kg capacity', category: 'FedEx' },
  { value: 'FedExSmallBox', label: 'FedEx - Small Box', type: 'predefined', icon: '💜', description: 'Small package', category: 'FedEx' },
  { value: 'FedExMediumBox', label: 'FedEx - Medium Box', type: 'predefined', icon: '💜', description: 'Medium package', category: 'FedEx' },
  { value: 'FedExLargeBox', label: 'FedEx - Large Box', type: 'predefined', icon: '💜', description: 'Large package', category: 'FedEx' },
  { value: 'FedExExtraLargeBox', label: 'FedEx - Extra Large Box', type: 'predefined', icon: '💜', description: 'Extra large', category: 'FedEx' },
  
  // DHL Predefined Packages
  { value: 'DHLExpressEnvelope', label: 'DHL - Express Envelope', type: 'predefined', icon: '🟡', description: 'Express delivery', category: 'DHL' },
  { value: 'DHLFlyer', label: 'DHL - Flyer', type: 'predefined', icon: '🟡', description: 'Lightweight docs', category: 'DHL' },
  { value: 'DHLExpressBox', label: 'DHL - Express Box', type: 'predefined', icon: '🟡', description: 'Express package', category: 'DHL' },
  { value: 'DHLJumboBox', label: 'DHL - Jumbo Box', type: 'predefined', icon: '🟡', description: 'Extra large box', category: 'DHL' },
  { value: 'DHLSmallBox', label: 'DHL - Small Box', type: 'predefined', icon: '🟡', description: 'Small package', category: 'DHL' },
  { value: 'DHLLargeBox', label: 'DHL - Large Box', type: 'predefined', icon: '🟡', description: 'Large package', category: 'DHL' },
  { value: 'DHLPak', label: 'DHL - Pak', type: 'predefined', icon: '🟡', description: 'Document pak', category: 'DHL' },
  { value: 'DHLTube', label: 'DHL - Tube', type: 'predefined', icon: '🟡', description: 'Tube container', category: 'DHL' },
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
  const [currentStep, setCurrentStep] = useState(1);

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
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">Package Dimensions</Label>
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
                        className="h-11"
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
                        className="h-11"
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
                          className="h-11"
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
        
        <div>
          <Label className="text-base font-semibold text-gray-900 mb-3 block">Package Weight</Label>
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
                      className="h-11"
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
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

  const groupedPackages = {
    custom: packageOptions.filter(p => p.type === 'custom'),
    USPS: packageOptions.filter(p => p.category === 'USPS'),
    UPS: packageOptions.filter(p => p.category === 'UPS'),
    FedEx: packageOptions.filter(p => p.category === 'FedEx'),
    DHL: packageOptions.filter(p => p.category === 'DHL'),
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

      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      // Process rates and add insurance cost
      if (data.rates && Array.isArray(data.rates)) {
        const ratesWithInsurance = data.rates.map((rate: any) => ({
          ...rate,
          insurance_cost: insuranceCost,
          total_with_insurance: parseFloat(rate.rate) + insuranceCost,
        }));

        // Dispatch rates to be displayed
        document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
          detail: { 
            rates: ratesWithInsurance, 
            shipmentId: data.shipmentId,
            insuranceCost 
          } 
        }));

        toast.success("Shipping rates retrieved successfully");
        
        // Scroll to the rates section
        const ratesSection = document.getElementById('shipping-rates-section');
        if (ratesSection) {
          ratesSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        toast.info('No rates available for this shipment');
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to get shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Form - 3 columns */}
        <div className="xl:col-span-3 space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleGetRates)} className="space-y-8">
              
              {/* Step 1: Addresses */}
              <div className="space-y-6">
                <Card className="overflow-hidden border-2 border-blue-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <CardTitle className="flex items-center text-xl">
                      <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm mr-3">1</div>
                      <MapPin className="mr-3 h-6 w-6" />
                      Pickup Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-blue-50">
                    <AddressSelector 
                      type="from"
                      onAddressSelect={handleFromAddressSelect}
                      useGoogleAutocomplete={true}
                    />
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-green-100 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <CardTitle className="flex items-center text-xl">
                      <div className="w-8 h-8 rounded-full bg-white text-green-600 flex items-center justify-center font-bold text-sm mr-3">2</div>
                      <MapPin className="mr-3 h-6 w-6" />
                      Drop-Off Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-green-50">
                    <AddressSelector 
                      type="to"
                      onAddressSelect={handleToAddressSelect}
                      useGoogleAutocomplete={true}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Step 2: Package Selection */}
              <Card className="overflow-hidden border-2 border-purple-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-sm mr-3">3</div>
                    <Package className="mr-3 h-6 w-6" />
                    Select Your Package
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Custom Packages */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Custom Packages</h3>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">Most Popular</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupedPackages.custom.map((pkg) => (
                        <PackageTypeCard
                          key={pkg.value}
                          icon={pkg.icon}
                          title={pkg.label}
                          description={pkg.description}
                          isSelected={selectedPackageType === pkg.value}
                          onClick={() => form.setValue('packageType', pkg.value)}
                          image={pkg.image}
                          isRecommended={pkg.value === 'box'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Carrier Packages */}
                  {Object.entries(groupedPackages).filter(([key]) => key !== 'custom').map(([carrier, packages]) => (
                    <div key={carrier}>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                        <span className="mr-3 text-2xl">
                          {carrier === 'USPS' && '🇺🇸'}
                          {carrier === 'UPS' && '🤎'}
                          {carrier === 'FedEx' && '💜'}
                          {carrier === 'DHL' && '🟡'}
                        </span>
                        {carrier} Standard Packages
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {packages.map((pkg) => (
                          <PackageTypeCard
                            key={pkg.value}
                            icon={pkg.icon}
                            title={pkg.label.replace(`${carrier} - `, '')}
                            description={pkg.description}
                            isSelected={selectedPackageType === pkg.value}
                            onClick={() => form.setValue('packageType', pkg.value)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Package Details */}
                  {selectedPackage && (
                    <div className="mt-8 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="mr-3 h-5 w-5 text-gray-600" />
                        Package Details
                      </h3>
                      {getInputFields()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 3: Additional Options */}
              <Card className="overflow-hidden border-2 border-orange-100 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center font-bold text-sm mr-3">4</div>
                    <Shield className="mr-3 h-6 w-6" />
                    Protection & Special Options
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* HAZMAT Option */}
                  <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <FormField
                      control={form.control}
                      name="hazmat"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              className="w-5 h-5"
                            />
                          </FormControl>
                          <div className="space-y-2 leading-none flex-1">
                            <FormLabel className="text-base font-semibold flex items-center text-yellow-800">
                              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
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
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="insurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                              className="w-5 h-5"
                            />
                          </FormControl>
                          <div className="space-y-2 leading-none flex-1">
                            <FormLabel className="text-base font-semibold flex items-center text-gray-900">
                              <Shield className="w-5 h-5 mr-2 text-blue-600" />
                              Package Insurance Protection
                            </FormLabel>
                            <p className="text-sm text-gray-600">
                              Protect your shipment against loss, theft, or damage. Only $4 per $100 of declared value.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {insuranceEnabled && (
                      <div className="ml-9 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <FormField
                          control={form.control}
                          name="declaredValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                Declared Value (USD)
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="100.00"
                                  className="h-11"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="mt-4 p-3 bg-white border border-blue-300 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-800">Insurance Cost:</span>
                            <span className="text-lg font-bold text-blue-900">${insuranceCost}</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            Based on ${declaredValue} declared value
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card className="overflow-hidden border-2 border-green-200 shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
                <CardContent className="p-6">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin mr-3" />
                        Getting Your Best Rates...
                      </>
                    ) : (
                      <>
                        <Search className="h-6 w-6 mr-3" />
                        Get Shipping Rates from All Carriers
                      </>
                    )}
                  </Button>
                  {!isLoading && (
                    <p className="text-center text-sm text-gray-600 mt-3">
                      Compare rates from USPS, UPS, FedEx, and DHL instantly
                    </p>
                  )}
                </CardContent>
              </Card>

            </form>
          </Form>
        </div>

        {/* Carrier Selection Sidebar - 1 column */}
        <div className="xl:col-span-1 space-y-6">
          <div className="sticky top-32">
            <CarrierSelector 
              selectedCarriers={selectedCarrier ? [selectedCarrier] : []}
              onCarrierChange={(carriers) => setSelectedCarrier(carriers[0] || '')}
            />
            
            {/* Help Card */}
            <Card className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Need Help?</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Select a specific carrier to see only their rates, or choose "All Carriers" to compare all options.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedesignedShippingForm;
