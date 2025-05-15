
import React, { useState, useCallback } from 'react';
import ShippingWorkflow from './ShippingWorkflow';
import AddressSelector from './AddressSelector';
import EnhancedShippingForm from './EnhancedShippingForm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ShippingStep } from '@/types/shipping';
import { toast } from '@/components/ui/use-toast';
import { Package, ArrowRight } from 'lucide-react';

const Shipping2Sheet: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ShippingStep>('address');
  const [progress, setProgress] = useState(25);
  
  // Form data state
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [toAddress, setToAddress] = useState<any>(null);
  const [parcelDetails, setParcelDetails] = useState<any>(null);
  const [customsInfo, setCustomsInfo] = useState<any>({
    customsItems: [],
    contentType: 'merchandise',
    nonDeliveryOption: 'return',
    customsCertify: true,
    customsSigner: '',
    contentsDescription: ''
  });

  // Validation states
  const [isFromAddressValid, setIsFromAddressValid] = useState(false);
  const [isToAddressValid, setIsToAddressValid] = useState(false);
  const [isParcelValid, setIsParcelValid] = useState(false);
  const [isCustomsValid, setIsCustomsValid] = useState(false);

  // Handle step change
  const handleStepChange = useCallback((step: ShippingStep) => {
    setCurrentStep(step);
    
    // Update progress based on step
    switch (step) {
      case 'address':
        setProgress(25);
        break;
      case 'package':
        setProgress(50);
        break;
      case 'rates':
        setProgress(75);
        break;
      case 'label':
      case 'complete':
        setProgress(100);
        break;
    }
    
    // Dispatch event for other components to listen to
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step } 
    }));
  }, []);
  
  // Updated handler for fromAddress to match the SimpleAddress signature
  const handleFromAddressChange = (address: any) => {
    setFromAddress(address);
    setIsFromAddressValid(true); // Assuming the address is valid if it's passed
  };
  
  // Updated handler for toAddress to match the SimpleAddress signature
  const handleToAddressChange = (address: any) => {
    setToAddress(address);
    setIsToAddressValid(true); // Assuming the address is valid if it's passed
  };
  
  const handleParcelChange = (parcel: any, isValid: boolean) => {
    setParcelDetails(parcel);
    setIsParcelValid(isValid);
  };
  
  const handleCustomsChange = (customs: any, isValid: boolean) => {
    setCustomsInfo(customs);
    setIsCustomsValid(isValid);
  };

  // Proceed to next step
  const handleContinue = () => {
    if (currentStep === 'address') {
      if (!isFromAddressValid || !isToAddressValid) {
        toast({
          title: "Error",
          description: "Please complete both addresses",
          variant: "destructive"
        });
        return;
      }
      
      // Check if both addresses are in the same country
      if (fromAddress?.country === toAddress?.country) {
        toast({
          title: "Error",
          description: "For shipments within the same country, please use the domestic shipping option",
          variant: "destructive"
        });
        return;
      }
      
      handleStepChange('package');
    } 
    else if (currentStep === 'package') {
      if (!isParcelValid) {
        toast({
          title: "Error",
          description: "Please complete package details",
          variant: "destructive"
        });
        return;
      }
      
      if (!isCustomsValid) {
        toast({
          title: "Error", 
          description: "Please complete customs information",
          variant: "destructive"
        });
        return;
      }
      
      // Create the shipment to get rates
      const requestData = {
        fromAddress,
        toAddress,
        parcel: parcelDetails,
        options: {
          customs_info: {
            customs_certify: customsInfo.customsCertify,
            customs_signer: customsInfo.customsSigner || fromAddress.name,
            contents_type: customsInfo.contentType,
            contents_explanation: customsInfo.contentsDescription,
            restriction_type: "none",
            eel_pfc: "NOEEI 30.37(a)",
            non_delivery_option: customsInfo.nonDeliveryOption,
            customs_items: customsInfo.customsItems.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              value: item.value,
              weight: item.weight,
              origin_country: fromAddress.country,
              hs_tariff_number: item.hsTariff || "",
              code: "",
            })),
          },
        },
      };
      
      // Dispatch a custom event to notify the rates component
      const ratesEvent = new CustomEvent('easypost-international-request', {
        detail: requestData
      });
      
      document.dispatchEvent(ratesEvent);
      
      // Move to rates step
      handleStepChange('rates');
    }
  };
  
  return (
    <div className="w-full">
      <ShippingWorkflow currentStep={currentStep} />
      
      <Progress value={progress} className="h-2 mt-4 mb-6 bg-gray-200" />
      
      {currentStep === 'address' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Sender Information</h2>
            <AddressSelector 
              type="from"
              onAddressSelect={handleFromAddressChange}
            />
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Recipient Information</h2>
            <AddressSelector 
              type="to"
              onAddressSelect={handleToAddressChange}
            />
          </div>
        </div>
      )}
      
      {currentStep === 'package' && (
        <div>
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" />
              Package Details
            </h2>
            
            <EnhancedShippingForm />
          </Card>
        </div>
      )}
      
      {(currentStep === 'address' || currentStep === 'package') && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {currentStep === 'rates' && (
        <div className="mb-6">
          <Separator className="my-6" />
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Select a shipping rate below to continue</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipping2Sheet;
