
import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import AIPoweredSidePanel from '@/components/shipping/AIPoweredSidePanel';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier
  } = useShippingRates();

  const handleRatesReorder = (reorderedRates: any[]) => {
    console.log('Reordering rates:', reorderedRates);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker with glass effect */}
      <div className="sticky top-0 z-50">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Create Shipping Label</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Get competitive rates from multiple carriers and create professional shipping labels with AI-powered assistance.
            </p>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Main Form Section */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-xl shadow-lg border">
                <EnhancedShippingForm />
              </div>
              
              {/* Shipping Rates Section */}
              <div id="shipping-rates-section">
                <ShippingRates />
              </div>
            </div>

            {/* AI-Powered Side Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
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
    </div>
  );
};

export default CreateLabelPage;
