import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RatePreferenceSelector from '@/components/shipping/RatePreferenceSelector';
import ImprovedAIRatePanel from '@/components/shipping/ImprovedAIRatePanel';
import RateFilterDropdown from '@/components/shipping/RateFilterDropdown';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier,
    uniqueCarriers,
    activeCarrierFilter
  } = useShippingRates();

  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [filteredRates, setFilteredRates] = useState<any[]>([]);
  const [selectedSort, setSelectedSort] = useState<string>('default');

  // Initialize filtered rates when rates change
  React.useEffect(() => {
    setFilteredRates(rates || []);
  }, [rates]);

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    setSelectedRate(rate);
    handleSelectRate(rate);
    setShowAIPanel(true);
  };

  const handlePreferenceSelect = (preference: string) => {
    setSelectedPreference(preference);
    console.log('AI preference selected:', preference);
  };

  const handleCloseAIPanel = () => {
    setShowAIPanel(false);
  };

  const handleCarrierFilter = (carrier: string) => {
    handleFilterByCarrier(carrier);
    let filtered = rates || [];
    
    if (carrier !== 'all') {
      filtered = filtered.filter(rate => 
        rate.carrier.toLowerCase() === carrier.toLowerCase()
      );
    }
    
    setFilteredRates(filtered);
  };

  const handleSortFilter = (sort: string) => {
    setSelectedSort(sort);
    let sorted = [...(filteredRates || [])];
    
    switch (sort) {
      case 'cheapest':
        sorted.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'fastest':
        sorted.sort((a, b) => a.delivery_days - b.delivery_days);
        break;
      case 'balanced':
        sorted.sort((a, b) => {
          const scoreA = parseFloat(a.rate) * 0.7 + a.delivery_days * 0.3;
          const scoreB = parseFloat(b.rate) * 0.7 + b.delivery_days * 0.3;
          return scoreA - scoreB;
        });
        break;
      default:
        // Keep original order
        break;
    }
    
    setFilteredRates(sorted);
  };

  const handleOptimizationChange = (filter: string) => {
    handleSortFilter(filter);
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

          {/* Main Layout with AI Panel Consideration */}
          <div className={`transition-all duration-300 ${showAIPanel ? 'mr-96' : ''}`}>
            {/* Main Form Section */}
            <div className="bg-white rounded-xl shadow-lg border mb-8">
              <EnhancedShippingForm />
            </div>

            {/* Rate Filter Section */}
            {(rates && rates.length > 0) && (
              <RateFilterDropdown
                onCarrierFilter={handleCarrierFilter}
                onSortFilter={handleSortFilter}
                availableCarriers={uniqueCarriers}
                selectedCarrier={activeCarrierFilter}
                selectedSort={selectedSort}
                rateCount={filteredRates.length}
              />
            )}
            
            {/* Shipping Rates Section */}
            <div id="shipping-rates-section">
              <ShippingRates 
                rates={filteredRates || []} 
                onRateSelected={handleRateSelected} 
                loading={false}
                selectedRateId={selectedRate?.id}
                showEnhancedUI={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Rate Analysis Panel */}
      <ImprovedAIRatePanel
        isOpen={showAIPanel}
        onClose={handleCloseAIPanel}
        selectedRate={selectedRate}
        allRates={rates || []}
        onRateSelect={handleSelectRate}
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
