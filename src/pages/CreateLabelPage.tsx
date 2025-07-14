
import React from 'react';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import ShippingRates from '@/components/ShippingRates';
import ShippingWorkflowTracker from '@/components/shipping/ShippingWorkflowTracker';
import ChatAssistant from '@/components/shipping/ChatAssistant';

const CreateLabelPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Fixed Workflow Tracker */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <ShippingWorkflowTracker currentStep="package" />
      </div>
      
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
          <EnhancedShippingForm />

          {/* Shipping Rates Section */}
          <div id="shipping-rates-section" className="mt-8">
            <ShippingRates />
          </div>
        </div>
      </div>
      
      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
};

export default CreateLabelPage;
