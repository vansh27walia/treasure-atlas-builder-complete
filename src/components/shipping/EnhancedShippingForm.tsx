
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from './AddressSelector';
import { addressService, SavedAddress } from '@/services/AddressService';
import { Checkbox } from '@/components/ui/checkbox';
import { createAddressSelectHandler } from '@/utils/addressUtils';
import { Package, Shield, AlertTriangle, Truck, Search } from 'lucide-react';
import CustomsDocumentationModal, { CustomsInfo } from './CustomsDocumentationModal';
import AIRateAssistant from './AIRateAssistant';
import ChatAssistant from './ChatAssistant';

const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  packageValue: z.coerce.number().min(0, "Value must be greater than 0"),
  length: z.coerce.number().min(0, "Length must be greater than 0"),
  width: z.coerce.number().min(0, "Width must be greater than 0"),
  height: z.coerce.number().min(0, "Height must be greater than 0"),
  hazmat: z.boolean().default(false),
  hazmatType: z.string().optional(),
  insurance: z.boolean().default(true),
  selectedCarrier: z.string().default('all'),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const EnhancedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [customsInfo, setCustomsInfo] = useState<CustomsInfo | null>(null);
  const [rates, setRates] = useState<any[]>([]);

  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: 'box',
      weightValue: 0,
      weightUnit: 'lb',
      packageValue: 0,
      length: 8,
      width: 8,
      height: 2,
      hazmat: false,
      hazmatType: '',
      insurance: true,
      selectedCarrier: 'all',
    }
  });

  // Check for international shipping when addresses change
  useEffect(() => {
    if (fromAddress && toAddress) {
      const fromCountry = fromAddress.country || 'US';
      const toCountry = toAddress.country || 'US';
      
      if (fromCountry !== toCountry && !customsInfo) {
        setShowCustomsModal(true);
      }
    }
  }, [fromAddress, toAddress, customsInfo]);

  const handleCustomsComplete = (customs: CustomsInfo) => {
    setCustomsInfo(customs);
    setShowCustomsModal(false);
    toast.success('Customs documentation completed');
  };

  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please provide both origin and destination addresses");
      return;
    }

    // Check if international shipping requires customs
    const fromCountry = fromAddress.country || 'US';
    const toCountry = toAddress.country || 'US';
    
    if (fromCountry !== toCountry && !customsInfo) {
      setShowCustomsModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Convert weight to ounces
      let weightOz = values.weightValue;
      if (values.weightUnit === 'kg') {
        weightOz = values.weightValue * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = values.weightValue * 16;
      }
      
      const payload = {
        fromAddress: {
          name: fromAddress.name,
          company: fromAddress.company,
          street1: fromAddress.street1,
          street2: fromAddress.street2,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
        },
        toAddress: {
          name: toAddress.name,
          company: toAddress.company,
          street1: toAddress.street1,
          street2: toAddress.street2,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
        },
        parcel: {
          length: values.length,
          width: values.width,
          height: values.height,
          weight: weightOz,
        },
        options: {
          signature_confirmation: false,
          insurance: values.insurance ? (values.packageValue * 100) : undefined,
          hazmat: values.hazmat ? values.hazmatType : undefined,
        },
        customs_info: customsInfo ? {
          eel_pfc: customsInfo.eel_pfc,
          customs_certify: customsInfo.customs_certify,
          customs_signer: customsInfo.customs_signer,
          contents_type: customsInfo.contents_type,
          restriction_type: customsInfo.restriction_type,
          non_delivery_option: customsInfo.non_delivery_option,
          customs_items: customsInfo.customs_items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            value: item.value * 100, // Convert to cents
            weight: item.weight,
            hs_tariff_number: item.hs_tariff_number,
            origin_country: item.origin_country,
          })),
        } : undefined,
        carriers: values.selectedCarrier === 'all' ? ['usps', 'ups', 'fedex', 'dhl'] : [values.selectedCarrier]
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      const fetchedRates = data.rates || [];
      setRates(fetchedRates);

      document.dispatchEvent(new CustomEvent('easypost-rates-received', { 
        detail: { rates: fetchedRates, shipmentId: data.shipmentId } 
      }));

      toast.success("Shipping rates retrieved successfully");
      
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

  const handleRateRecommendation = (rateId: string) => {
    document.dispatchEvent(new CustomEvent('ai-rate-recommendation', {
      detail: { rateId }
    }));
  };

  const hazmatTypes = [
    'LITHIUM',
    'FLAMMABLE_LIQUID',
    'CORROSIVE',
    'TOXIC',
    'RADIOACTIVE',
    'EXPLOSIVE',
    'OXIDIZER',
    'COMPRESSED_GAS'
  ];

  const packageTypes = [
    { value: 'box', label: 'Box', description: 'Standard rectangular package' },
    { value: 'envelope', label: 'Envelope', description: 'Flat documents or thin items' },
    { value: 'usps_flat_rate_envelope', label: 'USPS Flat Rate Envelope', description: 'USPS Priority Mail' },
    { value: 'usps_small_flat_rate_box', label: 'USPS Small Flat Rate Box', description: 'USPS Priority Mail' },
    { value: 'usps_medium_flat_rate_box', label: 'USPS Medium Flat Rate Box', description: 'USPS Priority Mail' },
    { value: 'ups_letter', label: 'UPS Letter', description: 'UPS document service' },
    { value: 'ups_small_express_box', label: 'UPS Small Express Box', description: 'UPS Express service' },
    { value: 'fedex_envelope', label: 'FedEx Envelope', description: 'FedEx document service' },
    { value: 'fedex_small_box', label: 'FedEx Small Box', description: 'FedEx Express service' },
    { value: 'dhl_express_envelope', label: 'DHL Express Envelope', description: 'DHL international service' },
  ];

  const carriers = [
    { value: 'all', label: 'All Carriers', logo: '🚚' },
    { value: 'usps', label: 'USPS', logo: '🇺🇸' },
    { value: 'ups', label: 'UPS', logo: '🤎' },
    { value: 'fedex', label: 'FedEx', logo: '🟣' },
    { value: 'dhl', label: 'DHL', logo: '🟡' },
  ];

  return (
    <div className="w-full mb-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Ship Your Package</h1>
        <p className="text-slate-600">Get instant shipping rates from multiple carriers</p>
      </div>

      <Card className="border border-slate-200 w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-slate-200 w-full">
            {/* Pickup Address */}
            <div className="p-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pickup Location
                </h3>
                <AddressSelector 
                  type="from"
                  onAddressSelect={handleFromAddressSelect}
                  useGoogleAutocomplete={true}
                />
              </div>
            </div>

            {/* Drop-off Address */}
            <div className="p-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Drop-off Location
                </h3>
                <AddressSelector 
                  type="to"
                  onAddressSelect={handleToAddressSelect}
                  useGoogleAutocomplete={true}
                />
              </div>
            </div>

            {/* Package Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Package Details</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Package Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {packageTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-xs text-slate-500">{type.description}</div>
                                </div>
                              </SelectItem>
                            ))}
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
                          <FormLabel>Length (in)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              placeholder="0" 
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
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              placeholder="0" 
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
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
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
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              placeholder="0" 
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
                              <SelectItem value="lb">Pounds (lb)</SelectItem>
                              <SelectItem value="oz">Ounces (oz)</SelectItem>
                              <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="packageValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              step="0.01"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              value={field.value}
                              placeholder="0.00" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Carrier Selection */}
                  <FormField
                    control={form.control}
                    name="selectedCarrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Carrier</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carriers.map((carrier) => (
                              <SelectItem key={carrier.value} value={carrier.value}>
                                <div className="flex items-center gap-2">
                                  <span>{carrier.logo}</span>
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

                  {/* HAZMAT */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <FormField
                      control={form.control}
                      name="hazmat"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              Hazardous Material?
                            </FormLabel>
                            <p className="text-xs text-orange-700">
                              Check if package contains dangerous goods
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('hazmat') && (
                      <FormField
                        control={form.control}
                        name="hazmatType"
                        render={({ field }) => (
                          <FormItem className="mt-3">
                            <FormLabel>HAZMAT Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select HAZMAT type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {hazmatTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Insurance */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <FormField
                      control={form.control}
                      name="insurance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-600" />
                              Insurance ($4 per $100)
                            </FormLabel>
                            <p className="text-xs text-blue-700">
                              Protect against loss or damage
                            </p>
                            <p className="text-xs font-medium text-blue-800">
                              Cost: ${((form.watch('packageValue') || 0) * 0.04).toFixed(2)}
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="p-6 bg-slate-50">
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Getting Rates...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Get Shipping Rates
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </Card>

      {/* AI Rate Assistant */}
      {rates.length > 0 && (
        <AIRateAssistant 
          rates={rates} 
          onRateRecommendation={handleRateRecommendation}
        />
      )}

      {/* Customs Modal */}
      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => setShowCustomsModal(false)}
        onComplete={handleCustomsComplete}
        fromCountry={fromAddress?.country || 'US'}
        toCountry={toAddress?.country || 'US'}
      />

      {/* Chat Assistant */}
      <ChatAssistant 
        rates={rates}
        onRateRecommendation={handleRateRecommendation}
      />
    </div>
  );
};

export default EnhancedShippingForm;
