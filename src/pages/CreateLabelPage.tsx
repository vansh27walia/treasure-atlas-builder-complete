
import React, { useState } from 'react';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateDisplayWithLogos from '@/components/shipping/RateDisplayWithLogos';
import AISuggestionPanel from '@/components/shipping/AISuggestionPanel';
import CarrierFilterBar from '@/components/shipping/CarrierFilterBar';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import { useShippingRates } from '@/hooks/useShippingRates';
import { toast } from '@/components/ui/sonner';

const CreateLabelPage = () => {
  const {
    rates,
    selectedRateId,
    handleSelectRate,
    handleFilterByCarrier,
    activeCarrierFilter,
    uniqueCarriers
  } = useShippingRates();

  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [showAISuggestionPanel, setShowAISuggestionPanel] = useState(false);
  const [selectedRateForAI, setSelectedRateForAI] = useState(null);

  const handleRateSelect = (rateId: string) => {
    handleSelectRate(rateId);
    const selectedRate = rates.find(rate => rate.id === rateId);
    if (selectedRate) {
      setSelectedRateForAI(selectedRate);
      setShowAISuggestionPanel(true);
    }
  };

  const handleAISuggestionOpen = (rate: any) => {
    setSelectedRateForAI(rate);
    setShowAISuggestionPanel(true);
  };

  const handleCarrierFilterChange = (carrier: string) => {
    handleFilterByCarrier(carrier);
    toast.success(`Filtered by ${carrier === 'all' ? 'All Carriers' : carrier.toUpperCase()}`);
  };

  const handleQuickSelect = (type: 'cheapest' | 'fastest' | 'balanced') => {
    if (rates.length === 0) {
      toast.error('No rates available for quick selection');
      return;
    }

    let targetRate = null;
    
    switch (type) {
      case 'cheapest':
        targetRate = rates.reduce((prev, curr) => 
          parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
        );
        break;
      case 'fastest':
        targetRate = rates.reduce((prev, curr) => 
          (prev.delivery_days || 999) < (curr.delivery_days || 999) ? prev : curr
        );
        break;
      case 'balanced':
        const scoredRates = rates.map(rate => {
          const costScore = parseFloat(rate.rate) / Math.max(...rates.map(r => parseFloat(r.rate)));
          const speedScore = (rate.delivery_days || 7) / Math.max(...rates.map(r => r.delivery_days || 7));
          return {
            ...rate,
            balanceScore: costScore * 0.6 + speedScore * 0.4
          };
        });
        targetRate = scoredRates.reduce((prev, curr) => 
          prev.balanceScore < curr.balanceScore ? prev : curr
        );
        break;
    }

    if (targetRate) {
      handleRateSelect(targetRate.id);
      toast.success(`Selected ${type} option: ${targetRate.carrier} ${targetRate.service}`);
    }
  };

  const handleAIQuickAsk = (type: 'cheapest' | 'fastest' | 'balanced') => {
    handleQuickSelect(type);
  };

  const isBestValue = (rateId: string) => {
    if (rates.length === 0) return false;
    const cheapestRate = rates.reduce((prev, curr) => 
      parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
    );
    return cheapestRate.id === rateId;
  };

  const isFastest = (rateId: string) => {
    if (rates.length === 0) return false;
    const fastestRate = rates.reduce((prev, curr) => 
      (prev.delivery_days || 999) < (curr.delivery_days || 999) ? prev : curr
    );
    return fastestRate.id === rateId;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Create Shipping Label</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Get competitive rates from multiple carriers with AI-powered recommendations and create professional shipping labels.
            </p>
          </div>

          {/* Dynamic Layout Based on AI Panel State */}
          <div className={`transition-all duration-300 ${showAISuggestionPanel ? 'mr-96' : ''}`}>
            {/* Main Content Area */}
            <div className="space-y-8">
              {/* Main Form Section */}
              <div className="bg-white rounded-xl shadow-lg border">
                <EnhancedShippingForm />
              </div>
              
              {/* Rate Filter Bar - Shows before rates are fetched */}
              {rates.length > 0 && (
                <CarrierFilterBar
                  carrierFilter={activeCarrierFilter}
                  onCarrierFilterChange={handleCarrierFilterChange}
                  onQuickSelect={handleQuickSelect}
                  availableCarriers={uniqueCarriers.map(c => c.toLowerCase())}
                  rateCount={rates.length}
                />
              )}
              
              {/* Shipping Rates Section */}
              <div id="shipping-rates-section">
                {rates.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-foreground">
                        Available Shipping Rates
                      </h2>
                      <div className="text-sm text-muted-foreground">
                        {rates.length} rates found
                      </div>
                    </div>
                    
                    <RateDisplayWithLogos
                      rates={rates}
                      selectedRateId={selectedRateId}
                      onRateSelect={handleRateSelect}
                      onAISuggestionOpen={handleAISuggestionOpen}
                      carrierFilter={activeCarrierFilter}
                      isBestValue={isBestValue}
                      isFastest={isFastest}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-lg">Fill out the form above to get shipping rates</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestion Panel */}
      <AISuggestionPanel
        isOpen={showAISuggestionPanel}
        onClose={() => setShowAISuggestionPanel(false)}
        selectedRate={selectedRateForAI}
        allRates={rates}
        onRateSelect={handleRateSelect}
        onQuickAsk={handleAIQuickAsk}
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
