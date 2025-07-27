import React, { useState } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import RateFilter from '@/components/shipping/RateFilter';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

const CreateLabelPage = () => {
  const { user } = useAuth();
  const {
    rates,
    handleSelectRate,
    handleFilterByCarrier
  } = useShippingRates();
  
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    handleSelectRate(rate);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    
    // Apply different sorting based on filter
    if (rates && rates.length > 0) {
      let sortedRates = [...rates];
      
      switch (filter) {
        case 'fastest':
          sortedRates.sort((a, b) => a.delivery_days - b.delivery_days);
          break;
        case 'cheapest':
          sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
          break;
        case 'ups':
          sortedRates = rates.filter(rate => rate.carrier.toLowerCase() === 'ups');
          break;
        case 'usps':
          sortedRates = rates.filter(rate => rate.carrier.toLowerCase() === 'usps');
          break;
        case 'fedex':
          sortedRates = rates.filter(rate => rate.carrier.toLowerCase() === 'fedex');
          break;
        case 'recommended':
          sortedRates = rates.filter(rate => rate.isAIRecommended);
          break;
        default:
          // Keep original order with USPS fastest first
          sortedRates = rates.sort((a, b) => {
            // USPS fastest should be on top
            if (a.carrier.toLowerCase() === 'usps' && a.delivery_days <= 2) return -1;
            if (b.carrier.toLowerCase() === 'usps' && b.delivery_days <= 2) return 1;
            
            // Then AI recommended
            if (a.isAIRecommended && !b.isAIRecommended) return -1;
            if (!a.isAIRecommended && b.isAIRecommended) return 1;
            
            // Then by price
            return parseFloat(a.rate) - parseFloat(b.rate);
          });
      }
      
      handleFilterByCarrier(filter);
      toast.success(`Applied ${filter} filter`);
    }
  };

  // Sort rates with USPS fastest first, then AI recommended, then by price
  const sortedRates = rates ? [...rates].sort((a, b) => {
    // USPS fastest should be on top
    if (a.carrier.toLowerCase() === 'usps' && a.delivery_days <= 2) return -1;
    if (b.carrier.toLowerCase() === 'usps' && b.delivery_days <= 2) return 1;
    
    // Then AI recommended
    if (a.isAIRecommended && !b.isAIRecommended) return -1;
    if (!a.isAIRecommended && b.isAIRecommended) return 1;
    
    // Then by price
    return parseFloat(a.rate) - parseFloat(b.rate);
  }) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
        
        {/* Rate Filter and Shipping Rates Section */}
        {rates && rates.length > 0 && (
          <div id="shipping-rates-section" className="space-y-4">
            <RateFilter 
              onFilterChange={handleFilterChange}
              selectedFilter={selectedFilter}
            />
            <ShippingRates 
              rates={sortedRates}
              onRateSelected={handleRateSelected}
              loading={false}
            />
          </div>
        )}
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
