
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
import { MapPin, Package, Shield, AlertTriangle, Loader2, DollarSign } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import AddressSelector from './AddressSelector';
import EnhancedWorkflowTracker from './EnhancedWorkflowTracker';
import CustomsDocumentationModal, { CustomsInfo } from './CustomsDocumentationModal';
import { SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';

const packageOptions = [
  // Custom packages
  { value: 'box', label: 'Standard Box', type: 'custom', category: 'Custom' },
  { value: 'envelope', label: 'Envelope', type: 'custom', category: 'Custom' },
  
  // USPS options
  { value: 'FlatRateEnvelope', label: 'Flat Rate Envelope', type: 'predefined', category: 'USPS' },
  { value: 'LegalFlatRateEnvelope', label: 'Legal Flat Rate Envelope', type: 'predefined', category: 'USPS' },
  { value: 'PaddedFlatRateEnvelope', label: 'Padded Flat Rate Envelope', type: 'predefined', category: 'USPS' },
  { value: 'SmallFlatRateBox', label: 'Small Flat Rate Box', type: 'predefined', category: 'USPS' },
  { value: 'MediumFlatRateBox', label: 'Medium Flat Rate Box', type: 'predefined', category: 'USPS' },
  { value: 'LargeFlatRateBox', label: 'Large Flat Rate Box', type: 'predefined', category: 'USPS' },
  { value: 'RegionalRateBoxA', label: 'Regional Rate Box A', type: 'predefined', category: 'USPS' },
  { value: 'RegionalRateBoxB', label: 'Regional Rate Box B', type: 'predefined', category: 'USPS' },
  
  // UPS options
  { value: 'UPSLetter', label: 'Letter', type: 'predefined', category: 'UPS' },
  { value: 'UPSExpressBox', label: 'Express Box', type: 'predefined', category: 'UPS' },
  { value: 'UPS25kgBox', label: '25kg Box', type: 'predefined', category: 'UPS' },
  { value: 'UPS10kgBox', label: '10kg Box', type: 'predefined', category: 'UPS' },
  
  // FedEx options
  { value: 'FedExEnvelope', label: 'Envelope', type: 'predefined', category: 'FedEx' },
  { value: 'FedExBox', label: 'Box', type: 'predefined', category: 'FedEx' },
  { value: 'FedExPak', label: 'Pak', type: 'predefined', category: 'FedEx' },
  { value: 'FedEx10kgBox', label: '10kg Box', type: 'predefined', category: 'FedEx' },
  { value: 'FedEx25kgBox', label: '25kg Box', type: 'predefined', category: 'FedEx' },
  
  // DHL options
  { value: 'DHLExpressEnvelope', label: 'Express Envelope', type: 'predefined', category: 'DHL' },
  { value: 'DHLFlyer', label: 'Flyer', type: 'predefined', category: 'DHL' },
  { value: 'DHLExpressBox', label: 'Express Box', type: 'predefined', category: 'DHL' },
];

const carrierOptions = [
  { value: 'all', label: 'All Carriers', logo: null },
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
  declaredValue: z.coerce.number().min(0, "Declared value must be greater than 0").default(100),
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
      length: 8,
      width: 8,
      height: 2,
      insurance: true,
      declaredValue: 100,
      hazmat: false,
      hazmatType: '',
    }
  });

  const selectedPackageType = form.watch('packageType');
  const selectedCarrier = form.watch('carrier');
  const declaredValue = form.watch('declaredValue');
  const insuranceEnabled = form.watch('insurance');
  const hazmatEnabled = form.watch('hazmat');
  const selectedHazmatType = form.watch('hazmatType');

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
    <div className="w-full space-y-8">
      {/* Enhanced Step Tracker */}
      <EnhancedWorkflowTracker currentStep={currentStep} />

      <div className="max-w-4xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="space-y-8">
            
            {/* Address Section */}
            <div className="space-y-6">
              <Card className="overflow-hidden border border-blue-200/50 shadow-lg bg-gradient-to-br from-blue-50/80 to-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <MapPin className="mr-3 h-6 w-6" />
                    Shipping Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-800">Pickup Address</h3>
                      <AddressSelector 
                        type="from"
                        onAddressSelect={handleFromAddressSelect}
                        useGoogleAutocomplete={true}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-800">Drop-Off Address</h3>
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

            {/* Package & Shipping Details */}
            {fromAddress && toAddress && (
              <Card className="overflow-hidden border border-blue-200/50 shadow-lg bg-gradient-to-br from-blue-50/80 to-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-3 h-6 w-6" />
                    Package & Shipping Details
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-6">
                  {/* Package Type Dropdown */}
                  <div>
                    <FormField
                      control={form.control}
                      name="packageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Select Package Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Choose your package type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80">
                              {Object.entries(groupedPackages).map(([category, packages]) => (
                                <div key={category}>
                                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-600 bg-gray-50">
                                    {category}
                                  </div>
                                  {packages.map((pkg) => (
                                    <SelectItem key={pkg.value} value={pkg.value} className="pl-4">
                                      {pkg.label}
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
                  </div>

                  {/* Carrier Selection Dropdown */}
                  <div>
                    <FormField
                      control={form.control}
                      name="carrier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-semibold">Select Carrier</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue placeholder="Choose carrier preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carrierOptions.map((carrier) => (
                                <SelectItem key={carrier.value} value={carrier.value}>
                                  <div className="flex items-center gap-2">
                                    {carrier.logo && <span className="text-lg">{carrier.logo}</span>}
                                    <span>{carrier.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                              <FormLabel>Width (inches)</FormLabel>
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
                                <FormLabel>Height (inches)</FormLabel>
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

                  {/* HAZMAT Section - Always Visible */}
                  <div className="p-4 bg-yellow-50/80 border border-yellow-200/50 rounded-lg">
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
                              <FormLabel>HAZMAT Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-11">
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

                  {/* Insurance Section - Always Auto-Applied */}
                  <div className="p-4 bg-green-50/80 border border-green-200/50 rounded-lg">
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
                              <FormLabel className="flex items-center">
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
                        
                        <div className="p-3 bg-white/80 border border-green-300/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">Insurance Cost:</span>
                            <span className="text-lg font-bold text-green-900">${insuranceCost}</span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Based on ${declaredValue} declared value
                          </p>
                        </div>
                      </div>
                    )}
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
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
