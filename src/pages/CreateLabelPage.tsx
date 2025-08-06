
import React, { useState, useEffect } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RateFilter from '@/components/shipping/RateFilter';
import AIRateAnalysisPanel from '@/components/shipping/AIRateAnalysisPanel';
import CustomShippingForm from '@/components/shipping/CustomShippingForm';
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
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [customFormData, setCustomFormData] = useState<any>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Auto-show AI panel when rates are available
  useEffect(() => {
    if (rates && rates.length > 0 && !showAIPanel) {
      setShowAIPanel(true);
      if (rates[0] && !selectedRate) {
        setSelectedRate(rates[0]);
      }
    }
  }, [rates, showAIPanel, selectedRate]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    setSelectedRate(rate);
    setShowAIPanel(true);
    handleSelectRate(rate.id);
    
    // Show custom form for additional data collection
    setShowCustomForm(true);
  };

  const handleCustomFormSubmit = (data: any) => {
    setCustomFormData(data);
    setShowCustomForm(false);
    console.log('Custom form data collected:', data);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    handleFilterByCarrier(filter);
  };

  const handleOptimizationChange = (filter: string) => {
    console.log('Optimization changed:', filter);
    
    let sortedRates = [...(rates || [])];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => {
          const priceA = parseFloat(a.rate) * 1.05; // Apply 5% markup
          const priceB = parseFloat(b.rate) * 1.05;
          return priceA - priceB;
        });
        break;
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'balanced':
      case 'most-efficient':
        sortedRates.sort((a, b) => {
          const scoreA = (parseFloat(a.rate) * 1.05 / 10) + (a.delivery_days || 999);
          const scoreB = (parseFloat(b.rate) * 1.05 / 10) + (b.delivery_days || 999);
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

  const handleOpenRateCalculator = () => {
    setIsRateCalculatorOpen(true);
  };

  const handleCloseSidebar = () => {
    console.log('Closing AI side panel');
    setShowAIPanel(false);
    // Reset any layout compression immediately
    document.body.style.marginRight = '0px';
    document.body.style.width = '100%';
  };

  const handleProceedToPayment = () => {
    console.log('Proceeding to payment');
    setShowAIPanel(false);
    // Reset layout to full screen
    document.body.style.marginRight = '0px';
    document.body.style.width = '100%';
  };

  // Sort rates with 5% markup consideration for display
  const sortedRates = rates ? [...rates].sort((a, b) => {
    if (a.carrier.toLowerCase().includes('usps') && !b.carrier.toLowerCase().includes('usps')) return -1;
    if (!a.carrier.toLowerCase().includes('usps') && b.carrier.toLowerCase().includes('usps')) return 1;
    if (a.isAIRecommended && !b.isAIRecommended) return -1;
    if (!a.isAIRecommended && b.isAIRecommended) return 1;
    
    // Sort by final price (with 5% markup)
    const finalPriceA = parseFloat(a.rate) * 1.05;
    const finalPriceB = parseFloat(b.rate) * 1.05;
    return finalPriceA - finalPriceB;
  }) : [];

  return (
    <div className="min-h-screen bg-background relative">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      {/* Main Content - Adjust width when sidebar is open */}
      <div className={`transition-all duration-300 ${showAIPanel ? 'pr-80' : 'pr-0'}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">Create Shipping Label</h1>
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                Get competitive rates from multiple carriers with transparent pricing and create professional shipping labels.
              </p>
            </div>

            {/* Main Form Section */}
            <div className="bg-white rounded-xl shadow-lg border mb-8">
              <EnhancedShippingForm />
            </div>

            {/* Custom Form Modal */}
            {showCustomForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="max-w-md w-full mx-4">
                  <CustomShippingForm
                    onSubmit={handleCustomFormSubmit}
                    required={['phone']}
                    optional={['email']}
                  />
                </div>
              </div>
            )}

            {/* Rate Filter */}
            <div className="mb-6 flex gap-4">
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
      </div>

      {/* AI Analysis Panel with proper close handling */}
      {showAIPanel && selectedRate && (
        <AIRateAnalysisPanel
          selectedRate={selectedRate}
          allRates={sortedRates || []}
          isOpen={showAIPanel}
          onClose={handleCloseSidebar}
          onOptimizationChange={handleOptimizationChange}
          onProceedToPayment={handleProceedToPayment}
          customFormData={customFormData}
        />
      )}

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
