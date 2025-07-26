
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, Sparkles, TrendingUp, Clock, DollarSign, Target, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date: string;
  original_rate?: string;
  discount_percentage?: number;
  isPremium?: boolean;
}

interface ImprovedAIRatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRate: ShippingRate | null;
  allRates: ShippingRate[];
  onRateSelect: (rateId: string) => void;
  onOptimizationChange: (filter: string) => void;
}

const ImprovedAIRatePanel: React.FC<ImprovedAIRatePanelProps> = ({
  isOpen,
  onClose,
  selectedRate,
  allRates,
  onRateSelect,
  onOptimizationChange
}) => {
  const [currentOptimization, setCurrentOptimization] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<string>('');

  const handleOptimization = async (type: 'cheapest' | 'fastest' | 'balanced') => {
    if (allRates.length === 0) {
      toast.error('No rates available to optimize');
      return;
    }

    setIsProcessing(true);
    setCurrentOptimization(type);

    try {
      let sortedRates = [...allRates];
      
      switch (type) {
        case 'cheapest':
          sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
          setLastAction('Optimized for lowest cost');
          break;
        case 'fastest':
          sortedRates.sort((a, b) => a.delivery_days - b.delivery_days);
          setLastAction('Optimized for fastest delivery');
          break;
        case 'balanced':
          sortedRates.sort((a, b) => {
            const scoreA = parseFloat(a.rate) * 0.7 + a.delivery_days * 0.3;
            const scoreB = parseFloat(b.rate) * 0.7 + b.delivery_days * 0.3;
            return scoreA - scoreB;
          });
          setLastAction('Optimized for best value balance');
          break;
      }

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      onOptimizationChange(type);
      
      if (sortedRates.length > 0) {
        onRateSelect(sortedRates[0].id);
        toast.success(`Selected best ${type} option: ${sortedRates[0].carrier} ${sortedRates[0].service}`);
      }
    } catch (error) {
      console.error('Error optimizing rates:', error);
      toast.error('Failed to optimize rates');
    } finally {
      setIsProcessing(false);
      setCurrentOptimization('');
    }
  };

  const calculateSavings = () => {
    if (allRates.length < 2) return 0;
    const sortedRates = [...allRates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
    const cheapest = parseFloat(sortedRates[0].rate);
    const mostExpensive = parseFloat(sortedRates[sortedRates.length - 1].rate);
    return mostExpensive - cheapest;
  };

  const potentialSavings = calculateSavings();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
          onClick={onClose} 
        />
      )}
      
      {/* AI Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 bg-white border-l-4 border-blue-500 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6" />
              <h3 className="text-lg font-bold">AI Rate Analysis</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {lastAction && (
            <div className="flex items-center space-x-1 text-sm opacity-90">
              <CheckCircle2 className="w-4 h-4" />
              <span>{lastAction}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Selected Rate Summary */}
          {selectedRate && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-blue-800">Selected Rate</h4>
                <Badge className="bg-blue-600 text-white">ACTIVE</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Carrier:</span>
                  <span className="font-medium">{selectedRate.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Service:</span>
                  <span className="font-medium">{selectedRate.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cost:</span>
                  <span className="font-bold text-green-600">${parseFloat(selectedRate.rate).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivery:</span>
                  <span className="font-medium">{selectedRate.delivery_days} days</span>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Optimization Actions */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-yellow-500" />
              Quick Changes
            </h4>
            
            <div className="space-y-2">
              <Button
                onClick={() => handleOptimization('cheapest')}
                disabled={isProcessing}
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {currentOptimization === 'cheapest' ? 'Optimizing...' : 'Find Cheapest'}
              </Button>
              
              <Button
                onClick={() => handleOptimization('fastest')}
                disabled={isProcessing}
                className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                <Clock className="w-4 h-4 mr-2" />
                {currentOptimization === 'fastest' ? 'Optimizing...' : 'Find Fastest'}
              </Button>
              
              <Button
                onClick={() => handleOptimization('balanced')}
                disabled={isProcessing}
                className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                <Target className="w-4 h-4 mr-2" />
                {currentOptimization === 'balanced' ? 'Optimizing...' : 'Best Balance'}
              </Button>
            </div>
          </Card>

          {/* Savings Analysis */}
          {potentialSavings > 0 && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Potential Savings</h4>
              <div className="text-2xl font-bold text-green-600">
                ${potentialSavings.toFixed(2)}
              </div>
              <p className="text-sm text-green-700 mt-1">
                Maximum savings available by choosing the cheapest option
              </p>
            </Card>
          )}

          {/* Rate Comparison */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Rate Comparison</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {allRates.map((rate) => (
                <div
                  key={rate.id}
                  className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                    selectedRate?.id === rate.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => onRateSelect(rate.id)}
                >
                  <div>
                    <div className="text-sm font-medium">{rate.carrier}</div>
                    <div className="text-xs text-gray-600">{rate.service}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${parseFloat(rate.rate).toFixed(2)}</div>
                    <div className="text-xs text-gray-600">{rate.delivery_days} days</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
            <h4 className="font-semibold mb-2 flex items-center text-purple-800">
              <Brain className="w-4 h-4 mr-2" />
              AI Insights
            </h4>
            <div className="space-y-2 text-sm">
              {allRates.length > 0 && (
                <>
                  <div className="flex items-center text-gray-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>Found {allRates.length} shipping options</span>
                  </div>
                  
                  {allRates.some(r => r.delivery_days <= 2) && (
                    <div className="flex items-center text-orange-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Express options available</span>
                    </div>
                  )}
                  
                  {potentialSavings > 5 && (
                    <div className="flex items-center text-green-600">
                      <DollarSign className="w-3 h-3 mr-1" />
                      <span>Significant savings possible</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ImprovedAIRatePanel;
