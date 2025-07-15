
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CarrierSelector from './CarrierSelector';
import AIRateMetrics from './AIRateMetrics';
import ShippingChatbot from './ShippingChatbot';
import RateCalculatorWidget from './RateCalculatorWidget';
import { ShippingRate } from '@/hooks/useShippingRates';

interface AIPoweredSidePanelProps {
  rates: ShippingRate[];
  onRatesReorder: (rates: ShippingRate[]) => void;
  onCarrierFilter: (carrier: string) => void;
  onRateSelect: (rateId: string) => void;
}

const AIPoweredSidePanel: React.FC<AIPoweredSidePanelProps> = ({
  rates,
  onRatesReorder,
  onCarrierFilter,
  onRateSelect,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [showCalculator, setShowCalculator] = useState(false);

  const handleCarrierChange = (carriers: string[]) => {
    if (carriers.length === 1) {
      onCarrierFilter(carriers[0]);
    } else {
      onCarrierFilter('all');
    }
  };

  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    if (rates.length === 0) return;

    let sortedRates = [...rates];
    
    switch (metric) {
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'reliable':
        const reliabilityOrder = { 'usps': 1, 'ups': 2, 'fedex': 3, 'dhl': 4 };
        sortedRates.sort((a, b) => {
          const aReliability = reliabilityOrder[a.carrier.toLowerCase() as keyof typeof reliabilityOrder] || 999;
          const bReliability = reliabilityOrder[b.carrier.toLowerCase() as keyof typeof reliabilityOrder] || 999;
          return aReliability - bReliability;
        });
        break;
      case 'value':
        sortedRates.sort((a, b) => {
          const aValue = parseFloat(a.rate) / Math.max(1, (a.delivery_days || 1));
          const bValue = parseFloat(b.rate) / Math.max(1, (b.delivery_days || 1));
          return aValue - bValue;
        });
        break;
      case 'overnight':
        sortedRates = sortedRates.filter(rate => 
          rate.service.toLowerCase().includes('overnight') || 
          rate.service.toLowerCase().includes('next day') ||
          (rate.delivery_days && rate.delivery_days <= 1)
        );
        break;
      case 'eco':
        // Prioritize USPS Ground and other eco-friendly options
        sortedRates.sort((a, b) => {
          const aEco = a.service.toLowerCase().includes('ground') || a.carrier.toLowerCase() === 'usps' ? 1 : 0;
          const bEco = b.service.toLowerCase().includes('ground') || b.carrier.toLowerCase() === 'usps' ? 1 : 0;
          return bEco - aEco;
        });
        break;
    }
    
    onRatesReorder(sortedRates);
    
    if (sortedRates.length > 0) {
      onRateSelect(sortedRates[0].id);
    }
  };

  const handleRateAdjustment = (instruction: string) => {
    const input = instruction.toLowerCase();
    
    if (input.includes('fastest')) {
      handleMetricSelect('fastest');
    } else if (input.includes('cheapest')) {
      handleMetricSelect('cheapest');
    } else if (input.includes('fedex')) {
      onCarrierFilter('fedex');
    } else if (input.includes('ups')) {
      onCarrierFilter('ups');
    } else if (input.includes('overnight')) {
      handleMetricSelect('overnight');
    }
  };

  return (
    <div className="space-y-4 sticky top-24">
      {/* AI-Powered Options Card */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-800">AI-Powered Options</h3>
        </div>
        
        <div className="space-y-4">
          <CarrierSelector
            selectedCarriers={[]}
            onCarrierChange={handleCarrierChange}
          />
          
          <AIRateMetrics
            selectedMetric={selectedMetric}
            onMetricSelect={handleMetricSelect}
          />
        </div>
      </Card>

      {/* Rate Calculator */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Rate Calculator</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCalculator(!showCalculator)}
            className="border-green-300 text-green-700 hover:bg-green-100"
          >
            {showCalculator ? 'Hide' : 'Show'}
          </Button>
        </div>
        
        {showCalculator && <RateCalculatorWidget />}
      </Card>

      {/* AI Chatbot */}
      <ShippingChatbot onRateAdjustment={handleRateAdjustment} />
    </div>
  );
};

export default AIPoweredSidePanel;
