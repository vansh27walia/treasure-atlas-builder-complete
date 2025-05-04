
import React from 'react';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';

const CreateLabelPage: React.FC = () => {
  return (
    <div className="container mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-4">Create Shipping Label</h1>
      <p className="text-gray-600 mb-6">Enter shipping details below to generate rates and create a shipping label.</p>
      
      <ShippingForm />
      <ShippingRates />
    </div>
  );
};

export default CreateLabelPage;
