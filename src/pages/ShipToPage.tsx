
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Globe, AlertCircle, Package, CheckCircle, 
  Info, Truck, Download, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useShippingRates } from '@/hooks/useShippingRates';
import { AddressData, ParcelData, ShippingRequestData, carrierService } from '@/services/CarrierService';
import VerticalShippingForm from '@/components/shipping/VerticalShippingForm';
import ShippingRateDropdown from '@/components/shipping/ShippingRateDropdown';
import ShippingLabel from '@/components/shipping/ShippingLabel';
import PrintPreview from '@/components/shipping/PrintPreview';

interface FormValues {
  fromName: string;
  fromCompany: string;
  fromAddress1: string;
  fromAddress2: string;
  fromCity: string;
  fromState: string;
  fromZip: string;
  fromCountry: string;
  toName: string;
  toCompany: string;
  toAddress1: string;
  toAddress2: string;
  toCity: string;
  toState: string;
  toZip: string;
  toCountry: string;
  packageType: string;
  weightLb: number;
  weightOz: number;
  packageValue: number;
  length: number;
  width: number;
  height: number;
  carrier: string;
  description: string;
  contents: string;
  phone: string;
  toPhone: string;
}

const carriers = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'dhl', label: 'DHL' },
  { value: 'all', label: 'Compare All Carriers' },
];

const countries = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'MX', label: 'Mexico' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
];

const ShipToPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'document' | 'package'>('document');
  const [isLoading, setIsLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { rates, selectedRateId, handleSelectRate, bestValueRateId, fastestRateId } = useShippingRates();
  
  // Create form
  const form = useForm<FormValues>({
    defaultValues: {
      fromCountry: 'US',
      toCountry: '',
      carrier: 'all',
      packageType: activeTab === 'document' ? 'envelope' : 'box',
    }
  });
  
  // Define total steps in shipping workflow
  const totalSteps = 3; // 1: Address, 2: Rates, 3: Label

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setShowRates(false);
    
    try {
      // Prepare shipping request data
      const fromAddress: AddressData = {
        name: values.fromName,
        company: values.fromCompany || undefined,
        street1: values.fromAddress1,
        street2: values.fromAddress2 || undefined,
        city: values.fromCity,
        state: values.fromState,
        zip: values.fromZip,
        country: values.fromCountry,
        phone: values.phone || undefined,
      };
      
      const toAddress: AddressData = {
        name: values.toName,
        company: values.toCompany || undefined,
        street1: values.toAddress1,
        street2: values.toAddress2 || undefined,
        city: values.toCity,
        state: values.toState,
        zip: values.toZip,
        country: values.toCountry,
        phone: values.toPhone || undefined,
      };
      
      // Calculate weight in oz
      const weightInOz = (values.weightLb || 0) * 16 + (values.weightOz || 0);
      
      const parcel: ParcelData = {
        length: values.length || (activeTab === 'document' ? 10 : 12),
        width: values.width || (activeTab === 'document' ? 8 : 10),
        height: values.height || (activeTab === 'document' ? 0.25 : 8),
        weight: weightInOz || (activeTab === 'document' ? 3 : 16), // Default weight in oz
      };
      
      const requestData: ShippingRequestData = {
        fromAddress,
        toAddress,
        parcel,
        options: {
          label_format: 'PDF',
          insurance: values.packageValue > 0 ? values.packageValue : undefined,
        }
      };
      
      // Save form data for label printing information
      setShipmentDetails({
        fromAddress: `${fromAddress.name}${fromAddress.company ? '\n' + fromAddress.company : ''}
${fromAddress.street1}${fromAddress.street2 ? '\n' + fromAddress.street2 : ''}
${fromAddress.city}, ${fromAddress.state} ${fromAddress.zip}
${fromAddress.country}`,
        toAddress: `${toAddress.name}${toAddress.company ? '\n' + toAddress.company : ''}
${toAddress.street1}${toAddress.street2 ? '\n' + toAddress.street2 : ''}
${toAddress.city}, ${toAddress.state} ${toAddress.zip}
${toAddress.country}`,
        weight: values.weightLb ? 
          `${values.weightLb} lb ${values.weightOz ? values.weightOz + ' oz' : ''}` : 
          `${values.weightOz || 0} oz`,
        dimensions: values.length ? 
          `${values.length}" × ${values.width}" × ${values.height}"` : 
          undefined,
        service: '',  // Will be populated when a rate is selected
        carrier: '',  // Will be populated when a rate is selected
      });
      
      // Fetch shipping rates
      const shippingRates = await carrierService.getShippingRates(requestData);
      
      // Store shipment ID for label creation
      if (shippingRates.length > 0 && shippingRates[0]?.shipment_id) {
        setShipmentId(shippingRates[0].shipment_id);
      }
      
      // Dispatch custom event with shipping rates
      const ratesEvent = new CustomEvent('easypost-rates-received', {
        detail: {
          rates: shippingRates,
          shipmentId: shippingRates[0]?.shipment_id || null,
        }
      });
      
      document.dispatchEvent(ratesEvent);
      setShowRates(true);
      setCurrentStep(2); // Move to rates step
      toast.success("Shipping rates retrieved successfully");
      
      // Update service and carrier in shipment details
      if (shipmentDetails && selectedRateId) {
        const selectedRate = shippingRates.find(rate => rate.id === selectedRateId);
        if (selectedRate) {
          setShipmentDetails(prev => ({
            ...prev!,
            service: selectedRate.service,
            carrier: selectedRate.carrier.toUpperCase(),
          }));
        }
      }
    } catch (error) {
      console.error("Error getting shipping rates:", error);
      toast.error("Failed to get shipping rates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Saved addresses for quick selection
  const [savedAddresses, setSavedAddresses] = useState([
    { id: '1', name: 'Home Office', street: '123 Main St', city: 'Boston', state: 'MA', zip: '02101' },
    { id: '2', name: 'Warehouse', street: '456 Storage Ave', city: 'Chicago', state: 'IL', zip: '60007' },
    { id: '3', name: 'Retail Store', street: '789 Market St', city: 'San Francisco', state: 'CA', zip: '94103' },
  ]);
  
  const [selectedFromAddress, setSelectedFromAddress] = useState('');
  
  const handleSelectFromAddress = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      form.setValue('fromAddress1', address.street);
      form.setValue('fromCity', address.city);
      form.setValue('fromState', address.state);
      form.setValue('fromZip', address.zip);
      setSelectedFromAddress(addressId);
    }
  };

  // Function to verify address using EasyPost API
  const verifyAddress = async (type: 'from' | 'to') => {
    try {
      toast.info("Verifying address...");
      // In a real implementation, this would call the EasyPost address verification API
      // For now we'll just simulate success
      setTimeout(() => {
        toast.success(`${type === 'from' ? 'Origin' : 'Destination'} address verified successfully`);
      }, 1000);
    } catch (error) {
      toast.error(`Failed to verify ${type === 'from' ? 'origin' : 'destination'} address`);
    }
  };

  // Add this for label-related functionality
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [shipmentDetails, setShipmentDetails] = useState<{
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  } | undefined>();
  
  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Cannot create label: Missing rate or shipment information");
      return;
    }
    
    setIsCreatingLabel(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-international-label', {
        body: { shipmentId, rateId: selectedRateId }
      });
      
      if (error || !data) {
        console.error("Error creating shipping label:", error);
        throw new Error(error?.message || "Failed to create shipping label");
      }
      
      if (!data.labelUrl) {
        throw new Error("No label URL returned");
      }
      
      // Update the selected rate information in shipment details
      if (shipmentDetails && selectedRateId) {
        const selectedRate = rates.find(rate => rate.id === selectedRateId);
        if (selectedRate) {
          setShipmentDetails(prev => ({
            ...prev!,
            service: selectedRate.service,
            carrier: selectedRate.carrier.toUpperCase(),
          }));
        }
      }
      
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      setCurrentStep(3); // Move to final step
      toast.success("Shipping label created successfully");
      
      // Download the label automatically
      setTimeout(() => {
        try {
          // Method 1: Using anchor element
          const link = document.createElement('a');
          link.href = data.labelUrl;
          link.setAttribute('download', `shipping_label_${data.trackingCode || 'download'}.pdf`);
          link.setAttribute('target', '_blank');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (downloadError) {
          console.error("Download error:", downloadError);
          // Last resort: Just open the URL in a new tab
          window.open(data.labelUrl, '_blank');
        }
      }, 1000);
      
    } catch (error) {
      console.error("Label creation error:", error);
      toast.error("Failed to create label. Please try again.");
    } finally {
      setIsCreatingLabel(false);
    }
  };

  // Progress indicator component
  const ProgressIndicator = () => (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="relative">
            {/* Progress bar */}
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-purple-600 rounded-full" 
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              ></div>
            </div>
            
            {/* Step indicators */}
            <div className="absolute top-0 left-0 -mt-2 w-full flex justify-between">
              <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep > 1 ? <CheckCircle size={16} /> : 1}
                </div>
                <span className="mt-1 text-xs font-medium">Addresses</span>
              </div>
              
              <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                  {currentStep > 2 ? <CheckCircle size={16} /> : 2}
                </div>
                <span className="mt-1 text-xs font-medium">Rates</span>
              </div>
              
              <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
                  3
                </div>
                <span className="mt-1 text-xs font-medium">Label</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 shadow-sm">
        <h1 className="text-3xl font-bold flex items-center text-purple-800">
          <Truck className="mr-3 h-8 w-8 text-purple-600" /> 
          Ship To
        </h1>
      </div>

      {/* Progress tracker */}
      <ProgressIndicator />

      <Alert className="mb-6 bg-purple-50 border-2 border-purple-200">
        <Info className="h-5 w-5 text-purple-600" />
        <AlertTitle className="text-purple-800 font-bold">Ship To Information</AlertTitle>
        <AlertDescription className="text-purple-700">
          Ship to over 200+ countries worldwide with our reliable shipping services. Make sure to provide accurate information to avoid delays.
        </AlertDescription>
      </Alert>

      {/* Step 1: Address Form */}
      {currentStep === 1 && (
        <>
          <div className="mb-6">
            <div className="flex items-center mb-4 gap-2">
              <Button
                variant={activeTab === 'document' ? 'default' : 'outline'}
                onClick={() => setActiveTab('document')}
                className={activeTab === 'document' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 hover:bg-purple-50'}
              >
                <Package className="mr-2 h-5 w-5" />
                Ship Documents
              </Button>
              <Button
                variant={activeTab === 'package' ? 'default' : 'outline'}
                onClick={() => setActiveTab('package')}
                className={activeTab === 'package' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 hover:bg-purple-50'}
              >
                <Package className="mr-2 h-5 w-5" />
                Ship Packages
              </Button>
            </div>
            
            <VerticalShippingForm 
              form={form}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              countries={countries}
              carriers={carriers}
              savedAddresses={savedAddresses}
              selectedFromAddress={selectedFromAddress}
              onSelectFromAddress={handleSelectFromAddress}
              verifyAddress={verifyAddress}
              shipmentType={activeTab}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="p-6 border-2 border-purple-100 bg-purple-50">
              <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
                <Globe className="mr-2 h-5 w-5 text-purple-600" />
                Global Coverage
              </h3>
              <p className="text-purple-700 mb-2">Ship to over 200 countries and territories worldwide with our reliable shipping services.</p>
            </Card>
            
            <Card className="p-6 border-2 border-purple-100 bg-purple-50">
              <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-purple-600" />
                Documentation
              </h3>
              <p className="text-purple-700 mb-2">Proper documentation is required for all shipments. We'll guide you through the process.</p>
            </Card>
            
            <Card className="p-6 border-2 border-purple-100 bg-purple-50">
              <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
                <Package className="mr-2 h-5 w-5 text-purple-600" />
                Carrier Options
              </h3>
              <p className="text-purple-700 mb-2">Compare rates and services from USPS, UPS, DHL, and FedEx for your shipping needs.</p>
            </Card>
          </div>
        </>
      )}

      {/* Step 2: Rates */}
      {currentStep === 2 && showRates && rates.length > 0 && (
        <div className="space-y-6">
          <Card className="border-2 border-purple-200 shadow-sm p-6 bg-white rounded-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center text-purple-800">
              <Package className="mr-2 h-6 w-6 text-purple-600" /> 
              Select Shipping Option
            </h2>
            
            <ShippingRateDropdown
              rates={rates}
              selectedRateId={selectedRateId}
              onSelectRate={handleSelectRate}
              bestValueRateId={bestValueRateId}
              fastestRateId={fastestRateId}
              isLoading={isCreatingLabel}
              onCreateLabel={handleCreateLabel}
            />
            
            <div className="mt-8 flex flex-wrap justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="border-purple-200 hover:bg-purple-50"
              >
                Back to Address
              </Button>
              
              <Button
                type="button"
                disabled={!selectedRateId || isCreatingLabel}
                onClick={handleCreateLabel}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isCreatingLabel ? (
                  <>
                    <Package className="h-5 w-5 animate-spin mr-2" />
                    Creating Label...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Create & Print Label
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!selectedRateId}
                onClick={() => {
                  if (selectedRateId) {
                    const rate = rates.find(r => r.id === selectedRateId);
                    if (rate && rate.shipment_id) {
                      navigate(`/payment?amount=${Math.round(parseFloat(rate.rate) * 100)}&shipmentId=${rate.shipment_id}&rateId=${selectedRateId}`);
                    } else {
                      toast.error("Missing shipment information");
                    }
                  }
                }}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          </Card>
          
          <div className="text-center text-sm text-gray-500">
            <p>* All rates include handling fees and applicable taxes</p>
          </div>
        </div>
      )}

      {/* Step 3: Label */}
      {currentStep === 3 && labelUrl && (
        <Card className="border-2 border-purple-200 shadow-sm p-6 bg-white rounded-xl">
          <div className="py-6 flex flex-col items-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Label Created Successfully!</h2>
            <p className="text-gray-600 mb-6 text-center">
              Your shipping label has been created and is ready for download.
              {trackingCode && (
                <span className="block mt-2">
                  Tracking number: <span className="font-semibold">{trackingCode}</span>
                </span>
              )}
            </p>

            <div className="mb-6 p-4 border rounded-lg w-full max-w-md">
              <h3 className="font-semibold mb-2 text-gray-800">Shipping Label</h3>
              <div className="bg-gray-100 p-3 rounded">
                <img 
                  src={labelUrl} 
                  alt="Shipping Label Preview" 
                  className="max-w-full h-auto mb-3 border border-gray-300"
                />
                <div className="flex justify-end gap-2">
                  <PrintPreview 
                    labelUrl={labelUrl} 
                    trackingCode={trackingCode}
                    shipmentDetails={shipmentDetails}
                  />
                  <Button
                    variant="outline"
                    onClick={() => window.open(labelUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                className="border-purple-200 hover:bg-purple-50"
                onClick={() => {
                  setCurrentStep(1);
                  setLabelUrl(null);
                  setTrackingCode(null);
                  setShowRates(false);
                  form.reset({
                    fromCountry: 'US',
                    toCountry: '',
                    carrier: 'all',
                    packageType: activeTab === 'document' ? 'envelope' : 'box',
                  });
                }}
              >
                Ship Another Package
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/tracking')}
              >
                Track My Shipment
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ShipToPage;
