
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
      
      {/* AI Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l-4 border-blue-500 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-blue-900">AI Rate Analysis</h2>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Selected Rate Info */}
            {selectedRate && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Selected Rate</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Carrier:</span>
                    <span className="font-medium">{selectedRate.carrier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{selectedRate.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-bold text-blue-600">${parseFloat(selectedRate.rate).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className="font-medium">{selectedRate.delivery_days} days</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Optimization */}
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                Quick Optimization
              </h3>
              
              <div className="space-y-3">
                <Button
                  onClick={() => handleOptimization('cheapest')}
                  disabled={isProcessing || allRates.length === 0}
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  {isProcessing && currentOptimization === 'cheapest' ? 'Optimizing...' : 'Find Cheapest'}
                </Button>
                
                <Button
                  onClick={() => handleOptimization('fastest')}
                  disabled={isProcessing || allRates.length === 0}
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {isProcessing && currentOptimization === 'fastest' ? 'Optimizing...' : 'Find Fastest'}
                </Button>
                
                <Button
                  onClick={() => handleOptimization('balanced')}
                  disabled={isProcessing || allRates.length === 0}
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {isProcessing && currentOptimization === 'balanced' ? 'Optimizing...' : 'Find Balanced'}
                </Button>
              </div>

              {lastAction && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{lastAction}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Savings Potential */}
            {potentialSavings > 0 && (
              <Card className="p-4 bg-green-50 border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">Potential Savings</h3>
                <div className="text-2xl font-bold text-green-600">
                  ${potentialSavings.toFixed(2)}
                </div>
                <p className="text-sm text-green-700 mt-1">
                  By choosing the cheapest option
                </p>
              </Card>
            )}

            {/* Rate Statistics */}
            {allRates.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Rate Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Options:</span>
                    <span className="font-medium">{allRates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carriers:</span>
                    <span className="font-medium">{[...new Set(allRates.map(r => r.carrier))].length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Range:</span>
                    <span className="font-medium">
                      ${Math.min(...allRates.map(r => parseFloat(r.rate))).toFixed(2)} - 
                      ${Math.max(...allRates.map(r => parseFloat(r.rate))).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Range:</span>
                    <span className="font-medium">
                      {Math.min(...allRates.map(r => r.delivery_days))} - 
                      {Math.max(...allRates.map(r => r.delivery_days))} days
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImprovedAIRatePanel;
