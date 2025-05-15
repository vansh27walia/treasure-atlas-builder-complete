
import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import CustomsInfoForm from '@/components/shipping/CustomsInfoForm';

interface CustomsStepProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
  initialData: any;
}

const CustomsStep: React.FC<CustomsStepProps> = ({ onSubmit, onBack, initialData }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Address
        </Button>
        <h2 className="text-lg font-semibold text-blue-800">Customs Information</h2>
      </div>
      
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Customs Declaration Required</AlertTitle>
        <AlertDescription className="text-amber-700">
          International shipments require customs declaration. Provide accurate item descriptions, values, and country of origin.
        </AlertDescription>
      </Alert>
      
      <CustomsInfoForm onSubmit={onSubmit} initialData={initialData} />
    </div>
  );
};

export default CustomsStep;
