
import React from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import AIPoweredSidePanel from '@/components/shipping/AIPoweredSidePanel';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const { rates, handleSelectRate, handleFilterByCarrier } = useShippingRates();

  const handleRatesReorder = (reorderedRates: any[]) => {
    // This will be handled by the side panel to reorder rates
    console.log('Reordering rates:', reorderedRates);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Workflow Tracker - positioned slightly lower */}
      <div className="pt-4">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">Create Shipping Label</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get competitive rates from multiple carriers and create professional shipping labels with AI-powered assistance.
            </p>
          </div>

          {/* Main Layout: Form on Left, AI Panel on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Form - Left Side (3/4 width) */}
            <div className="lg:col-span-3 space-y-8">
              <EnhancedShippingForm />
              
              {/* Shipping Rates Section */}
              <div id="shipping-rates-section">
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
