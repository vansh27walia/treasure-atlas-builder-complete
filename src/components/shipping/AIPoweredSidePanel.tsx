
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CarrierDropdown from './CarrierDropdown';
import ShippingChatbot from './ShippingChatbot';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Filter,
  Zap,
  Target,
  CheckCircle2,
  Calculator
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date: string;
  original_rate?: string;
}

interface AIPoweredSidePanelProps {
  rates: ShippingRate[];
  onRatesReorder: (reorderedRates: ShippingRate[]) => void;
  onCarrierFilter: (carrier: string) => void;
  onRateSelect: (rateId: string) => void;
  onOpenRateCalculator: () => void;
}

const AIPoweredSidePanel: React.FC<AIPoweredSidePanelProps> = ({
  rates,
  onRatesReorder,
  onCarrierFilter,
  onRateSelect,
  onOpenRateCalculator
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOptimization, setCurrentOptimization] = useState<string>('');
  const [lastAction, setLastAction] = useState<string>('');
  const [selectedCarrier, setSelectedCarrier] = useState('all');

  const availableCarriers = ['ups', 'usps'];

  const handleCarrierChange = (carrier: string) => {
    setSelectedCarrier(carrier);
    onCarrierFilter(carrier);
    toast.success(`Filtered by ${carrier === 'all' ? 'All Carriers' : carrier.toUpperCase()}`);
  };

  const optimizeRates = async (type: 'cost' | 'speed' | 'balance') => {
    if (rates.length === 0) {
      toast.error('No rates available to optimize');
      return;
    }

    setIsProcessing(true);
    setCurrentOptimization(type);

    try {
      let optimizedRates = [...rates];

      switch (type) {
        case 'cost':
          optimizedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
          setLastAction('Optimized for lowest cost');
          break;
        case 'speed':
          optimizedRates.sort((a, b) => a.delivery_days - b.delivery_days);
          setLastAction('Optimized for fastest delivery');
          break;
        case 'balance':
          optimizedRates.sort((a, b) => {
            const scoreA = parseFloat(a.rate) * 0.7 + a.delivery_days * 0.3;
            const scoreB = parseFloat(b.rate) * 0.7 + b.delivery_days * 0.3;
            return scoreA - scoreB;
          });
          setLastAction('Optimized for best value balance');
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
      onRatesReorder(optimizedRates);
      
      if (optimizedRates.length > 0) {
        setTimeout(() => {
          onRateSelect(optimizedRates[0].id);
          toast.success(`Selected best ${type} option: ${optimizedRates[0].carrier} ${optimizedRates[0].service}`);
        }, 500);
      }

      toast.success(`Rates optimized for ${type}`);
    } catch (error) {
      console.error('Error optimizing rates:', error);
      toast.error('Failed to optimize rates');
    } finally {
      setIsProcessing(false);
      setCurrentOptimization('');
    }
  };

  const calculateSavings = () => {
    if (rates.length < 2) return 0;
    const sortedRates = [...rates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
    const cheapest = parseFloat(sortedRates[0].rate);
    const mostExpensive = parseFloat(sortedRates[sortedRates.length - 1].rate);
    return mostExpensive - cheapest;
  };

  const potentialSavings = calculateSavings();

  const getStatsInsights = () => {
    if (rates.length === 0) return null;

    const prices = rates.map(r => parseFloat(r.rate));
    const deliveryDays = rates.map(r => r.delivery_days);
    
    return {
      avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
      avgDelivery: Math.round(deliveryDays.reduce((a, b) => a + b, 0) / deliveryDays.length),
      priceRange: `$${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`,
      carriers: [...new Set(rates.map(r => r.carrier))].length
    };
  };

  const stats = getStatsInsights();

  const handleRateAdjustment = (instruction: string) => {
    console.log('Rate adjustment instruction:', instruction);
    const input = instruction.toLowerCase();
    
    if (input.includes('fastest') || input.includes('quick')) {
      optimizeRates('speed');
    } else if (input.includes('cheap') || input.includes('lowest')) {
      optimizeRates('cost');
    } else if (input.includes('ups')) {
      handleCarrierChange('ups');
    } else if (input.includes('usps')) {
      handleCarrierChange('usps');
    }
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <Button
          onClick={onOpenRateCalculator}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 p-4 h-auto"
        >
          <Calculator className="w-5 h-5" />
          <span className="font-medium">Rate Calculator</span>
        </Button>
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-500" />
          Select Carrier
        </h4>
        <CarrierDropdown
          selectedCarrier={selectedCarrier}
          onCarrierChange={handleCarrierChange}
          availableCarriers={availableCarriers}
        />
      </Card>

      <Card className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">AI Assistant</h3>
          <Sparkles className="w-4 h-4 text-purple-500" />
        </div>
        
        {stats && (
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Avg Price:</span>
              <span className="font-medium">${stats.avgPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Delivery:</span>
              <span className="font-medium">{stats.avgDelivery} days</span>
            </div>
            <div className="flex justify-between">
              <span>Carriers:</span>
              <span className="font-medium">{stats.carriers}</span>
            </div>
          </div>
        )}

        {potentialSavings > 0 && (
          <div className="mt-3 p-2 bg-green-100 rounded-lg">
            <div className="flex items-center gap-1 text-green-800">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">
                Save up to ${potentialSavings.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500" />
          Smart Optimization
        </h4>
        
        <div className="space-y-2">
          <Button
            onClick={() => optimizeRates('cost')}
            disabled={isProcessing || rates.length === 0}
            className="w-full justify-start text-sm bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {isProcessing && currentOptimization === 'cost' ? 'Optimizing...' : 'Lowest Cost'}
          </Button>
          
          <Button
            onClick={() => optimizeRates('speed')}
            disabled={isProcessing || rates.length === 0}
            className="w-full justify-start text-sm bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <Clock className="w-4 h-4 mr-2" />
            {isProcessing && currentOptimization === 'speed' ? 'Optimizing...' : 'Fastest Delivery'}
          </Button>
          
          <Button
            onClick={() => optimizeRates('balance')}
            disabled={isProcessing || rates.length === 0}
            className="w-full justify-start text-sm bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            {isProcessing && currentOptimization === 'balance' ? 'Optimizing...' : 'Best Balance'}
          </Button>
        </div>

        {lastAction && (
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-1 text-blue-800">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">{lastAction}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <ShippingChatbot onRateAdjustment={handleRateAdjustment} />
      </div>

      {isProcessing && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">AI Processing...</span>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIPoweredSidePanel;
