
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Globe, AlertCircle } from 'lucide-react';
import CustomsDocumentationModal from './CustomsDocumentationModal';

interface CustomsData {
  customs_certify: boolean;
  customs_signer: string;
  contents_type: string;
  contents_explanation?: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments: string;
  customs_items: Array<{
    description: string;
    quantity: number;
    weight: number;
    value: number;
    hs_tariff_number: string;
    origin_country: string;
  }>;
  phone_number: string;
}

interface CustomsInfoPopoutProps {
  isInternational: boolean;
  fromCountry?: string;
  toCountry?: string;
  customsInfo?: CustomsData;
  onCustomsInfoSave: (info: CustomsData) => void;
  onProceedWithLabel: () => void;
}

const CustomsInfoPopout: React.FC<CustomsInfoPopoutProps> = ({
  isInternational,
  fromCountry,
  toCountry,
  customsInfo,
  onCustomsInfoSave,
  onProceedWithLabel
}) => {
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [showPopout, setShowPopout] = useState(isInternational && !customsInfo);

  const handleCustomsSave = (info: CustomsData) => {
    onCustomsInfoSave(info);
    setShowCustomsModal(false);
    setShowPopout(false);
    // After customs info is saved, proceed with label creation
    onProceedWithLabel();
  };

  const handleProceedWithoutCustoms = () => {
    setShowPopout(false);
    onProceedWithLabel();
  };

  if (!isInternational) {
    // For domestic shipments, proceed directly
    React.useEffect(() => {
      onProceedWithLabel();
    }, [onProceedWithLabel]);
    return null;
  }

  return (
    <>
      <Dialog open={showPopout} onOpenChange={setShowPopout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              International Shipment Detected
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  Customs Documentation Required
                </p>
                <p className="text-amber-700">
                  This shipment is going to {toCountry}. International shipments require customs documentation for proper processing.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowCustomsModal(true)}
                className="w-full"
              >
                <Globe className="w-4 h-4 mr-2" />
                Complete Customs Documentation
              </Button>
              
              <Button 
                onClick={handleProceedWithoutCustoms}
                variant="outline"
                className="w-full"
              >
                Skip Customs (Not Recommended)
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Skipping customs documentation may result in delivery delays or additional fees.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => setShowCustomsModal(false)}
        onSubmit={handleCustomsSave}
        fromCountry={fromCountry}
        toCountry={toCountry}
        initialData={customsInfo}
      />
    </>
  );
};

export default CustomsInfoPopout;
