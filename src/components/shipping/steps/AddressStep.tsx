
import React from 'react';
import { AlertCircle, Globe } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import InternationalShippingForm from '@/components/shipping/InternationalShippingForm';

interface AddressStepProps {
  onSubmit: (data: any) => void;
  formData: any;
}

const AddressStep: React.FC<AddressStepProps> = ({ onSubmit, formData }) => {
  return (
    <div>
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
          <Globe className="h-5 w-5 mr-2 text-blue-600" />
          Address Information
        </h2>
        <p className="text-blue-700 text-sm">
          Enter the shipping details for your international package.
        </p>
      </div>
      
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Important</AlertTitle>
        <AlertDescription className="text-amber-700">
          International shipments require complete and accurate address information. Make sure to provide the correct postal code and phone number.
        </AlertDescription>
      </Alert>
      
      <InternationalShippingForm onSubmit={onSubmit} initialData={formData} />
    </div>
  );
};

export default AddressStep;
