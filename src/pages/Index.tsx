
import React from 'react';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';

const Index: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create a Shipping Label</h1>
      <ShippingForm />
      <ShippingRates />
    </div>
  );
};

export default Index;
