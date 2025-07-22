
import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RateFilterPanel from '@/components/shipping/RateFilterPanel';
import AIRateSidePanel from '@/components/shipping/AIRateSidePanel';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage = () => {
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier
  } = useShippingRates();
  
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [showAISidePanel, setShowAISidePanel] = useState(false);
  const [currentSort, setCurrentSort] = useState('cheapest');
  const [selectedCarriers, setSelectedCarriers] = useState<string[]>(['UPS', 'USPS', 'FedEx', 'DHL']);
  const [currentAIFilter, setCurrentAIFilter] = useState('recommended');
  const [shipmentDetails, setShipmentDetails] = useState<any>(null);

  const availableCarriers = ['UPS', 'USPS', 'FedEx', 'DHL'];

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    setSelectedRate(rate);
    handleSelectRate(rate);
    setShowAISidePanel(true);
  };

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
    // Apply sorting logic to rates
  };

  const handleCarrierFilter = (carriers: string[]) => {
    setSelectedCarriers(carriers);
    // Fix: Convert array to individual calls or modify hook to accept arrays
    carriers.forEach(carrier => handleFilterByCarrier(carrier));
  };

  const handleAIFilter = (filter: string) => {
    setCurrentAIFilter(filter);
    // Apply AI filtering logic
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className={`container mx-auto px-4 py-8 transition-all duration-300 ${
        showAISidePanel ? 'mr-96' : ''
      }`}>
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Create Shipping Label</h1>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
              Get competitive rates from multiple carriers with AI-powered optimization and create professional shipping labels.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Shipping Form */}
            <div className="bg-white rounded-xl shadow-lg border">
              <EnhancedShippingForm />
            </div>
            
            {/* Rate Filter Panel */}
            {rates && rates.length > 0 && (
              <RateFilterPanel
                onSortChange={handleSortChange}
                onCarrierFilter={handleCarrierFilter}
                onAIFilter={handleAIFilter}
                availableCarriers={availableCarriers}
                selectedCarriers={selectedCarriers}
                currentSort={currentSort}
                currentAIFilter={currentAIFilter}
              />
            )}
            
            {/* Shipping Rates Section */}
            <div id="shipping-rates-section">
              <ShippingRates 
                rates={rates || []}
                onRateSelected={handleRateSelected}
                loading={false}
                selectedRateId={selectedRate?.id}
                shipmentDetails={shipmentDetails}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Rate Side Panel */}
      <AIRateSidePanel
        isOpen={showAISidePanel}
        onClose={() => setShowAISidePanel(false)}
        rates={rates || []}
        selectedRate={selectedRate}
        onRateSelect={handleRateSelected}
        shipmentDetails={shipmentDetails}
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
