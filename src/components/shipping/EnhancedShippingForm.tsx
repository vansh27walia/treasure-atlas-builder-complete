
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedShippingForm from './UnifiedShippingForm';

interface EnhancedShippingFormProps {
  isInternational?: boolean;
  onRateSelect?: (rateId: string) => void;
  onCreateLabel?: () => void;
  selectedRateId?: string | null;
}

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = ({
  isInternational,
  onRateSelect,
  onCreateLabel,
  selectedRateId
}) => {
  const handleRatesReceived = (rates: any[]) => {
    console.log('Rates received:', rates);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedShippingForm 
          onRatesReceived={handleRatesReceived}
          isInternational={isInternational}
          onRateSelect={onRateSelect}
          onCreateLabel={onCreateLabel}
          selectedRateId={selectedRateId}
        />
      </CardContent>
    </Card>
  );
};

export default EnhancedShippingForm;
