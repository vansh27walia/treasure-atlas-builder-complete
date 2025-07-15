
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Clock, DollarSign, Zap } from 'lucide-react';
import { ShippingRate } from '@/hooks/useShippingRates';

interface AIPoweredSidePanelProps {
  rates: ShippingRate[];
  onRatesReorder: (reorderedRates: ShippingRate[]) => void;
  onCarrierFilter: (carrier: string) => void;
  onRateSelect: (rateId: string) => void;
}

const AIPoweredSidePanel: React.FC<AIPoweredSidePanelProps> = ({
  rates,
  onRatesReorder,
  onCarrierFilter,
  onRateSelect
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('');

  const aiMetrics = [
    { id: 'most_efficient', name: 'Most Efficient', icon: Zap, description: 'Best balance of price and speed' },
    { id: 'fastest', name: 'Fastest Delivery', icon: Clock, description: 'Shortest delivery time' },
    { id: 'cheapest', name: 'Lowest Cost', icon: DollarSign, description: 'Most economical option' },
    { id: 'premium', name: 'Premium Services', icon: TrendingUp, description: 'Top-tier carriers only' }
  ];

  const handleMetricSelection = (metricId: string) => {
    setSelectedMetric(metricId);
    
    if (!rates || rates.length === 0) return;
    
    let reorderedRates = [...rates];
    let selectedRateId: string | null = null;
    
    switch (metricId) {
      case 'most_efficient':
        // Sort by best value (price/delivery time ratio)
        reorderedRates.sort((a, b) => {
          const aValue = parseFloat(a.rate) / (a.delivery_days || 1);
          const bValue = parseFloat(b.rate) / (b.delivery_days || 1);
          return aValue - bValue;
        });
        selectedRateId = reorderedRates[0]?.id;
        break;
        
      case 'fastest':
        // Sort by delivery time
        reorderedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        selectedRateId = reorderedRates[0]?.id;
        break;
        
      case 'cheapest':
        // Sort by price
        reorderedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        selectedRateId = reorderedRates[0]?.id;
        break;
        
      case 'premium':
        // Filter and sort premium services
        reorderedRates = reorderedRates.filter(rate => 
          rate.isPremium || 
          rate.service.toLowerCase().includes('express') ||
          rate.service.toLowerCase().includes('priority')
        ).sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        selectedRateId = reorderedRates[0]?.id;
        break;
    }
    
    onRatesReorder(reorderedRates);
    
    // Auto-select the best rate
    if (selectedRateId) {
      setTimeout(() => {
        onRateSelect(selectedRateId);
      }, 100);
    }
  };

  return (
    <div className="sticky top-32 space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Optimize Selection
            </label>
            <Select value={selectedMetric} onValueChange={handleMetricSelection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose optimization" />
              </SelectTrigger>
              <SelectContent>
                {aiMetrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <SelectItem key={metric.id} value={metric.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{metric.name}</div>
                          <div className="text-xs text-gray-500">{metric.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedMetric && (
            <div className="p-3 rounded-lg bg-white/80 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  AI Selected
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {aiMetrics.find(m => m.id === selectedMetric)?.description}
              </p>
            </div>
          )}

          <Button
            onClick={() => {
              setSelectedMetric('');
              onRatesReorder(rates);
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Reset Selection
          </Button>
        </CardContent>
      </Card>

      {/* Rate Analysis */}
      {rates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Options</span>
              <span className="font-semibold">{rates.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price Range</span>
              <span className="font-semibold">
                ${Math.min(...rates.map(r => parseFloat(r.rate)))} - 
                ${Math.max(...rates.map(r => parseFloat(r.rate)))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Range</span>
              <span className="font-semibold">
                {Math.min(...rates.map(r => r.delivery_days || 0))} - 
                {Math.max(...rates.map(r => r.delivery_days || 0))} days
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIPoweredSidePanel;
