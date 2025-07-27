
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Brain, Star, Clock, DollarSign, Shield, Zap, Truck } from 'lucide-react';
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
        toast.error('Failed to analyze rate');
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

  useEffect(() => {
    if (isOpen && selectedRate) {
      setSelectedRateId(selectedRate.id);
      analyzeRate();
    }
  }, [isOpen, selectedRate]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl z-50 border-l-4 border-blue-500 overflow-hidden flex flex-col">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-white" />
            AI Rate Analysis
            <Badge className="bg-white/20 text-white text-xs">RECOMMENDED</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Rate Selector Dropdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Change Rate
            </h4>
            <Select value={selectedRateId} onValueChange={handleRateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a different rate" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                {allRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id} className="hover:bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <CarrierLogo carrier={rate.carrier} className="w-6 h-6" />
                      <div className="flex-1">
                        <div className="font-medium">{rate.carrier} {rate.service}</div>
                        <div className="text-sm text-gray-600">
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
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <CarrierLogo carrier={selectedRate.carrier} className="w-8 h-8" />
                <h3 className="font-semibold text-blue-900">{selectedRate.carrier} {selectedRate.service}</h3>
              </div>
              <p className="text-2xl font-bold text-blue-800">${parseFloat(selectedRate?.rate || 0).toFixed(2)}</p>
              <p className="text-sm text-blue-600">{selectedRate?.delivery_days} days delivery</p>
            </div>
          )}

          {/* AI Analysis */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">AI analyzing...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-800">{analysis.overallScore}/100</div>
                <div className="text-sm text-gray-600">Overall AI Score</div>
                <div className="text-xs text-blue-600 mt-1">✨ AI Recommended Choice</div>
              </div>

              {/* Labels */}
              <div className="space-y-2">
                {analysis.labels.isCheapest && (
                  <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300">
                    💰 This is the cheapest
                  </Badge>
                )}
                {analysis.labels.isFastest && (
                  <Badge className="w-full justify-start bg-yellow-100 text-yellow-800 border-yellow-300">
                    ⚡ This is the fastest
                  </Badge>
                )}
                {analysis.labels.isMostReliable && (
                  <Badge className="w-full justify-start bg-blue-100 text-blue-800 border-blue-300">
                    🛡️ This is the most reliable
                  </Badge>
                )}
                {analysis.labels.isMostEfficient && (
                  <Badge className="w-full justify-start bg-purple-100 text-purple-800 border-purple-300">
                    ✅ This is the most efficient
                  </Badge>
                )}
                {analysis.labels.isAIRecommended && (
                  <Badge className="w-full justify-start bg-pink-100 text-pink-800 border-pink-300">
                    🧠 AI says: Best match for your shipment!
                  </Badge>
                )}
              </div>

              {/* Detailed Scores */}
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg border-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Reliability</span>
                  </div>
                  <span className="font-semibold">{analysis.reliabilityScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <span className="font-semibold">{analysis.speedScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Cost Value</span>
                  </div>
                  <span className="font-semibold">{analysis.costScore}/100</span>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border-2">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">AI Recommendation</span>
                </div>
                <p className="text-sm text-gray-700">{analysis.recommendation}</p>
              </div>
            </div>
          ) : null}

          {/* Quick Change Guide */}
          <div className="space-y-4 border-2 border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Quick Changes
            </h3>
            
            {/* Top 3 Quick Change Options */}
            <div className="grid grid-cols-1 gap-2">
              {optimizationFilters.slice(0, 3).map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  className="justify-start h-auto p-3 border-2 hover:bg-blue-50"
                  onClick={() => handleQuickChange(filter.id)}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Expandable More Options */}
            <details className="group">
              <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-800">
                Show More Options ({optimizationFilters.length - 3} more)
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {optimizationFilters.slice(3).map((filter) => (
                  <Button
                    key={filter.id}
                    variant="outline"
                    className="justify-start h-auto p-2 text-sm border hover:bg-gray-50"
                    onClick={() => handleQuickChange(filter.id)}
                  >
                    <span className="mr-2">{filter.icon}</span>
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
