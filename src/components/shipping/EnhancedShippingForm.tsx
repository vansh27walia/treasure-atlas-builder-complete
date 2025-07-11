
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedShippingForm from './UnifiedShippingForm';

interface EnhancedShippingFormProps {
  // Remove the problematic props that were causing type errors
}

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Shipping Information</CardTitle>
      </CardHeader>
      <CardContent>
        <UnifiedShippingForm />
      </CardContent>
    </Card>
  );
};

export default EnhancedShippingForm;
