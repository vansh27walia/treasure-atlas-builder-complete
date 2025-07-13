
import React from 'react';
import RedesignedShippingForm from '@/components/shipping/RedesignedShippingForm';
import ShippingRates from '@/components/ShippingRates';

const CreateLabelPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Shipping Label</h1>
            <p className="text-gray-600">
              Enter your shipping details to get rates and create labels from multiple carriers.
            </p>
          </div>

          {/* Redesigned Shipping Form */}
          <RedesignedShippingForm />

          {/* Shipping Rates Section */}
          <div id="shipping-rates-section">
            <ShippingRates />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelPage;
