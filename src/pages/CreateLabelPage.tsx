
import React, { useState } from 'react';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import EnhancedRateDisplay from '@/components/shipping/EnhancedRateDisplay';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const { rates } = useShippingRates();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Create Shipping Label</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Get competitive rates from multiple carriers with AI-powered recommendations and create professional shipping labels.
            </p>
          </div>

          {/* Main Form Section */}
          <div className="bg-white rounded-xl shadow-lg border">
            <EnhancedShippingForm />
          </div>
          
          {/* Enhanced Rate Display Section */}
          {rates.length > 0 && (
            <div id="shipping-rates-section" className="bg-white rounded-xl shadow-lg border p-6">
              <EnhancedRateDisplay />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLabelPage;
