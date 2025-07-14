import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import AIPoweredSidePanel from '@/components/shipping/AIPoweredSidePanel';

const CreateLabelPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Progress Tracker */}
      <EnhancedWorkflowTracker currentStep="package" />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">Create Shipping Label</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get competitive rates from multiple carriers and create professional shipping labels.
            </p>
          </div>

          {/* Main Layout: Form on Left, AI Panel on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Form - Left Side (3/4 width) */}
            <div className="lg:col-span-3">
              <EnhancedShippingForm />
              
              {/* Shipping Rates Section */}
              <div id="shipping-rates-section" className="mt-8">
                <ShippingRates />
              </div>
            </div>

            {/* AI-Powered Side Panel - Right Side (1/4 width) */}
            <div className="lg:col-span-1 space-y-6">
              <AIPoweredSidePanel 
                rates={[]}
                onRatesReorder={() => {}}
                onCarrierFilter={() => {}}
                onRateSelect={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelPage;
