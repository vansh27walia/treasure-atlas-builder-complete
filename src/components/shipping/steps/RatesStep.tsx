
import React from 'react';
import { ArrowLeft, Truck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface RatesStepProps {
  onBack: () => void;
}

const RatesStep: React.FC<RatesStepProps> = ({ onBack }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customs
        </Button>
        <h2 className="text-lg font-semibold text-blue-800 flex items-center">
          <Truck className="mr-2 h-5 w-5" />
          Select Shipping Rate
        </h2>
      </div>
      
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">International Rates</AlertTitle>
        <AlertDescription className="text-blue-700">
          Compare rates from multiple carriers for your international shipment. Transit times are estimated and may vary.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RatesStep;
