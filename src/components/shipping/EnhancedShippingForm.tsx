
import React, { useState, useEffect } from 'react';
import ShippingForm from './ShippingForm';
import ShippingRates from '../ShippingRates';
import { useShippingRates } from '@/hooks/useShippingRates';

const EnhancedShippingForm = () => {
  const [currentStep, setCurrentStep] = useState<'form' | 'rates'>('form');
  const [shipmentDetails, setShipmentDetails] = useState<any>(null);
  const { rates } = useShippingRates();

  useEffect(() => {
    const handleFormCompleted = (event: CustomEvent) => {
      console.log('Form completed, switching to rates step');
      setShipmentDetails(event.detail);
      setCurrentStep('rates');
    };

    document.addEventListener('shipping-form-completed', handleFormCompleted as EventListener);

    return () => {
      document.removeEventListener('shipping-form-completed', handleFormCompleted as EventListener);
    };
  }, []);

  useEffect(() => {
    // If we have rates, show the rates step
    if (rates && rates.length > 0) {
      setCurrentStep('rates');
    }
  }, [rates]);

  return (
    <div className="space-y-6">
      {currentStep === 'form' && (
        <ShippingForm />
      )}
      
      {currentStep === 'rates' && (
        <div className="space-y-6">
          <ShippingForm />
          <ShippingRates shipmentDetails={shipmentDetails} />
        </div>
      )}
    </div>
  );
};

export default EnhancedShippingForm;
