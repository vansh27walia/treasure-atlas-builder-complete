
import React from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import AIPoweredSidePanel from '@/components/shipping/AIPoweredSidePanel';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const { rates, handleSelectRate, handleFilterByCarrier } = useShippingRates();

  const handleRatesReorder = (reorderedRates: any[]) => {
    console.log('Reordering rates:', reorderedRates);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Workflow Tracker with glassy effect */}
      <div className="pt-4">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Create Shipping Label
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Get competitive rates from multiple carriers with AI-powered assistance and smart recommendations.
            </p>
          </div>

          {/* Main Layout: Form on Left, AI Panel on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Form - Left Side (3/4 width) */}
            <div className="lg:col-span-3 space-y-8">
              <EnhancedShippingForm />
              
              {/* Shipping Rates Section with Full Screen Display */}
              <div id="shipping-rates-section" className="w-full">
                <ShippingRates />
              </div>
            </div>

            {/* AI-Powered Side Panel - Right Side (1/4 width) */}
            <div className="lg:col-span-1">
              <AIPoweredSidePanel 
                rates={rates}
                onRatesReorder={handleRatesReorder}
                onCarrierFilter={handleFilterByCarrier}
                onRateSelect={handleSelectRate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelPage;
