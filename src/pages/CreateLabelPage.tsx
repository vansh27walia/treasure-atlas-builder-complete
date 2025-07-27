import React, { useState, useEffect } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RateFilter from '@/components/shipping/RateFilter';
import AIPoweredSidePanel from '@/components/shipping/AIPoweredSidePanel';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
const CreateLabelPage = () => {
  const {
    user
  } = useAuth();
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier
  } = useShippingRates();
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    handleSelectRate(rate);
    setSelectedRateId(rate);

    // Show AI panel when first rate is selected
    if (rates && rates.length > 0 && !showAIPanel) {
      setShowAIPanel(true);
    }
  };
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    handleFilterByCarrier(filter);
  };
  const handleRatesReorder = (reorderedRates: any[]) => {
    // Handle rates reordering from AI panel
    console.log('Rates reordered:', reorderedRates);
  };
  const handleCarrierFilter = (carrier: string) => {
    handleFilterByCarrier(carrier);
  };
  const handleOpenRateCalculator = () => {
    setIsRateCalculatorOpen(true);
  };

  // Sort rates to ensure USPS is first, then by price
  const sortedRates = rates ? [...rates].sort((a, b) => {
    // Put USPS first
    if (a.carrier.toLowerCase().includes('usps') && !b.carrier.toLowerCase().includes('usps')) return -1;
    if (!a.carrier.toLowerCase().includes('usps') && b.carrier.toLowerCase().includes('usps')) return 1;

    // Put AI recommended first within same carrier
    if (a.isAIRecommended && !b.isAIRecommended) return -1;
    if (!a.isAIRecommended && b.isAIRecommended) return 1;

    // Then sort by price (cheapest to most expensive)
    return parseFloat(a.rate) - parseFloat(b.rate);
  }) : [];
  return <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="flex">
        {/* Main Content */}
        <div className={`transition-all duration-300 ${showAIPanel ? 'w-2/3' : 'w-full'}`}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
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

              {/* Rate Filter - Now as dropdown */}
              <div className="mb-6">
                <RateFilter activeFilter={activeFilter} onFilterChange={handleFilterChange} />
              </div>
              
              {/* Shipping Rates Section */}
              <div id="shipping-rates-section">
                <ShippingRates rates={sortedRates || []} onRateSelected={handleRateSelected} loading={false} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Sidebar Panel */}
        {showAIPanel}
      </div>

      {/* Rate Calculator Modal */}
      <RateCalculatorModal isOpen={isRateCalculatorOpen} onClose={() => setIsRateCalculatorOpen(false)} />

      {/* ShipAI Chatbot */}
      <ShipAIChatbot onClose={() => {}} />
    </div>;
};
export default CreateLabelPage;