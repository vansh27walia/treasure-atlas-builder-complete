
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
import { MapPin, Package, Shield, AlertTriangle, Loader2, DollarSign, Box, Mail } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import AddressSelector from './AddressSelector';
import EnhancedWorkflowTracker from './EnhancedWorkflowTracker';
import CustomsDocumentationModal, { CustomsInfo } from './CustomsDocumentationModal';
import { SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const packageOptions = [
  // Custom packages
  { value: 'box', label: 'Standard Box', type: 'custom' as const, category: 'Custom', icon: '📦', description: 'Custom sized box' },
  { value: 'envelope', label: 'Envelope', type: 'custom' as const, category: 'Custom', icon: '✉️', description: 'Standard envelope' },
  
  // USPS options
  { value: 'FlatRateEnvelope', label: 'Flat Rate Envelope', type: 'predefined' as const, category: 'USPS', icon: '📮', description: 'USPS Priority Mail Express' },
  { value: 'LegalFlatRateEnvelope', label: 'Legal Flat Rate Envelope', type: 'predefined' as const, category: 'USPS', icon: '📋', description: 'Legal size documents' },
  { value: 'PaddedFlatRateEnvelope', label: 'Padded Flat Rate Envelope', type: 'predefined' as const, category: 'USPS', icon: '📪', description: 'Extra protection' },
  { value: 'SmallFlatRateBox', label: 'Small Flat Rate Box', type: 'predefined' as const, category: 'USPS', icon: '📦', description: '8.5" x 5.5" x 1.625"' },
  { value: 'MediumFlatRateBox', label: 'Medium Flat Rate Box', type: 'predefined' as const, category: 'USPS', icon: '📦', description: '11" x 8.5" x 5.5"' },
  { value: 'LargeFlatRateBox', label: 'Large Flat Rate Box', type: 'predefined' as const, category: 'USPS', icon: '📦', description: '12" x 12" x 5.5"' },
  
  // UPS options
  { value: 'UPSLetter', label: 'Letter', type: 'predefined' as const, category: 'UPS', icon: '✉️', description: 'Documents only' },
  { value: 'UPSExpressBox', label: 'Express Box', type: 'predefined' as const, category: 'UPS', icon: '📦', description: 'Small package' },
  { value: 'UPS25kgBox', label: '25kg Box', type: 'predefined' as const, category: 'UPS', icon: '📦', description: 'Large items' },
  
  // FedEx options
  { value: 'FedExEnvelope', label: 'Envelope', type: 'predefined' as const, category: 'FedEx', icon: '✉️', description: 'Documents' },
  { value: 'FedExBox', label: 'Box', type: 'predefined' as const, category: 'FedEx', icon: '📦', description: 'Standard box' },
  { value: 'FedExPak', label: 'Pak', type: 'predefined' as const, category: 'FedEx', icon: '📄', description: 'Flat items' },
  
  // DHL options
  { value: 'DHLExpressEnvelope', label: 'Express Envelope', type: 'predefined' as const, category: 'DHL', icon: '✉️', description: 'Documents' },
  { value: 'DHLExpressBox', label: 'Express Box', type: 'predefined' as const, category: 'DHL', icon: '📦', description: 'Standard package' },
];

const carrierOptions = [
  { value: 'all', label: 'All Carriers', logo: '🌐' },
  { value: 'usps', label: 'USPS', logo: '🇺🇸' },
  { value: 'ups', label: 'UPS', logo: '🤎' },
  { value: 'fedex', label: 'FedEx', logo: '💜' },
  { value: 'dhl', label: 'DHL', logo: '🟡' },
];

const hazmatTypes = [
  { value: 'LITHIUM', label: 'Lithium Batteries' },
  { value: 'CLASS_8_CORROSIVE', label: 'Corrosive Materials' },
  { value: 'CLASS_3_FLAMMABLE', label: 'Flammable Liquids' },
  { value: 'CLASS_9_MISCELLANEOUS', label: 'Miscellaneous Dangerous Goods' },
];

const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  carrier: z.string().min(1, "Please select a carrier"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  length: z.coerce.number().min(0, "Length must be greater than 0").optional(),
  width: z.coerce.number().min(0, "Width must be greater than 0").optional(),
  height: z.coerce.number().min(0, "Height must be greater than 0").optional(),
  insurance: z.boolean().default(true),
  declaredValue: z.coerce.number().min(0, "Declared value must be greater than 0").default(0),
  hazmat: z.boolean().default(false),
  hazmatType: z.string().optional(),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const RedesignedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates'>('address');
  const [customsInfo, setCustomsInfo] = useState<CustomsInfo | null>(null);
  const [showCustomsModal, setShowCustomsModal] = useState(false);

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: '',
      carrier: 'all',
      weightValue: 0,
      weightUnit: 'oz',
      length: 0,
      width: 0,
      height: 0,
      insurance: true,
      declaredValue: 0,
      hazmat: false,
      hazmatType: '',
    }
  });

  const selectedPackageType = form.watch('packageType');
  const selectedCarrier = form.watch('carrier');
  const declaredValue = form.watch('declaredValue');
  const insuranceEnabled = form.watch('insurance');
  const hazmatEnabled = form.watch('hazmat');

  // Calculate insurance cost - $4 per $100 of declared value
  const insuranceCost = insuranceEnabled ? Math.ceil(declaredValue / 100) * 4 : 0;

  // Check if international shipping is needed
  const isInternational = fromAddress && toAddress && 
    (fromAddress.country || 'US') !== (toAddress.country || 'US');

  // Update current step based on form completion
  useEffect(() => {
    if (fromAddress && toAddress) {
      setCurrentStep('package');
    } else {
      setCurrentStep('address');
    }
  }, [fromAddress, toAddress]);

  const selectedPackage = packageOptions.find(p => p.value === selectedPackageType);
  const showDimensions = selectedPackage?.type === 'custom';
  const isEnvelope = selectedPackageType === 'envelope' || selectedPackageType.includes('Envelope');

  // Group packages by category for dropdown
  const groupedPackages = packageOptions.reduce((acc, pkg) => {
    if (!acc[pkg.category]) {
      acc[pkg.category] = [];
    }
    acc[pkg.category].push(pkg);
    return acc;
  }, {} as Record<string, typeof packageOptions>);

  const handleCustomsComplete = (customs: CustomsInfo) => {
    setCustomsInfo(customs);
    setShowCustomsModal(false);
    toast.success("Customs documentation completed");
  };

  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please provide both origin and destination addresses");
      return;
    }

    // Check if international shipping requires customs documentation
    if (isInternational && !customsInfo) {
      setShowCustomsModal(true);
      return;
    }

    setIsLoading(true);
    setCurrentStep('rates');
    
    try {
      // Convert weight to ounces for backend processing
      let weightOz = values.weightValue;
      if (values.weightUnit === 'kg') {
        weightOz = values.weightValue * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = values.weightValue * 16;
      }

      // Build parcel object based on package type
      let parcel: any = {};

      if (selectedPackage?.type === 'custom') {
        if (isEnvelope) {
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
        carriers: values.carrier === 'all' ? ['usps', 'ups', 'fedex', 'dhl'] : [values.carrier]
      };

      // Add insurance if enabled
      if (values.insurance) {
        payload.insurance = values.declaredValue;
      }

      // Add HAZMAT if enabled
      if (values.hazmat && values.hazmatType) {
        payload.options.hazmat = values.hazmatType;
      }

      // Add customs info for international shipments
      if (isInternational && customsInfo) {
        payload.customs_info = customsInfo;
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
    <div className="w-full">
      {/* Enhanced Step Tracker - Now Sticky */}
      <EnhancedWorkflowTracker currentStep={currentStep} />

      <div className="max-w-4xl mx-auto px-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="space-y-6">
            
            {/* Address Section - Pickup on Top, Drop-off Below */}
            <Card className="overflow-hidden border border-blue-200/50 shadow-lg bg-gradient-to-br from-blue-50/80 to-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardTitle className="flex items-center text-xl">
                  <MapPin className="mr-3 h-6 w-6" />
                  Shipping Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Pickup Address - Top */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h3 className="text-lg font-semibold text-blue-800">Pickup Address</h3>
                  </div>
                  <AddressSelector 
                    type="from"
                    onAddressSelect={handleFromAddressSelect}
                    useGoogleAutocomplete={true}
                  />
                </div>
                
                {/* Drop-off Address - Bottom */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <h3 className="text-lg font-semibold text-blue-800">Drop-Off Address</h3>
                  </div>
                  <AddressSelector 
                    type="to"
                    onAddressSelect={handleToAddressSelect}
                    useGoogleAutocomplete={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Package Selection - Separate Vertical Section */}
            {fromAddress && toAddress && (
              <Card className="overflow-hidden border border-purple-200/50 shadow-lg bg-gradient-to-br from-purple-50/80 to-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-3 h-6 w-6" />
                    Package Selection
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold flex items-center gap-2">
                          <Box className="w-5 h-5" />
                          Select Package Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-16 text-base border-2 border-purple-200 focus:border-purple-500 bg-white/90 backdrop-blur-sm">
                              <SelectValue placeholder="Choose your package type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80 bg-white/95 backdrop-blur-md border-purple-200">
                            {Object.entries(groupedPackages).map(([category, packages]) => (
                              <div key={category}>
                                <div className="px-3 py-2 text-sm font-semibold text-purple-700 bg-purple-50/80 border-b border-purple-200">
                                  {category}
                                </div>
                                {packages.map((pkg) => (
                                  <SelectItem key={pkg.value} value={pkg.value} className="pl-4 py-3 hover:bg-purple-50">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">{pkg.icon}</span>
                                      <div>
                                        <div className="font-medium">{pkg.label}</div>
                                        <div className="text-xs text-gray-500">{pkg.description}</div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Carrier Selection - Separate Section */}
            {selectedPackageType && (
              <Card className="overflow-hidden border border-green-200/50 shadow-lg bg-gradient-to-br from-green-50/80 to-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-3 h-6 w-6" />
                    Carrier Selection
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Select Carrier</FormLabel>
                        <div className="grid grid-cols-3 gap-4">
                          {carrierOptions.map((carrier) => (
                            <div
                              key={carrier.value}
                              className={`
                                relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                                ${field.value === carrier.value 
                                  ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200' 
                                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                                }
                              `}
                              onClick={() => field.onChange(carrier.value)}
                            >
                              <div className="flex flex-col items-center text-center space-y-2">
                                <span className="text-3xl">{carrier.logo}</span>
                                <span className={`text-sm font-semibold ${
                                  field.value === carrier.value ? 'text-green-700' : 'text-gray-700'
                                }`}>
                                  {carrier.label}
                                </span>
                              </div>
                              {field.value === carrier.value && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-white"></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Package Details & Additional Options */}
            {selectedCarrier && (
              <Card className="overflow-hidden border border-blue-200/50 shadow-lg bg-gradient-to-br from-blue-50/80 to-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-3 h-6 w-6" />
                    Package Details
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left Column - Package Details */}
                    <div className="space-y-6">
                      {/* Package Dimensions (for custom packages) */}
                      {showDimensions && (
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                          <Label className="text-base font-semibold text-gray-900 mb-3 block">Package Dimensions</Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="length"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Length (inches)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="0"
                                      step="0.1"
                                      placeholder="0"
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
                                  <FormLabel>Width (inches)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="0" 
                                      step="0.1"
                                      placeholder="0"
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
                                    <FormLabel>Height (inches)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder="0"
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

                      {/* Package Weight */}
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                        <Label className="text-base font-semibold text-gray-900 mb-3 block">Package Weight</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="weightValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    placeholder="0"
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
                                <FormLabel>Unit</FormLabel>
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

                    {/* Right Column - Additional Options */}
                    <div className="space-y-6">
                      {/* HAZMAT Section */}
                      <div className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200/70 rounded-xl shadow-sm">
                        <FormField
                          control={form.control}
                          name="hazmat"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                  className="w-5 h-5 border-2 border-yellow-400 data-[state=checked]:bg-yellow-500"
                                />
                              </FormControl>
                              <div className="space-y-2 leading-none flex-1">
                                <FormLabel className="text-base font-semibold flex items-center text-yellow-800">
                                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                                  Contains Hazardous Materials (HAZMAT)
                                </FormLabel>
                                <p className="text-sm text-yellow-700">
                                  Check this if your package contains lithium batteries, chemicals, or other hazardous materials.
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        {hazmatEnabled && (
                          <div className="mt-4">
                            <FormField
                              control={form.control}
                              name="hazmatType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-yellow-800 font-medium">HAZMAT Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-11 border-yellow-300 bg-white">
                                        <SelectValue placeholder="Select HAZMAT type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {hazmatTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </div>

                      {/* Insurance Section */}
                      <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200/70 rounded-xl shadow-sm">
                        <FormField
                          control={form.control}
                          name="insurance"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-4 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                  className="w-5 h-5 border-2 border-green-400 data-[state=checked]:bg-green-500"
                                />
                              </FormControl>
                              <div className="space-y-2 leading-none flex-1">
                                <FormLabel className="text-base font-semibold flex items-center text-green-800">
                                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                                  Add $4 insurance per $100 shipment value
                                </FormLabel>
                                <p className="text-sm text-green-700">
                                  Protect your shipment against loss, theft, or damage. Recommended for all shipments.
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        {insuranceEnabled && (
                          <div className="mt-4 space-y-4">
                            <FormField
                              control={form.control}
                              name="declaredValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center text-green-800 font-medium">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    Declared Value (USD)
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      className="h-11 border-green-300 bg-white"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="p-4 bg-white/80 border-2 border-green-300/50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-800">Insurance Cost:</span>
                                <span className="text-xl font-bold text-green-900">${insuranceCost}</span>
                              </div>
                              <p className="text-xs text-green-600 mt-1">
                                Based on ${declaredValue} declared value
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* International Badge */}
                  {isInternational && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">
                        International Shipment
                      </Badge>
                      {customsInfo && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                          Customs Documentation Complete
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Getting Rates...
                        </>
                      ) : (
                        'Get Shipping Rates'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </div>

      {/* Customs Documentation Modal */}
      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => setShowCustomsModal(false)}
        onComplete={handleCustomsComplete}
        fromCountry={fromAddress?.country || 'US'}
        toCountry={toAddress?.country || 'US'}
      />
    </div>
  );
};

export default RedesignedShippingForm;
