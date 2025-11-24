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
import HazmatSelector from './HazmatSelector';
import ToggleableInsuranceCalculator from './ToggleableInsuranceCalculator';
import ToggleableCustomsClearance from './ToggleableCustomsClearance';
import { Switch } from '@/components/ui/switch';
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
  hazmatType: z.string().optional()
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
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [insuranceAmount, setInsuranceAmount] = useState(100);
  const [insuranceCost, setInsuranceCost] = useState(2);
  const handleFromAddressSelect = createAddressSelectHandler(setFromAddress);
  const handleToAddressSelect = createAddressSelectHandler(setToAddress);
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      packageType: 'box',
      weightValue: undefined,
      weightUnit: 'lb',
      declaredValue: 100,
      // Default to $100
      length: undefined,
      width: undefined,
      height: undefined,
      insurance: true,
      // Default insurance to true
      hazmat: false,
      hazmatType: ''
    }
  });
  const watchPackageType = form.watch("packageType");
  const watchInsurance = form.watch("insurance");
  const watchDeclaredValue = form.watch("declaredValue");
  const watchHazmat = form.watch("hazmat");

  // Updated logic for showing dimensions based on package type
  const predefinedPackages = [
  // USPS Predefined Packages
  'Card', 'Letter', 'Flat', 'FlatRateEnvelope', 'FlatRateLegalEnvelope', 'FlatRatePaddedEnvelope', 'FlatRateWindowEnvelope', 'FlatRateCardboardEnvelope', 'SmallFlatRateEnvelope', 'Parcel', 'SoftPack', 'SmallFlatRateBox', 'MediumFlatRateBox', 'LargeFlatRateBox', 'LargeFlatRateBoxAPOFPO', 'FlatTubTrayBox', 'EMMTrayBox', 'FullTrayBox', 'HalfTrayBox', 'PMODSack',
  // FedEx Predefined Packages
  'FedExEnvelope', 'FedExBox', 'FedExPak', 'FedExTube', 'FedEx10kgBox', 'FedEx25kgBox', 'FedExSmallBox', 'FedExMediumBox', 'FedExLargeBox', 'FedExExtraLargeBox',
  // DHL Predefined Packages
  'JumboDocument', 'JumboParcel', 'Document', 'DHLFlyer', 'Domestic', 'ExpressDocument', 'DHLExpressEnvelope', 'JumboBox', 'JumboJuniorDocument', 'JuniorJumboBox', 'JumboJuniorParcel', 'OtherDHLPackaging', 'YourPackaging',
  // UPS Predefined Packages
  'UPSLetter', 'UPSExpressBox', 'UPS25kgBox', 'UPS10kgBox', 'Tube', 'Pak', 'SmallExpressBox', 'MediumExpressBox', 'LargeExpressBox',
  // Legacy packages for backward compatibility
  'canada_post_box', 'uk_post_box'];
  const showDimensions = watchPackageType === 'box';
  const showEnvelopeDimensions = watchPackageType === 'envelope';
  const isPredefinedPackage = predefinedPackages.includes(watchPackageType);
  const isInternational = fromAddress && toAddress && fromAddress.country !== toAddress.country;

  // Auto-trigger customs modal when international shipping is detected
  // Auto-trigger customs modal when international shipping is detected
  useEffect(() => {
    if (isInternational && !customsInfo && toAddress && fromAddress) {
      console.log('International shipping detected, opening customs modal');
      setShowCustomsModal(true);
    }
  }, [isInternational, customsInfo, toAddress, fromAddress]);

  // Listen for dimensions-only prefill from rate calculator
  useEffect(() => {
    const handleDimensionsPrefill = (event: CustomEvent) => {
      const {
        dimensions,
        weightUnit,
        packageType
      } = event.detail;
      console.log('Pre-filling dimensions only from rate calculator:', event.detail);

      // Update form with only dimensions, weight, and package type
      form.setValue('packageType', packageType);
      form.setValue('weightValue', parseFloat(dimensions.weight) || 0);
      form.setValue('weightUnit', weightUnit);
      if (dimensions.length) {
        form.setValue('length', parseFloat(dimensions.length));
      }
      if (dimensions.width) {
        form.setValue('width', parseFloat(dimensions.width));
      }
      if (dimensions.height) {
        form.setValue('height', parseFloat(dimensions.height));
      }
    };
    document.addEventListener('prefill-dimensions-only', handleDimensionsPrefill as EventListener);
    return () => {
      document.removeEventListener('prefill-dimensions-only', handleDimensionsPrefill as EventListener);
    };
  }, [form]);

  // Auto-fill from rate calculator sessionStorage on mount
  useEffect(() => {
    const rateCalcData = sessionStorage.getItem('rateCalculatorTransfer');
    if (rateCalcData) {
      try {
        const data = JSON.parse(rateCalcData);
        console.log('Auto-filling from rate calculator:', data);

        // Only fill weight, dimensions, and unit - addresses will be empty
        form.setValue('weightValue', parseFloat(data.weight) || 0);
        form.setValue('weightUnit', data.weightUnit || 'lbs');
        if (data.length) {
          form.setValue('length', parseFloat(data.length));
        }
        if (data.width) {
          form.setValue('width', parseFloat(data.width));
        }
        if (data.height) {
          form.setValue('height', parseFloat(data.height));
        }

        // Clear sessionStorage after using
        sessionStorage.removeItem('rateCalculatorTransfer');
        toast.success('Package details loaded from rate calculator');
      } catch (error) {
        console.error('Error parsing rate calculator data:', error);
      }
    }
  }, [form]);
  const handleCustomsSubmit = (customs: any) => {
    setCustomsInfo(customs);
    setShowCustomsModal(false);
    toast.success("Customs documentation saved successfully");
  };
  const handleInsuranceChange = (enabled: boolean, amount: number, cost: number) => {
    setInsuranceEnabled(enabled);
    setInsuranceAmount(amount);
    setInsuranceCost(enabled ? cost : 0); // Set cost to 0 when disabled
    form.setValue('insurance', enabled);
    form.setValue('declaredValue', amount);

    // Dispatch event to update insurance cost in rates display
    document.dispatchEvent(new CustomEvent('insurance-cost-updated', {
      detail: {
        enabled,
        cost: enabled ? cost : 0
      }
    }));
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

      // CORRECTED LOGIC: Conditionally set parcel data based on package type
      let parcelData: any = {
        weight: weightOz
      };

      // Check if the selected package type is a predefined package
      if (predefinedPackages.includes(values.packageType)) {
        parcelData.predefined_package = values.packageType;
        // Set dimensions to 0 for predefined packages
        parcelData.length = 0;
        parcelData.width = 0;
        parcelData.height = 0;
      } else if (values.packageType === 'envelope') {
        parcelData.length = values.length || 8;
        parcelData.width = values.width || 8;
        // No height for envelopes
      } else {
        // Defaults to 'box' and any other custom box
        parcelData.length = values.length || 8;
        parcelData.width = values.width || 8;
        parcelData.height = values.height || 2;
      }

      // Prepare the request payload for EasyPost API - DO NOT include insurance or hazmat during rate fetching
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
          phone: fromAddress.phone // Phone is optional, backend handles omission
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
          phone: toAddress.phone // Phone is optional, backend handles omission
        },
        parcel: parcelData,
        options: {},
        carriers: ['usps', 'ups', 'fedex', 'dhl'],
        // Default to all carriers
        customs_info: customsInfo
        // NOTE: insurance_info is NOT included during rate fetching
      };
      console.log('Submitting payload for rate fetching (without insurance/hazmat):', payload);

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
        // Process rates without insurance cost during rate fetching
        const processedRates = data.rates.map(rate => ({
          ...rate,
          // Store insurance and hazmat settings for later use during label creation
          _insuranceSettings: insuranceEnabled ? {
            enabled: insuranceEnabled,
            amount: insuranceAmount,
            cost: insuranceCost
          } : null,
          _hazmatSettings: values.hazmat ? {
            enabled: values.hazmat,
            type: values.hazmatType
          } : null
        }));

        // Dispatch the event with rates
        document.dispatchEvent(new CustomEvent('easypost-rates-received', {
          detail: {
            rates: processedRates,
            shipmentId: data.shipmentId,
            isInternational: isInternational,
            insuranceCost: insuranceEnabled ? insuranceCost : 0
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
            <div className="p-6 my-0 px-0 mx-[10px]">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">​    
 <MapPin className="w-5 h-5 text-green-600" />
                Pickup Address /sender address 
              </h3>
              <AddressSelector type="from" onAddressSelect={handleFromAddressSelect} useGoogleAutocomplete={true} />
            </div>

            {/* Drop-off Address */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Drop-off Address / receiver address  
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

              {/* Show dimensions only for box and envelope, hide for predefined packages */}
              {(showDimensions || showEnvelopeDimensions) && !isPredefinedPackage && <div className="grid grid-cols-3 gap-3 mb-4">
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
                  {/* Only show height for box, not envelope */}
                  {showDimensions && <FormField control={form.control} name="height" render={({
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
            </div>

            {/* Insurance Section */}
            <div className="p-6">
              <ToggleableInsuranceCalculator onInsuranceChange={handleInsuranceChange} />
            </div>

            {/* HAZMAT */}
            <div className="p-6 space-y-4">
              <FormField control={form.control} name="hazmat" render={({
              field
            }) => <FormItem>
                    <HazmatSelector isHazmat={field.value} hazmatType={form.watch('hazmatType') || ''} onHazmatChange={field.onChange} onHazmatTypeChange={type => form.setValue('hazmatType', type)} />
                    <FormMessage />
                  </FormItem>} />

              {/* Customs Clearance Toggle */}
              <ToggleableCustomsClearance enabled={!!customsInfo} onToggle={checked => {
              if (checked) {
                setShowCustomsModal(true);
              } else {
                setCustomsInfo(null);
              }
            }} />
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