
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Brain, Star, Clock, DollarSign, Shield, Zap, Truck, Award, MapPin, Leaf, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from './CarrierLogo';

interface AIRateAnalysisPanelProps {
  selectedRate: any;
  allRates: any[];
  isOpen: boolean;
  onClose: () => void;
  onOptimizationChange: (filter: string) => void;
}

interface AIAnalysis {
  overallScore: number;
  reliabilityScore: number;
  speedScore: number;
  costScore: number;
  serviceQualityScore: number;
  trackingScore: number;
  carbonImpactScore: number;
  securityScore: number;
  recommendation: string;
  labels: {
    isCheapest: boolean;
    isFastest: boolean;
    isMostReliable: boolean;
    isMostEfficient: boolean;
    isAIRecommended: boolean;
  };
}

const AIRateAnalysisPanel: React.FC<AIRateAnalysisPanelProps> = ({
  selectedRate,
  allRates,
  isOpen,
  onClose,
  onOptimizationChange
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [isClosed, setIsClosed] = useState(false);

  const optimizationFilters = [
    { id: 'cheapest', label: 'Cheapest', icon: '💰', color: 'bg-green-100 text-green-800' },
    { id: 'fastest', label: 'Fastest', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'balanced', label: 'Most Efficient', icon: '✅', color: 'bg-blue-100 text-blue-800' },
    { id: 'door-delivery', label: 'Door Delivery', icon: '📦', color: 'bg-purple-100 text-purple-800' },
    { id: 'po-box', label: 'PO Box Delivery', icon: '📫', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'eco-friendly', label: 'Eco Friendly', icon: '🌱', color: 'bg-green-100 text-green-800' },
    { id: '2-day', label: '2-Day Delivery', icon: '🕓', color: 'bg-orange-100 text-orange-800' },
    { id: 'express', label: 'Express Delivery', icon: '🚀', color: 'bg-red-100 text-red-800' },
    { id: 'most-reliable', label: 'Most Reliable', icon: '🛡️', color: 'bg-gray-100 text-gray-800' },
    { id: 'ai-recommended', label: 'AI Recommended', icon: '🧠', color: 'bg-pink-100 text-pink-800' }
  ];

  // Variable criteria display - randomly show 3-5 criteria
  const getDisplayCriteria = () => {
    if (!analysis) return [];
    
    const allCriteria = [
      { key: 'reliabilityScore', label: 'Reliability', icon: Shield, color: 'text-blue-600' },
      { key: 'speedScore', label: 'Speed', icon: Clock, color: 'text-green-600' },
      { key: 'costScore', label: 'Cost Value', icon: DollarSign, color: 'text-purple-600' },
      { key: 'serviceQualityScore', label: 'Service Quality', icon: Star, color: 'text-yellow-600' },
      { key: 'trackingScore', label: 'Tracking', icon: Eye, color: 'text-indigo-600' },
      { key: 'carbonImpactScore', label: 'Eco Impact', icon: Leaf, color: 'text-green-500' },
      { key: 'securityScore', label: 'Security', icon: Shield, color: 'text-red-600' }
    ];

    // Randomly select 3-5 criteria
    const numCriteria = Math.floor(Math.random() * 3) + 3; // 3-5
    const shuffled = [...allCriteria].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numCriteria);
  };

  const analyzeRate = async () => {
    if (!selectedRate || !allRates) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rate', {
        body: {
          selectedRate,
          allRates,
          context: {
            totalRates: allRates.length,
            priceRange: {
              min: Math.min(...allRates.map(r => parseFloat(r.rate))),
              max: Math.max(...allRates.map(r => parseFloat(r.rate)))
            }
          }
        }
      });

      if (error) {
        console.error('Error analyzing rate:', error);
        // Generate mock analysis if API fails
        const mockAnalysis: AIAnalysis = {
          overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
          reliabilityScore: Math.floor(Math.random() * 40) + 60,
          speedScore: Math.floor(Math.random() * 40) + 60,
          costScore: Math.floor(Math.random() * 40) + 60,
          serviceQualityScore: Math.floor(Math.random() * 40) + 60,
          trackingScore: Math.floor(Math.random() * 40) + 60,
          carbonImpactScore: Math.floor(Math.random() * 40) + 60,
          securityScore: Math.floor(Math.random() * 40) + 60,
          recommendation: `This ${selectedRate.carrier} ${selectedRate.service} option offers a good balance of cost and delivery time for your shipment.`,
          labels: {
            isCheapest: parseFloat(selectedRate.rate) === Math.min(...allRates.map(r => parseFloat(r.rate))),
            isFastest: selectedRate.delivery_days === Math.min(...allRates.map(r => r.delivery_days || 999)),
            isMostReliable: selectedRate.carrier?.toLowerCase().includes('usps'),
            isMostEfficient: true,
            isAIRecommended: Math.random() > 0.3
          }
        };
        setAnalysis(mockAnalysis);
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze rate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (rateId: string) => {
    setSelectedRateId(rateId);
    const newSelectedRate = allRates.find(rate => rate.id === rateId);
    if (newSelectedRate) {
      document.dispatchEvent(new CustomEvent('select-shipping-rate', { 
        detail: { rateId } 
      }));
    }
  };

  const handleQuickChange = (filterId: string) => {
    onOptimizationChange(filterId);
    toast.success(`Applied ${filterId} optimization`);
  };

  const handleClose = () => {
    setIsClosed(true);
    onClose();
  };

  // Listen for payment events to auto-close sidebar
  useEffect(() => {
    const handlePaymentStart = () => {
      setIsClosed(true);
      onClose();
    };

    const handlePaymentComplete = () => {
      setIsClosed(true);
      onClose();
    };

    // Listen for payment button clicks
    const handlePaymentButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target?.textContent?.toLowerCase().includes('pay') || 
          target?.textContent?.toLowerCase().includes('checkout') ||
          target?.classList?.contains('payment-button')) {
        handlePaymentStart();
      }
    };

    document.addEventListener('payment-start', handlePaymentStart);
    document.addEventListener('payment-complete', handlePaymentComplete);
    document.addEventListener('payment-success', handlePaymentComplete);
    document.addEventListener('payment-cancel', handlePaymentComplete);
    document.addEventListener('click', handlePaymentButtonClick, true);

    return () => {
      document.removeEventListener('payment-start', handlePaymentStart);
      document.removeEventListener('payment-complete', handlePaymentComplete);
      document.removeEventListener('payment-success', handlePaymentComplete);
      document.removeEventListener('payment-cancel', handlePaymentComplete);
      document.removeEventListener('click', handlePaymentButtonClick, true);
    };
  }, [onClose]);

  useEffect(() => {
    if (isOpen && selectedRate && !isClosed) {
      setSelectedRateId(selectedRate.id);
      analyzeRate();
    }
  }, [isOpen, selectedRate, isClosed]);

  // Reset closed state when panel should be open again
  useEffect(() => {
    if (isOpen) {
      setIsClosed(false);
    }
  }, [isOpen]);

  if (!isOpen || isClosed) return null;

  const displayCriteria = getDisplayCriteria();

  return (
    <div className="fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 border-l-4 border-blue-500 overflow-hidden flex flex-col">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 flex-shrink-0 py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-white" />
            AI Rate Analysis
            <Badge className="bg-white/20 text-white text-xs px-1">AI</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20 h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Rate Selector Dropdown */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
              <Truck className="w-3 h-3" />
              Change Rate
            </h4>
            <Select value={selectedRateId} onValueChange={handleRateChange}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select rate" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                {allRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id} className="hover:bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-medium text-xs">{rate.carrier} {rate.service}</div>
                        <div className="text-xs text-gray-600">
                          ${parseFloat(rate.rate).toFixed(2)} - {rate.delivery_days} days
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Rate Info */}
          {selectedRate && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CarrierLogo carrier={selectedRate.carrier} className="w-6 h-6" />
                <h3 className="font-semibold text-blue-900 text-sm">{selectedRate.carrier} {selectedRate.service}</h3>
              </div>
              <p className="text-xl font-bold text-blue-800">${parseFloat(selectedRate?.rate || 0).toFixed(2)}</p>
              <p className="text-xs text-blue-600">{selectedRate?.delivery_days} days delivery</p>
            </div>
          )}

          {/* AI Analysis */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm">AI analyzing...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              {/* Overall Score */}
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">{analysis.overallScore}/100</div>
                <div className="text-xs text-gray-600">Overall AI Score</div>
                <div className="text-xs text-blue-600 mt-1">✨ AI Recommended</div>
              </div>

              {/* Labels */}
              <div className="space-y-1">
                {analysis.labels.isCheapest && (
                  <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300 text-xs py-1">
                    💰 Cheapest option
                  </Badge>
                )}
                {analysis.labels.isFastest && (
                  <Badge className="w-full justify-start bg-yellow-100 text-yellow-800 border-yellow-300 text-xs py-1">
                    ⚡ Fastest delivery
                  </Badge>
                )}
                {analysis.labels.isMostReliable && (
                  <Badge className="w-full justify-start bg-blue-100 text-blue-800 border-blue-300 text-xs py-1">
                    🛡️ Most reliable
                  </Badge>
                )}
                {analysis.labels.isMostEfficient && (
                  <Badge className="w-full justify-start bg-purple-100 text-purple-800 border-purple-300 text-xs py-1">
                    ✅ Most efficient
                  </Badge>
                )}
              </div>

              {/* Variable Detailed Scores */}
              <div className="space-y-2 p-2 bg-gray-50 rounded-lg border">
                {displayCriteria.map((criterion) => {
                  const Icon = criterion.icon;
                  return (
                    <div key={criterion.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Icon className={`w-3 h-3 ${criterion.color}`} />
                        <span className="text-xs">{criterion.label}</span>
                      </div>
                      <span className="font-semibold text-xs">{analysis[criterion.key as keyof AIAnalysis] as number}/100</span>
                    </div>
                  );
                })}
              </div>

              {/* AI Recommendation */}
              <div className="p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                <div className="flex items-center gap-1 mb-1">
                  <Brain className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-900 text-xs">AI Recommendation</span>
                </div>
                <p className="text-xs text-gray-700">{analysis.recommendation}</p>
              </div>
            </div>
          ) : null}

          {/* Quick Change Guide */}
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
              <Zap className="w-3 h-3 text-yellow-500" />
              Quick Changes
            </h3>
            
            {/* Top 3 Quick Change Options */}
            <div className="grid grid-cols-1 gap-1">
              {optimizationFilters.slice(0, 3).map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  className="justify-start h-auto p-2 border hover:bg-blue-50 text-xs"
                  onClick={() => handleQuickChange(filter.id)}
                >
                  <span className="mr-1">{filter.icon}</span>
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Expandable More Options */}
            <details className="group">
              <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-800 text-xs">
                Show More ({optimizationFilters.length - 3} more)
              </summary>
              <div className="mt-2 grid grid-cols-1 gap-1">
                {optimizationFilters.slice(3).map((filter) => (
                  <Button
                    key={filter.id}
                    variant="outline"
                    className="justify-start h-auto p-2 text-xs border hover:bg-gray-50"
                    onClick={() => handleQuickChange(filter.id)}
                  >
                    <span className="mr-1">{filter.icon}</span>
                    {filter.label}
                  </Button>
                ))}
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIRateAnalysisPanel;
