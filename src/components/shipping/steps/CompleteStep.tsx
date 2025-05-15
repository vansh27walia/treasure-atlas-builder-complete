
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CompleteStepProps {
  labelUrl: string;
  trackingCode: string;
  onResetShipping: () => void;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ 
  labelUrl, 
  trackingCode,
  onResetShipping 
}) => {
  const navigate = useNavigate();

  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Label Created!</h2>
      <p className="text-gray-600 mb-6">
        Your international shipping label has been successfully created. You can download it below.
      </p>
      
      <div className="flex flex-col space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-800 mb-1">Tracking Information</h3>
          <p className="text-gray-600 mb-2">Tracking number: <span className="font-mono">{trackingCode}</span></p>
          
          <Button 
            onClick={() => {
              window.open(labelUrl, '_blank');
            }}
            className="w-full mt-2"
          >
            Download Shipping Label
          </Button>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onResetShipping}
          >
            Create Another Label
          </Button>
          
          <Button 
            className="flex-1"
            onClick={() => navigate('/tracking')}
          >
            Track Shipment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompleteStep;
