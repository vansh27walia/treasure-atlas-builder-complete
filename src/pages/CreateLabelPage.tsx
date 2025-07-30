
import React, { useState, useEffect } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RateFilter from '@/components/shipping/RateFilter';
import AIOverviewManager from '@/components/shipping/AIOverviewManager';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const CreateLabelPage = () => {
  const { user } = useAuth();
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier,
    uniqueCarriers,
    activeCarrierFilter
  } = useShippingRates();
  
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [aiTriggers, setAITriggers] = useState({
    ratesFetched: false,
    rateSelected: false,
    paymentEntered: false
  });

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Handle rates being fetched
  useEffect(() => {
    if (rates && rates.length > 0) {
      setAITriggers(prev => ({ ...prev, ratesFetched: true }));
      if (!selectedRate) {
        setSelectedRate(rates[0]);
      }
    }
  }, [rates, selectedRate]);

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    setSelectedRate(rate);
    setAITriggers(prev => ({ ...prev, rateSelected: true }));
    handleSelectRate(rate.id);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    handleFilterByCarrier(filter);
  };

  const handlePaymentEntry = () => {
    setAITriggers(prev => ({ ...prev, paymentEntered: true }));
  };

  const handleOptimizationChange = (filter: string) => {
    console.log('Optimization changed:', filter);
    
    let sortedRates = [...(rates || [])];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'balanced':
      case 'most-efficient':
        sortedRates.sort((a, b) => {
          const scoreA = (parseFloat(a.rate) / 10) + (a.delivery_days || 999);
          const scoreB = (parseFloat(b.rate) / 10) + (b.delivery_days || 999);
          return scoreA - scoreB;
        });
        break;
      case 'most-reliable':
        sortedRates.sort((a, b) => {
          const reliabilityOrder = { 'USPS': 1, 'UPS': 2, 'FedEx': 3, 'DHL': 4 };
          const scoreA = reliabilityOrder[a.carrier.toUpperCase()] || 999;
          const scoreB = reliabilityOrder[b.carrier.toUpperCase()] || 999;
          return scoreA - scoreB;
        });
        break;
      default:
        break;
    }
    
    if (sortedRates.length > 0) {
      setSelectedRate(sortedRates[0]);
      handleSelectRate(sortedRates[0].id);
      
      document.dispatchEvent(new CustomEvent('rates-reordered', { 
        detail: { rates: sortedRates } 
      }));
    }
  };

  // Sort rates to ensure USPS is first, then by price
  const sortedRates = rates ? [...rates].sort((a, b) => {
    if (a.carrier.toLowerCase().includes('usps') && !b.carrier.toLowerCase().includes('usps')) return -1;
    if (!a.carrier.toLowerCase().includes('usps') && b.carrier.toLowerCase().includes('usps')) return 1;
    if (a.isAIRecommended && !b.isAIRecommended) return -1;
    if (!a.isAIRecommended && b.isAIRecommended) return 1;
    return parseFloat(a.rate) - parseFloat(b.rate);
  }) : [];

  return (
    <div className="min-h-screen bg-background relative">
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
              Get competitive rates from multiple carriers with AI-powered assistance.
            </p>
          </div>

          {/* Main Form Section */}
          <div className="bg-white rounded-xl shadow-lg border mb-8">
            <EnhancedShippingForm onPaymentEntry={handlePaymentEntry} />
          </div>

          {/* Rate Filter - Simplified without preferred carriers */}
          <div className="mb-6">
            <RateFilter 
              activeFilter={activeFilter} 
              onFilterChange={handleFilterChange} 
            />
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

      {/* AI Overview Manager */}
      <AIOverviewManager
        isVisible={true}
        context="normal"
        selectedRate={selectedRate}
        allRates={sortedRates || []}
        onClose={() => {}}
        onManualDismiss={() => setAITriggers(prev => ({ 
          ...prev, 
          ratesFetched: false, 
          rateSelected: false 
        }))}
        triggers={aiTriggers}
      />

      {/* Rate Calculator Modal */}
      <RateCalculatorModal 
        isOpen={isRateCalculatorOpen} 
        onClose={() => setIsRateCalculatorOpen(false)} 
      />

      {/* ShipAI Chatbot */}
      <ShipAIChatbot onClose={() => {}} />
    </div>
  );
};

export default CreateLabelPage;
