
import React from 'react';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import CarrierSelector from './CarrierSelector';
import RatePreferenceSelector from './RatePreferenceSelector';
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
  const handleCarrierChange = (carriers: string[]) => {
    // Filter rates based on selected carriers
    if (carriers.length === 1) {
      onCarrierFilter(carriers[0]);
    } else {
      onCarrierFilter('all');
    }
  };

  const handlePreferenceSelect = (preference: string) => {
    if (rates.length === 0) return;

    let sortedRates = [...rates];
    
    switch (preference) {
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'reliable':
        // Sort by carrier reliability (USPS, UPS, FedEx, DHL priority)
        const reliabilityOrder = { 'usps': 1, 'ups': 2, 'fedex': 3, 'dhl': 4 };
        sortedRates.sort((a, b) => {
          const aReliability = reliabilityOrder[a.carrier.toLowerCase()] || 999;
          const bReliability = reliabilityOrder[b.carrier.toLowerCase()] || 999;
          return aReliability - bReliability;
        });
        break;
      case 'value':
        // Best value: balance of price and speed
        sortedRates.sort((a, b) => {
          const aValue = parseFloat(a.rate) / Math.max(1, (a.delivery_days || 1));
          const bValue = parseFloat(b.rate) / Math.max(1, (b.delivery_days || 1));
          return aValue - bValue;
        });
        break;
    }
    
    onRatesReorder(sortedRates);
    
    // Highlight the top rate
    if (sortedRates.length > 0) {
      onRateSelect(sortedRates[0].id);
    }
  };

  return (
    <div className="space-y-6 sticky top-20">
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-800">AI-Powered Options</h3>
        </div>
        
        <div className="space-y-4">
          <CarrierSelector
            selectedCarriers={['usps', 'ups', 'fedex', 'dhl']}
            onCarrierChange={handleCarrierChange}
          />
          
          <RatePreferenceSelector
            onPreferenceSelect={handlePreferenceSelect}
          />
        </div>
      </Card>

      <RateCalculatorWidget />
    </div>
  );
};

export default AIPoweredSidePanel;
