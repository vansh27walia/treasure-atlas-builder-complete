
import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import AIRateAnalysisPanel from '@/components/shipping/AIRateAnalysisPanel';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const CreateLabelPage = () => {
  const { user } = useAuth();
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier
  } = useShippingRates();
  
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    setSelectedRate(rate);
    handleSelectRate(rate);
    setShowAIPanel(true);
  };

  const handleCloseAIPanel = () => {
    setShowAIPanel(false);
    setSelectedRate(null);
  };

  const handleOptimizationChange = (filter: string) => {
    console.log('Optimization filter applied:', filter);
    // Apply the optimization filter to rates
    handleFilterByCarrier(filter);
  };

  // Sort rates with AI recommended first, then by price
  const sortedRates = rates ? [...rates].sort((a, b) => {
    // Put AI recommended first
    if (a.isAIRecommended && !b.isAIRecommended) return -1;
    if (!a.isAIRecommended && b.isAIRecommended) return 1;
    
    // Then sort by price (cheapest to most expensive)
    return parseFloat(a.rate) - parseFloat(b.rate);
  }) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className={`max-w-7xl mx-auto transition-all duration-300 ${showAIPanel ? 'mr-96' : ''}`}>
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Create Shipping Label</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Get competitive rates from multiple carriers and create professional shipping labels with AI-powered assistance.
            </p>
          </div>

          {/* Main Form Section */}
          <div className="bg-white rounded-xl shadow-lg border mb-8">
            <EnhancedShippingForm />
          </div>
          
          {/* Shipping Rates Section */}
          <div id="shipping-rates-section">
            <ShippingRates 
              rates={sortedRates || []}
              onRateSelected={handleRateSelected}
              loading={false}
            />
          </div>
        </div>
      </div>

      {/* AI Rate Analysis Panel - Only one instance */}
      <AIRateAnalysisPanel
        selectedRate={selectedRate}
        allRates={rates || []}
        isOpen={showAIPanel}
        onClose={handleCloseAIPanel}
        onOptimizationChange={handleOptimizationChange}
      />

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
