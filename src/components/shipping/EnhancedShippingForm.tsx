import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AddressSelector from './AddressSelector';
import { addressService, SavedAddress } from '@/services/AddressService';
import { createAddressSelectHandler } from '@/utils/addressUtils';
import { Search, Package, MapPin, FileText, Shield, AlertTriangle } from 'lucide-react';
import CustomsDocumentationModal from './CustomsDocumentationModal';
import LabelCreationModal from './LabelCreationModal';
import PackageTypeSelector from './PackageTypeSelector';
import InsuranceCalculator from './InsuranceCalculator';
import HazmatSelector from './HazmatSelector';
const shippingFormSchema = z.object({
  packageType: z.string().min(1, "Please select a package type"),
  weightValue: z.coerce.number().min(0, "Weight must be greater than 0"),
  weightUnit: z.enum(["oz", "kg", "lb"]),
  declaredValue: z.coerce.number().min(0, "Value must be greater than 0"),
  length: z.coerce.number().min(0, "Length must be greater than 0").optional(),
  width: z.coerce.number().min(0, "Width must be greater than 0").optional(),
  height: z.coerce.number().min(0, "Height must be greater than 0").optional(),
  insurance: z.boolean().default(true),
  hazmat: z.boolean().default(false),
  hazmatType: z.string().optional(),
  carriers: z.array(z.string()).default(['usps', 'ups', 'fedex', 'dhl'])
});
type ShippingFormValues = z.infer<typeof shippingFormSchema>;
const EnhancedShippingForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [toAddress, setToAddress] = useState<SavedAddress | null>(null);
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [customsInfo, setCustomsInfo] = useState<any>(null);
  const [showLabelCreationModal, setShowLabelCreationModal] = useState(false);
  const [labelCreationData, setLabelCreationData] = useState<any>(null);
  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: 'box',
      weightValue: undefined,
      weightUnit: 'lb',
      declaredValue: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      insurance: true,
      hazmat: false,
      hazmatType: '',
      carriers: ['usps', 'ups', 'fedex', 'dhl']
    }
  });
  const watchPackageType = form.watch("packageType");
  const watchInsurance = form.watch("insurance");
  const watchDeclaredValue = form.watch("declaredValue");
  const watchHazmat = form.watch("hazmat");
  const insuranceCost = watchInsurance && watchDeclaredValue ? Math.max(2, Math.ceil(watchDeclaredValue / 100 * 2)) : 0;
  const showDimensions = ['box', 'envelope'].includes(watchPackageType);
  const isInternational = fromAddress && toAddress && fromAddress.country !== toAddress.country;

  // Auto-trigger customs modal when international shipping is detected
  useEffect(() => {
    if (isInternational && !customsInfo && toAddress && fromAddress) {
      console.log('International shipping detected, opening customs modal');
      setShowCustomsModal(true);
    }
  }, [isInternational, customsInfo, toAddress, fromAddress]);
  const handleCustomsSubmit = (customs: any) => {
    setCustomsInfo(customs);
    setShowCustomsModal(false);
    toast.success("Customs documentation saved successfully");
  };
  const handleInsuranceChange = (enabled: boolean, amount: number) => {
    form.setValue('insurance', enabled);
    form.setValue('declaredValue', amount);
  };
  const handleGetRates = async (values: ShippingFormValues) => {
    if (!fromAddress || !toAddress) {
      toast.error("Please provide both origin and destination addresses");
      return;
    }

    // For international shipping, customs info is required
    if (isInternational && !customsInfo) {
      toast.error("Please complete customs documentation for international shipments");
      setShowCustomsModal(true);
      return;
    }
    setIsLoading(true);
    try {
      // Convert weight to ounces for backend processing
      let weightOz = values.weightValue || 0;
      if (values.weightUnit === 'kg') {
        weightOz = weightOz * 35.274;
      } else if (values.weightUnit === 'lb') {
        weightOz = weightOz * 16;
      }

      // Prepare the request payload for EasyPost API - same format for both domestic and international
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
          phone: fromAddress.phone || ''
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
          phone: toAddress.phone || ''
        },
        parcel: {
          length: values.length || 8,
          width: values.width || 8,
          height: values.height || 2,
          weight: weightOz
        },
        options: {
          hazmat: values.hazmat ? values.hazmatType : undefined
        },
        carriers: values.carriers,
        customs_info: customsInfo,
        insurance_info: values.insurance ? {
          amount: values.declaredValue,
          cost: insuranceCost
        } : null
      };
      console.log('Submitting payload:', payload);

      // Use the same endpoint for both domestic and international
      const {
        data,
        error
      } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });
      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }
      if (data.rates && Array.isArray(data.rates)) {
        // Process rates with insurance cost and apply same formatting as domestic
        const ratesWithInsurance = data.rates.map(rate => ({
          ...rate,
          insurance_cost: insuranceCost,
          total_cost: parseFloat(rate.rate) + insuranceCost
        }));

        // Dispatch the same event format for both domestic and international
        document.dispatchEvent(new CustomEvent('easypost-rates-received', {
          detail: {
            rates: ratesWithInsurance,
            shipmentId: data.shipmentId,
            isInternational: isInternational
          }
        }));
      }
      toast.success("Shipping rates retrieved successfully");

      // Scroll to the rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error(error instanceof Error ? error.message : "Failed to get shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for label creation events
  useEffect(() => {
    const handleLabelCreated = (event: any) => {
      const {
        labelData
      } = event.detail;
      setLabelCreationData({
        ...labelData,
        fromAddress,
        toAddress,
        isInternational,
        customsInfo
      });
      setShowLabelCreationModal(true);
    };
    document.addEventListener('label-created', handleLabelCreated);
    return () => document.removeEventListener('label-created', handleLabelCreated);
  }, [fromAddress, toAddress, isInternational, customsInfo]);
  return <div className="w-full">
      <Card className="border shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetRates)} className="divide-y divide-border">
            {/* Pickup Address */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Pickup Address
              </h3>
              <AddressSelector type="from" onAddressSelect={handleFromAddressSelect} useGoogleAutocomplete={true} />
            </div>

            {/* Drop-off Address */}
            <div className="p-6">
              <h3 className="text-foreground mb-4 flex items-center gap-2 text-2xl font-semibold text-left">
                <MapPin className="w-5 h-5 text-red-600" />
                Drop-off Address
              </h3>
              <AddressSelector type="to" onAddressSelect={handleToAddressSelect} useGoogleAutocomplete={true} />
            </div>
            
            {/* Package Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package Details
              </h3>
                
              <div className="mb-4">
                <FormField control={form.control} name="packageType" render={({
                field
              }) => <FormItem>
                      <PackageTypeSelector value={field.value} onChange={field.onChange} />
                      <FormMessage />
                    </FormItem>} />
              </div>

              {showDimensions && <div className="grid grid-cols-3 gap-3 mb-4">
                  <FormField control={form.control} name="length" render={({
                field
              }) => <FormItem>
                        <FormLabel className="text-sm">Length (in)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="bg-white" placeholder="Length" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="width" render={({
                field
              }) => <FormItem>
                        <FormLabel className="text-sm">Width (in)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.1" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="bg-white" placeholder="Width" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  {watchPackageType === 'box' && <FormField control={form.control} name="height" render={({
                field
              }) => <FormItem>
                          <FormLabel className="text-sm">Height (in)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.1" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="bg-white" placeholder="Height" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />}
                </div>}

              <div className="grid grid-cols-2 gap-3 mb-4">
                <FormField control={form.control} name="weightValue" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-sm">Weight</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} className="bg-white" placeholder="Weight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                <FormField control={form.control} name="weightUnit" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-sm">Unit</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm">
                          <option value="lb">Pounds (lb)</option>
                          <option value="oz">Ounces (oz)</option>
                          <option value="kg">Kilograms (kg)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>

              <div className="mb-4">
                <FormField control={form.control} name="carriers" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-sm">Preferred Carriers</FormLabel>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[{
                    id: 'usps',
                    name: 'USPS'
                  }, {
                    id: 'ups',
                    name: 'UPS'
                  }, {
                    id: 'fedex',
                    name: 'FedEx'
                  }, {
                    id: 'dhl',
                    name: 'DHL'
                  }].map(carrier => <label key={carrier.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox" checked={field.value.includes(carrier.id)} onChange={e => {
                      if (e.target.checked) {
                        field.onChange([...field.value, carrier.id]);
                      } else {
                        field.onChange(field.value.filter(c => c !== carrier.id));
                      }
                    }} className="rounded border-gray-300" />
                            <span className="text-sm font-medium">{carrier.name}</span>
                          </label>)}
                      </div>
                      <FormMessage />
                    </FormItem>} />
              </div>
            </div>

            {/* Insurance */}
            <div className="p-6">
              <InsuranceCalculator onInsuranceChange={handleInsuranceChange} />
            </div>

            {/* HAZMAT */}
            <div className="p-6">
              <FormField control={form.control} name="hazmat" render={({
              field
            }) => <FormItem>
                    <HazmatSelector isHazmat={field.value} hazmatType={form.watch('hazmatType') || ''} onHazmatChange={field.onChange} onHazmatTypeChange={type => form.setValue('hazmatType', type)} />
                    <FormMessage />
                  </FormItem>} />
            </div>

            {/* Customs Documentation Section */}
            {isInternational && <div className="p-6 bg-blue-50 border-l-4 border-blue-400">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Customs Documentation
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Required</span>
                  </h3>
                  <Button type="button" onClick={() => setShowCustomsModal(true)} variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    {customsInfo ? 'Edit Customs Info' : 'Add Customs Info'}
                  </Button>
                </div>
                
                {customsInfo ? <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Contents Type:</span>
                        <span className="ml-2 capitalize">{customsInfo.contents_type}</span>
                      </div>
                      <div>
                        <span className="font-medium">Signer:</span>
                        <span className="ml-2">{customsInfo.customs_signer}</span>
                      </div>
                      <div>
                        <span className="font-medium">Items:</span>
                        <span className="ml-2">{customsInfo.customs_items?.length || 0} item(s)</span>
                      </div>
                      <div>
                        <span className="font-medium">Total Value:</span>
                        <span className="ml-2">
                          ${customsInfo.customs_items?.reduce((sum: number, item: any) => sum + item.value * item.quantity, 0).toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div> : <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Customs documentation is required for international shipments
                      </span>
                    </div>
                  </div>}
              </div>}
              
            {/* Submit Section */}
            <div className="p-6 bg-muted/50">
              <Button type="submit" className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                {isLoading ? <Search className="w-5 h-5 mr-2 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
                Get Shipping Rates
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      {/* Customs Documentation Modal */}
      <CustomsDocumentationModal isOpen={showCustomsModal} onClose={() => setShowCustomsModal(false)} onSubmit={handleCustomsSubmit} fromCountry={fromAddress?.country || ''} toCountry={toAddress?.country || ''} initialData={customsInfo} />

      {/* Label Creation Modal */}
      <LabelCreationModal isOpen={showLabelCreationModal} onClose={() => setShowLabelCreationModal(false)} labelData={labelCreationData} />
    </div>;
};
export default EnhancedShippingForm;