
import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import AIPoweredSidePanel from '@/components/shipping/AIPoweredSidePanel';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RatePreferenceSelector from '@/components/shipping/RatePreferenceSelector';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier
  } = useShippingRates();
  
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<string>('');

  const handleRatesReorder = (reorderedRates: any[]) => {
    console.log('Reordering rates:', reorderedRates);
  };

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    handleSelectRate(rate);
    // Show AI panel when rate is selected
    setShowAIPanel(true);
  };

  const handlePreferenceSelect = (preference: string) => {
    setSelectedPreference(preference);
    console.log('AI preference selected:', preference);
    // Apply preference logic here
  };

  const handleCloseAIPanel = () => {
    setShowAIPanel(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-50 bg-transparent">
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

          {/* AI Rate Preference Selector - Top Level */}
          <div className="mb-6">
            <RatePreferenceSelector onPreferenceSelect={handlePreferenceSelect} />
          </div>

          {/* Dynamic Layout Based on AI Panel State */}
          <div className={`transition-all duration-300 ${showAIPanel ? 'grid grid-cols-1 lg:grid-cols-4 gap-8' : 'grid grid-cols-1'}`}>
            {/* Main Content Area */}
            <div className={`${showAIPanel ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-8`}>
              {/* Main Form Section */}
              <div className="bg-white rounded-xl shadow-lg border">
                <EnhancedShippingForm />
              </div>
              
              {/* Shipping Rates Section */}
              <div id="shipping-rates-section">
                <ShippingRates 
                  rates={rates || []}
                  onRateSelected={handleRateSelected}
                  loading={false}
                />
              </div>
            </div>

            {/* AI-Powered Side Panel - Conditionally Rendered */}
            {showAIPanel && (
              <div className="lg:col-span-1">
                <div className="sticky top-32">
                  <div className="bg-white rounded-xl shadow-lg border p-4 relative">
                    {/* Close Button */}
                    <button
                      onClick={handleCloseAIPanel}
                      className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <AIPoweredSidePanel 
                      rates={rates} 
                      onRatesReorder={handleRatesReorder} 
                      onCarrierFilter={handleFilterByCarrier} 
                      onRateSelect={handleSelectRate}
                      onOpenRateCalculator={() => setIsRateCalculatorOpen(true)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate Calculator Modal */}
      <RateCalculatorModal
        isOpen={isRateCalculatorOpen}
        onClose={() => setIsRateCalculatorOpen(false)}
      />

      {/* ShipAI Chatbot */}
      <ShipAIChatbot />
    </div>
  );
};

export default CreateLabelPage;
