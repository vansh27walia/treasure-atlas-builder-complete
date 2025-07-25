
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Shield,
  Zap,
  Target,
  CheckCircle2
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days?: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  original_rate?: string;
  isPremium?: boolean;
  discount_percentage?: number;
}

interface AISuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRate: ShippingRate | null;
  allRates: ShippingRate[];
  onRateSelect: (rateId: string) => void;
  onQuickAsk: (type: 'cheapest' | 'fastest' | 'balanced') => void;
}

const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  isOpen,
  onClose,
  selectedRate,
  allRates,
  onRateSelect,
  onQuickAsk
}) => {
  const [recommendation, setRecommendation] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate AI recommendation based on selected rate
  useEffect(() => {
    if (selectedRate && allRates.length > 0) {
      setIsProcessing(true);
      
      // Simulate AI processing
      setTimeout(() => {
        const cheapestRate = allRates.reduce((prev, curr) => 
          parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
        );
        
        const fastestRate = allRates.reduce((prev, curr) => 
          (prev.delivery_days || 999) < (curr.delivery_days || 999) ? prev : curr
        );
        
        let aiMessage = '';
        
        if (selectedRate.id === cheapestRate.id) {
          aiMessage = 'Great choice! You\'ve selected the most cost-effective option.';
        } else if (selectedRate.id === fastestRate.id) {
          aiMessage = 'Excellent! You\'ve chosen the fastest delivery option.';
        } else {
          aiMessage = 'Good selection! This offers a balanced combination of cost and speed.';
        }
        
        setRecommendation(aiMessage);
        setIsProcessing(false);
      }, 1000);
    }
  }, [selectedRate, allRates]);

  const handleQuickAsk = async (type: 'cheapest' | 'fastest' | 'balanced') => {
    setIsProcessing(true);
    
    try {
      let targetRate: ShippingRate | null = null;
      
      switch (type) {
        case 'cheapest':
          targetRate = allRates.reduce((prev, curr) => 
            parseFloat(prev.rate) < parseFloat(curr.rate) ? prev : curr
          );
          break;
        case 'fastest':
          targetRate = allRates.reduce((prev, curr) => 
            (prev.delivery_days || 999) < (curr.delivery_days || 999) ? prev : curr
          );
          break;
        case 'balanced':
          // Score based on normalized cost and delivery time
          const scoredRates = allRates.map(rate => {
            const costScore = parseFloat(rate.rate) / Math.max(...allRates.map(r => parseFloat(r.rate)));
            const speedScore = (rate.delivery_days || 7) / Math.max(...allRates.map(r => r.delivery_days || 7));
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
        await new Promise(resolve => setTimeout(resolve, 1500));
        onRateSelect(targetRate.id);
        onQuickAsk(type);
        toast.success(`Selected ${type} option: ${targetRate.carrier} ${targetRate.service}`);
      }
    } catch (error) {
      console.error('Error in quick ask:', error);
      toast.error('Failed to process quick selection');
    } finally {
      setIsProcessing(false);
    }
  };

  const getEvaluationCriteria = () => {
    if (!selectedRate) return [];
    
    const criteria = [
      {
        icon: <DollarSign className="w-4 h-4 text-green-600" />,
        label: 'Cost Effectiveness',
        value: `$${parseFloat(selectedRate.rate).toFixed(2)}`,
        rating: getCostRating(selectedRate, allRates)
      },
      {
        icon: <Clock className="w-4 h-4 text-blue-600" />,
        label: 'Delivery Speed',
        value: selectedRate.delivery_days ? `${selectedRate.delivery_days} days` : 'N/A',
        rating: getSpeedRating(selectedRate, allRates)
      },
      {
        icon: <Shield className="w-4 h-4 text-purple-600" />,
        label: 'Reliability',
        value: getReliabilityScore(selectedRate.carrier),
        rating: getReliabilityRating(selectedRate.carrier)
      },
      {
        icon: <TrendingUp className="w-4 h-4 text-orange-600" />,
        label: 'Value Score',
        value: getValueScore(selectedRate, allRates),
        rating: getValueRating(selectedRate, allRates)
      }
    ];
    
    return criteria;
  };

  const getCostRating = (rate: ShippingRate, allRates: ShippingRate[]) => {
    const costs = allRates.map(r => parseFloat(r.rate));
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const currentCost = parseFloat(rate.rate);
    
    if (currentCost === minCost) return 'Excellent';
    if (currentCost <= minCost + (maxCost - minCost) * 0.3) return 'Good';
    if (currentCost <= minCost + (maxCost - minCost) * 0.7) return 'Fair';
    return 'Poor';
  };

  const getSpeedRating = (rate: ShippingRate, allRates: ShippingRate[]) => {
    const speeds = allRates.map(r => r.delivery_days || 7);
    const minSpeed = Math.min(...speeds);
    const currentSpeed = rate.delivery_days || 7;
    
    if (currentSpeed === minSpeed) return 'Excellent';
    if (currentSpeed <= minSpeed + 1) return 'Good';
    if (currentSpeed <= minSpeed + 2) return 'Fair';
    return 'Poor';
  };

  const getReliabilityScore = (carrier: string) => {
    const scores = {
      'UPS': '95%',
      'USPS': '92%',
      'FedEx': '96%',
      'DHL': '94%'
    };
    return scores[carrier.toUpperCase()] || '90%';
  };

  const getReliabilityRating = (carrier: string) => {
    const ratings = {
      'UPS': 'Excellent',
      'USPS': 'Good',
      'FedEx': 'Excellent',
      'DHL': 'Good'
    };
    return ratings[carrier.toUpperCase()] || 'Fair';
  };

  const getValueScore = (rate: ShippingRate, allRates: ShippingRate[]) => {
    const costRating = getCostRating(rate, allRates);
    const speedRating = getSpeedRating(rate, allRates);
    
    const scores = { 'Excellent': 4, 'Good': 3, 'Fair': 2, 'Poor': 1 };
    const avgScore = (scores[costRating] + scores[speedRating]) / 2;
    
    return `${avgScore.toFixed(1)}/4.0`;
  };

  const getValueRating = (rate: ShippingRate, allRates: ShippingRate[]) => {
    const score = parseFloat(getValueScore(rate, allRates));
    if (score >= 3.5) return 'Excellent';
    if (score >= 2.5) return 'Good';
    if (score >= 1.5) return 'Fair';
    return 'Poor';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">AI Shipping Assistant</h3>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quick Ask Buttons */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Quick Ask</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={() => handleQuickAsk('cheapest')}
                disabled={isProcessing}
                className="justify-start bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Show Cheapest'}
              </Button>
              
              <Button
                onClick={() => handleQuickAsk('fastest')}
                disabled={isProcessing}
                className="justify-start bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Show Fastest'}
              </Button>
              
              <Button
                onClick={() => handleQuickAsk('balanced')}
                disabled={isProcessing}
                className="justify-start bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Target className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Show Balanced'}
              </Button>
            </div>
          </div>

          {/* AI Recommendation */}
          {selectedRate && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Brain className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">AI Recommendation</h4>
                  {isProcessing ? (
                    <div className="flex items-center space-x-2 text-blue-700">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm">Analyzing your selection...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Evaluation Criteria */}
          {selectedRate && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Evaluation Criteria</h4>
              <div className="space-y-3">
                {getEvaluationCriteria().map((criterion, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {criterion.icon}
                      <span className="text-sm font-medium">{criterion.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{criterion.value}</div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          criterion.rating === 'Excellent' ? 'bg-green-50 text-green-700 border-green-300' :
                          criterion.rating === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          criterion.rating === 'Fair' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                          'bg-red-50 text-red-700 border-red-300'
                        }`}
                      >
                        {criterion.rating}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Rate Summary */}
          {selectedRate && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Selected Rate</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Carrier:</span>
                  <span className="font-medium">{selectedRate.carrier.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-medium">{selectedRate.service}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">${parseFloat(selectedRate.rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="font-medium">
                    {selectedRate.delivery_days ? `${selectedRate.delivery_days} days` : 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISuggestionPanel;
