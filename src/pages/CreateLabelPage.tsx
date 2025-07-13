
import React from 'react';
import { useLocation } from 'react-router-dom';
import RedesignedShippingForm from '@/components/shipping/RedesignedShippingForm';
import RateCalculator from '@/components/shipping/RateCalculator';
import ShippingRates from '@/components/ShippingRates';

const CreateLabelPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');

  // Show Rate Calculator if tab=calculator
  if (tab === 'calculator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6">
          <RateCalculator />
          {/* Shipping Rates Section for Calculator */}
          <div id="shipping-rates-section" className="mt-8">
            <ShippingRates />
          </div>
        </div>
      </div>
    );
  }

  // Default shipping form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Create Shipping Label</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get competitive rates from multiple carriers and create professional shipping labels in minutes.
            </p>
          </div>

          {/* Main Content */}
          <RedesignedShippingForm />

          {/* Shipping Rates Section */}
          <div id="shipping-rates-section" className="mt-8">
            <ShippingRates />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelPage;
