import React, { useState, useEffect } from 'react';
import ShippingRates from '@/components/ShippingRates';
import EnhancedWorkflowTracker from '@/components/shipping/EnhancedWorkflowTracker';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import RateCalculatorModal from '@/components/shipping/RateCalculatorModal';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import EnhancedRateFilterWithAI from '@/components/shipping/EnhancedRateFilterWithAI';
import AIRateAnalysisPanel from '@/components/shipping/AIRateAnalysisPanel';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import { toast } from 'sonner';
const CreateLabelPage = () => {
  // Move ALL hooks to the top before any conditional logic
  const {
    user
  } = useAuth();
  const {
    rates,
    handleSelectRate,
    uniqueCarriers,
    filters: shippingFilters,
    handleFiltersChange: handleShippingFiltersChange,
    handleClearFilters: handleShippingClearFilters
  } = useShippingRates();
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const [aiPanelClosedManually, setAiPanelClosedManually] = useState(false);

  // Auto-show AI panel when rates are available (but only if not manually closed)
  useEffect(() => {
    if (rates && rates.length > 0 && !showAIPanel && !isPaymentInProgress && !aiPanelClosedManually) {
      setShowAIPanel(true);
      if (rates[0] && !selectedRate) {
        setSelectedRate(rates[0]);
      }
    }
  }, [rates, showAIPanel, selectedRate, isPaymentInProgress, aiPanelClosedManually]);

  // Close all modals when user signs out to prevent portal errors
  useEffect(() => {
    if (!user) {
      setIsRateCalculatorOpen(false);
      setShowAIPanel(false);
    }
  }, [user]);

  // Listen for payment events to close AI panel
  useEffect(() => {
    const handlePaymentStart = () => {
      setIsPaymentInProgress(true);
      setShowAIPanel(false);
    };
    const handlePaymentEnd = () => {
      setIsPaymentInProgress(false);
    };

    // Listen for force show AI panel event (when rate is clicked)
    const handleForceShowAIPanel = (event: CustomEvent) => {
      console.log('Force show AI panel event received:', event.detail);
      if (event.detail?.selectedRate) {
        setSelectedRate(event.detail.selectedRate);
        setShowAIPanel(true);
        setAiPanelClosedManually(false); // Reset manual close flag
      }
    };

    // Listen for dimensions transfer from rate calculator
    const handleDimensionsTransfer = (event: CustomEvent) => {
      console.log('Dimensions transfer event received:', event.detail);
      const {
        dimensions,
        weightUnit,
        packageType
      } = event.detail;

      // Dispatch event to pre-fill only the dimensions in the shipping form
      document.dispatchEvent(new CustomEvent('prefill-dimensions-only', {
        detail: {
          dimensions,
          weightUnit,
          packageType
        }
      }));
      toast.success('Package dimensions pre-filled from rate calculator');
    };

    // Listen for payment-related events
    document.addEventListener('payment-start', handlePaymentStart);
    document.addEventListener('payment-complete', handlePaymentEnd);
    document.addEventListener('payment-cancelled', handlePaymentEnd);
    document.addEventListener('force-show-ai-panel', handleForceShowAIPanel as EventListener);
    document.addEventListener('transfer-dimensions-to-shipping', handleDimensionsTransfer as EventListener);
    return () => {
      document.removeEventListener('payment-start', handlePaymentStart);
      document.removeEventListener('payment-complete', handlePaymentEnd);
      document.removeEventListener('payment-cancelled', handlePaymentEnd);
      document.removeEventListener('force-show-ai-panel', handleForceShowAIPanel as EventListener);
      document.removeEventListener('transfer-dimensions-to-shipping', handleDimensionsTransfer as EventListener);
    };
  }, []);

  // NOW we can do the conditional redirect after all hooks are called
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  const handleRateSelected = (rate: any) => {
    console.log('Rate selected in CreateLabelPage:', rate);
    setSelectedRate(rate);
    if (!isPaymentInProgress && !aiPanelClosedManually) {
      setShowAIPanel(true);
    }
    handleSelectRate(rate.id);
  };
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // Use the new filters system instead
    if (filter !== 'all') {
      handleShippingFiltersChange({
        ...shippingFilters,
        carriers: [filter]
      });
    } else {
      handleShippingFiltersChange({
        ...shippingFilters,
        carriers: []
      });
    }
  };
  const handleOptimizationChange = (filter: string) => {
    console.log('Optimization changed:', filter);

    // Apply optimization logic here
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
        // Balance between price and speed
        sortedRates.sort((a, b) => {
          const scoreA = parseFloat(a.rate) / 10 + (a.delivery_days || 999);
          const scoreB = parseFloat(b.rate) / 10 + (b.delivery_days || 999);
          return scoreA - scoreB;
        });
        break;
      case 'most-reliable':
        // Sort by carrier reliability (USPS first, then UPS, FedEx, DHL)
        sortedRates.sort((a, b) => {
          const reliabilityOrder = {
            'USPS': 1,
            'UPS': 2,
            'FedEx': 3,
            'DHL': 4
          };
          const scoreA = reliabilityOrder[a.carrier.toUpperCase()] || 999;
          const scoreB = reliabilityOrder[b.carrier.toUpperCase()] || 999;
          return scoreA - scoreB;
        });
        break;
      default:
        // Keep current order
        break;
    }

    // Update the rates order and select the first one
    if (sortedRates.length > 0) {
      setSelectedRate(sortedRates[0]);
      handleSelectRate(sortedRates[0].id);

      // Trigger a re-render of the ShippingRates component with new order
      document.dispatchEvent(new CustomEvent('rates-reordered', {
        detail: {
          rates: sortedRates
        }
      }));
    }
  };
  const handleOpenRateCalculator = () => {
    setIsRateCalculatorOpen(true);
  };
  const handleCloseSidebar = () => {
    console.log('Closing AI sidebar manually');
    setShowAIPanel(false);
    setAiPanelClosedManually(true); // Mark as manually closed
  };
  const handleAIPoweredAnalysis = () => {
    console.log('AI Powered Analysis button clicked');
    if (rates && rates.length > 0) {
      setSelectedRate(rates[0]);
      setShowAIPanel(true);
      setAiPanelClosedManually(false);
    }
  };

  // Enhanced rate processing with proper carrier name standardization
  const processRatesForDisplay = (ratesList: any[]) => {
    return ratesList.map(rate => ({
      ...rate,
      // Standardize carrier names for display
      displayCarrier: getStandardizedCarrierName(rate.carrier),
      // Ensure we have the list rate for proper discount display
      list_rate: rate.list_rate || rate.retail_rate
    }));
  };
  const getStandardizedCarrierName = (carrierName: string) => {
    const name = carrierName.toUpperCase();
    if (name.includes('USPS')) return 'USPS';
    if (name.includes('UPS')) return 'UPS';
    if (name.includes('FEDEX')) return 'FedEx';
    if (name.includes('DHL')) return 'DHL';
    if (name.includes('CANADA POST') || name.includes('CANADAPOST')) return 'Canada Post';
    return carrierName;
  };

  // Sort rates to ensure USPS is first, then by price
  const sortedRates = rates ? processRatesForDisplay([...rates]).sort((a, b) => {
    if (a.displayCarrier === 'USPS' && b.displayCarrier !== 'USPS') return -1;
    if (a.displayCarrier !== 'USPS' && b.displayCarrier === 'USPS') return 1;
    if (a.isAIRecommended && !b.isAIRecommended) return -1;
    if (!a.isAIRecommended && b.isAIRecommended) return 1;
    return parseFloat(a.rate) - parseFloat(b.rate);
  }) : [];

  // Local filter state for RateFilter component
  const [localFilters, setLocalFilters] = useState({
    search: '',
    carriers: [],
    maxPrice: 100,
    minPrice: 0,
    maxDays: 7,
    features: [],
    sortBy: 'price' as 'price' | 'speed' | 'carrier' | 'reliability',
    sortOrder: 'asc' as 'asc' | 'desc',
    selectedCarrier: 'all'
  });
  const handleLocalFiltersChange = (newFilters: any) => {
    setLocalFilters(newFilters);
    // Apply filters to the rates
    applyFiltersToRates(newFilters);
  };
  const handleLocalClearFilters = () => {
    const clearedFilters = {
      search: '',
      carriers: [],
      maxPrice: 100,
      minPrice: 0,
      maxDays: 7,
      features: [],
      sortBy: 'price' as 'price' | 'speed' | 'carrier' | 'reliability',
      sortOrder: 'asc' as 'asc' | 'desc',
      selectedCarrier: 'all'
    };
    setLocalFilters(clearedFilters);
    applyFiltersToRates(clearedFilters);
  };

  // Apply filters to rates
  const applyFiltersToRates = (filterSettings: any) => {
    if (!rates || rates.length === 0) return;
    let filteredRates = [...rates];

    // Search filter
    if (filterSettings.search) {
      filteredRates = filteredRates.filter(rate => rate.carrier.toLowerCase().includes(filterSettings.search.toLowerCase()) || rate.service.toLowerCase().includes(filterSettings.search.toLowerCase()));
    }

    // Carrier filter
    if (filterSettings.selectedCarrier && filterSettings.selectedCarrier !== 'all') {
      filteredRates = filteredRates.filter(rate => rate.carrier.toLowerCase() === filterSettings.selectedCarrier.toLowerCase());
    }

    // Price range filter
    if (filterSettings.minPrice > 0 || filterSettings.maxPrice && filterSettings.maxPrice < 100) {
      filteredRates = filteredRates.filter(rate => {
        const price = parseFloat(rate.rate);
        return price >= (filterSettings.minPrice || 0) && price <= (filterSettings.maxPrice || 100);
      });
    }

    // Max days filter
    if (filterSettings.maxDays && filterSettings.maxDays < 7) {
      filteredRates = filteredRates.filter(rate => (rate.delivery_days || 999) <= filterSettings.maxDays);
    }

    // Features filter
    if (filterSettings.features && filterSettings.features.length > 0) {
      filteredRates = filteredRates.filter(rate => {
        // Simple feature matching - can be enhanced
        return filterSettings.features.every((feature: string) => {
          if (feature === 'Express') return (rate.delivery_days || 999) <= 2;
          if (feature === 'Tracking') return true; // All have tracking
          return true;
        });
      });
    }

    // Sort the filtered rates
    filteredRates.sort((a, b) => {
      let comparison = 0;
      switch (filterSettings.sortBy) {
        case 'price':
          comparison = parseFloat(a.rate) - parseFloat(b.rate);
          break;
        case 'speed':
          comparison = (a.delivery_days || 999) - (b.delivery_days || 999);
          break;
        case 'carrier':
          comparison = a.carrier.localeCompare(b.carrier);
          break;
        case 'reliability':
          const reliabilityOrder: {
            [key: string]: number;
          } = {
            'USPS': 1,
            'UPS': 2,
            'FedEx': 3,
            'DHL': 4
          };
          const scoreA = reliabilityOrder[a.carrier.toUpperCase()] || 999;
          const scoreB = reliabilityOrder[b.carrier.toUpperCase()] || 999;
          comparison = scoreA - scoreB;
          break;
        default:
          comparison = 0;
      }
      return filterSettings.sortOrder === 'asc' ? comparison : -comparison;
    });

    // Dispatch the filtered and sorted rates
    document.dispatchEvent(new CustomEvent('rates-reordered', {
      detail: {
        rates: filteredRates
      }
    }));
    if (filteredRates.length > 0) {
      setSelectedRate(filteredRates[0]);
      handleSelectRate(filteredRates[0].id);
    }
  };
  return <div className="min-h-screen bg-background relative">
      {/* Sticky Workflow Tracker */}
      <div className="sticky top-0 z-40 bg-transparent">
        <EnhancedWorkflowTracker currentStep="package" className="rounded-xl px-[10px]" />
      </div>
      
      {/* Main Content - Adjust width when sidebar is open and not in payment */}
      <div className={`transition-all duration-300 ${showAIPanel && !isPaymentInProgress ? 'pr-80' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-[20px]">
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

            {/* Enhanced Rate Filter with AI */}
            <div className="mb-6">
              <EnhancedRateFilterWithAI filters={localFilters} availableCarriers={uniqueCarriers} onFiltersChange={handleLocalFiltersChange} onClearFilters={handleLocalClearFilters} onAIPoweredAnalysis={handleAIPoweredAnalysis} rateCount={sortedRates.length} aiEnabled={rates && rates.length > 0} />
            </div>
            
            {/* Shipping Rates Section */}
            <div id="shipping-rates-section">
              <ShippingRates rates={sortedRates || []} onRateSelected={handleRateSelected} loading={false} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Panel - Only show when not in payment flow and not manually closed */}
      {showAIPanel && selectedRate && !isPaymentInProgress && <AIRateAnalysisPanel selectedRate={selectedRate} allRates={sortedRates || []} isOpen={showAIPanel} onClose={handleCloseSidebar} onOptimizationChange={handleOptimizationChange} />}

      {/* Rate Calculator Modal */}
      <RateCalculatorModal isOpen={isRateCalculatorOpen} onClose={() => setIsRateCalculatorOpen(false)} />

      {/* ShipAI Chatbot */}
      <ShipAIChatbot onClose={() => {}} />
    </div>;
};
export default CreateLabelPage;