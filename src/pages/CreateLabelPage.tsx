
import React from 'react';
import { useLocation } from 'react-router-dom';
import RedesignedShippingForm from '@/components/shipping/RedesignedShippingForm';
import IndependentRateCalculator from '@/components/shipping/IndependentRateCalculator';
import ShippingRates from '@/components/ShippingRates';

const CreateLabelPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');

  // Show Independent Rate Calculator if tab=calculator
  if (tab === 'calculator') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6">
          <IndependentRateCalculator />
        </div>
      </div>
    );
  }

  // Default shipping form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Main Content - Header now included in RedesignedShippingForm */}
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
