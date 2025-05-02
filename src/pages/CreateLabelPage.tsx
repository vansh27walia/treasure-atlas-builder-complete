
import React from 'react';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';

const CreateLabelPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create a Shipping Label</h1>
      
      {/* Tracking Dashboard at the top */}
      <div className="mb-8">
        <TrackingDashboard />
      </div>
      
      <ShippingForm />
      <ShippingRates />
    </div>
  );
};

export default CreateLabelPage;
