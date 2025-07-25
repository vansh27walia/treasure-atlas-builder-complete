
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
      
      {/* AI Panel - Fixed positioning from right */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l-4 border-blue-500 transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI Rate Analysis</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/50">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Selected Rate Info */}
            {selectedRate && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-900">{selectedRate.carrier}</h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Selected
                  </Badge>
                </div>
                <p className="text-sm text-blue-700">{selectedRate.service}</p>
                <p className="text-2xl font-bold text-blue-800">${parseFloat(selectedRate.rate).toFixed(2)}</p>
                <p className="text-sm text-blue-600">{selectedRate.delivery_days} days delivery</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Quick Optimization
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => handleOptimization('cheapest')}
                  disabled={isProcessing}
                  className="flex items-center justify-start gap-3 p-4 h-auto bg-green-50 hover:bg-green-100 text-green-800 border border-green-200"
                  variant="outline"
                >
                  <DollarSign className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Find Cheapest</div>
                    <div className="text-xs opacity-80">Save up to ${potentialSavings.toFixed(2)}</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleOptimization('fastest')}
                  disabled={isProcessing}
                  className="flex items-center justify-start gap-3 p-4 h-auto bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200"
                  variant="outline"
                >
                  <Clock className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Find Fastest</div>
                    <div className="text-xs opacity-80">Get it there quickly</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleOptimization('balanced')}
                  disabled={isProcessing}
                  className="flex items-center justify-start gap-3 p-4 h-auto bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200"
                  variant="outline"
                >
                  <Target className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Best Balance</div>
                    <div className="text-xs opacity-80">Optimal price & speed</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Rate Comparison */}
            {allRates.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Rate Comparison</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {allRates.slice(0, 5).map((rate) => (
                    <div 
                      key={rate.id} 
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedRate?.id === rate.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => onRateSelect(rate.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{rate.carrier}</p>
                          <p className="text-xs text-gray-600">{rate.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">${parseFloat(rate.rate).toFixed(2)}</p>
                          <p className="text-xs text-gray-500">{rate.delivery_days} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Action */}
            {lastAction && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{lastAction}</span>
                </div>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3 text-yellow-800">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-600 border-t-transparent"></div>
                  <span className="font-medium">Processing optimization...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImprovedAIRatePanel;
