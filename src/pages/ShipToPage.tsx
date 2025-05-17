
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import PrintPreview from '@/components/shipping/PrintPreview';
import ShippingRateCard from '@/components/shipping/ShippingRateCard';

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
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates' | 'label' | 'complete'>('address');
  const { 
    rates, 
    allRates, 
    selectedRateId, 
    handleSelectRate, 
    bestValueRateId, 
    fastestRateId,
    isLoading: ratesLoading,
    handleCreateLabel: createLabel,
    labelUrl,
    trackingCode,
    shipmentId,
    uniqueCarriers,
    activeCarrierFilter,
    handleFilterByCarrier
  } = useShippingRates();
  
  // Add ref for print functionality
  const printContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Listen for custom events to update workflow step
    const handleStepChange = (event: CustomEvent<{step: 'address' | 'package' | 'rates' | 'label' | 'complete'}>) => {
      if (event.detail && event.detail.step) {
        setCurrentStep(event.detail.step);
      }
    };
    
    document.addEventListener('shipping-step-change', handleStepChange as EventListener);
    
    return () => {
      document.removeEventListener('shipping-step-change', handleStepChange as EventListener);
    };
  }, []);
  
  // Add this for label-related functionality
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<{
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  } | undefined>();
  
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
        // setShipmentId(shippingRates[0].shipment_id);
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
      setCurrentStep('rates'); // Move to rates step
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
      
      // Scroll to the rates section
      setTimeout(() => {
        const ratesSection = document.getElementById('shipping-rates-section');
        if (ratesSection) {
          ratesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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
      // Set address fields in form
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

  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Cannot create label: Missing rate or shipment information");
      return;
    }
    
    setIsCreatingLabel(true);
    console.log("Creating label with rate:", selectedRateId, "and shipment:", shipmentId);
    
    try {
      // Get the selected rate to update shipment details before creating label
      const selectedRate = rates.find(rate => rate.id === selectedRateId);
      if (selectedRate && shipmentDetails) {
        setShipmentDetails(prev => ({
          ...prev!,
          service: selectedRate.service,
          carrier: selectedRate.carrier.toUpperCase(),
        }));
      }
      
      // Call the createLabel function from useShippingRates hook
      await createLabel();
      
      // Update workflow step
      setCurrentStep('label');
      toast.success("Label created successfully!");
      
    } catch (error) {
      console.error("Label creation error:", error);
      toast.error("Failed to create label. Please try again.");
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const downloadLabel = () => {
    if (!labelUrl) return;
    
    const link = document.createElement('a');
    link.href = labelUrl;
    link.setAttribute('download', `shipping_label_${trackingCode || 'download'}.pdf`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Label download started");
  };
  
  // Sort rates by price for display
  const sortedRates = rates ? [...rates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate)) : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100 shadow-sm">
        <h1 className="text-2xl font-bold flex items-center text-purple-800">
          <Globe className="mr-3 h-7 w-7 text-purple-600" /> 
          Ship To
        </h1>
      </div>

      {/* Workflow steps */}
      <div className="mb-6">
        <ShippingWorkflow currentStep={currentStep} />
      </div>

      <Alert className="mb-6 bg-purple-50 border border-purple-200">
        <Info className="h-5 w-5 text-purple-600" />
        <AlertTitle className="text-purple-800 font-bold">Ship To</AlertTitle>
        <AlertDescription className="text-purple-700">
          Ship to addresses within your country or internationally with our reliable shipping services. Complete the form below to get started.
        </AlertDescription>
      </Alert>

      {/* Address Form - Only shown in address step */}
      {currentStep === 'address' && (
        <Card className="border border-purple-200 shadow-md rounded-xl overflow-hidden w-full mb-6">
          <div className="p-6">
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
            
            <EnhancedShippingForm />
          </div>
        </Card>
      )}

      {/* Rates Section - Only shown in rates step */}
      {currentStep === 'rates' && (
        <Card className="border border-purple-200 shadow-md rounded-xl overflow-hidden w-full mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-purple-800 flex items-center mb-6" id="shipping-rates-section">
              <Package className="mr-2 h-6 w-6 text-purple-600" /> 
              Select Shipping Option
            </h2>
            
            {ratesLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-purple-800">Loading shipping rates...</p>
              </div>
            ) : sortedRates.length > 0 ? (
              <>
                {/* Display shipping rates in a vertical list */}
                <div className="space-y-4">
                  {sortedRates.map((rate) => (
                    <ShippingRateCard
                      key={rate.id}
                      rate={rate}
                      isSelected={selectedRateId === rate.id}
                      onSelect={handleSelectRate}
                      isBestValue={rate.id === bestValueRateId}
                      isFastest={rate.id === fastestRateId}
                      showDiscount={true}
                    />
                  ))}
                </div>
                
                <div className="mt-8 flex flex-wrap justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('address')}
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
                        const rate = sortedRates.find(r => r.id === selectedRateId);
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
              </>
            ) : (
              <div className="text-center py-10 border rounded-lg bg-gray-50">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Shipping Rates Available</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any shipping rates for the provided details. Please try adjusting your shipping information.
                </p>
                <Button 
                  onClick={() => setCurrentStep('address')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Back to Shipping Details
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Label Section - Only shown in label step */}
      {currentStep === 'label' && labelUrl && (
        <Card className="border border-purple-200 shadow-md rounded-xl overflow-hidden w-full mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-purple-800 flex items-center">
                <CheckCircle className="mr-2 h-6 w-6 text-green-600" /> 
                Label Created Successfully
              </h2>
              
              <div className="flex gap-2">
                <PrintPreview 
                  labelUrl={labelUrl} 
                  trackingCode={trackingCode}
                  shipmentDetails={shipmentDetails}
                />
                <Button
                  variant="outline"
                  onClick={downloadLabel}
                  className="flex items-center gap-2 border-purple-200 hover:bg-purple-50"
                >
                  <Download className="h-4 w-4" /> Download Label
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={printContainerRef}>
              {/* Label Preview */}
              <div className="p-4 border rounded-md bg-white">
                <h3 className="font-semibold mb-3">Shipping Label</h3>
                <img 
                  src={labelUrl} 
                  alt="Shipping Label Preview" 
                  className="max-w-full h-auto border border-gray-300 mb-3"
                />
                {trackingCode && (
                  <div className="bg-purple-50 p-3 rounded-md mt-3">
                    <p className="text-sm font-medium">Tracking Number:</p>
                    <p className="font-mono text-sm">{trackingCode}</p>
                  </div>
                )}
              </div>
              
              {/* Shipment Summary */}
              <div className="p-4 border rounded-md bg-white">
                <h3 className="font-semibold mb-3">Shipping Details</h3>
                
                {shipmentDetails && (
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-700">From:</p>
                        <p className="whitespace-pre-line">{shipmentDetails.fromAddress}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">To:</p>
                        <p className="whitespace-pre-line">{shipmentDetails.toAddress}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-700">Service:</p>
                          <p>{shipmentDetails.carrier} - {shipmentDetails.service}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Weight:</p>
                          <p>{shipmentDetails.weight}</p>
                        </div>
                      </div>
                      
                      {shipmentDetails.dimensions && (
                        <div className="mt-2">
                          <p className="font-medium text-gray-700">Dimensions:</p>
                          <p>{shipmentDetails.dimensions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep('address');
                  setShowRates(false);
                }}
                className="border-purple-200 hover:bg-purple-50"
              >
                Ship Another Package
              </Button>
              <Button
                onClick={() => navigate('/tracking')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Track This Shipment
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Informational cards at the bottom - Only shown in address step */}
      {currentStep === 'address' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-2 border-purple-100 bg-purple-50">
            <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
              <Globe className="mr-2 h-5 w-5 text-purple-600" />
              Global Coverage
            </h3>
            <p className="text-purple-700 mb-2">Ship to over 200 countries worldwide with reliable carriers and competitive rates.</p>
          </Card>
          
          <Card className="p-6 border-2 border-purple-100 bg-purple-50">
            <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-purple-600" />
              Documentation Help
            </h3>
            <p className="text-purple-700 mb-2">We'll automatically generate the customs forms needed for your international shipment.</p>
          </Card>
          
          <Card className="p-6 border-2 border-purple-100 bg-purple-50">
            <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
              <Truck className="mr-2 h-5 w-5 text-purple-600" />
              Multiple Carriers
            </h3>
            <p className="text-purple-700 mb-2">Compare rates from USPS, FedEx, UPS, and DHL to find the best shipping option.</p>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShipToPage;
