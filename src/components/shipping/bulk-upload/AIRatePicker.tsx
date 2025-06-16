
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Zap, DollarSign, Clock, Calendar } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

interface AIRatePickerProps {
  shipments: BulkShipment[];
  onApplyAISelection: (shipmentId: string, rateId: string) => void;
}

const AIRatePicker: React.FC<AIRatePickerProps> = ({
  shipments,
  onApplyAISelection
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState<string>('');

  const criteria = [
    { value: 'fastest', label: 'Fastest Delivery', icon: Zap },
    { value: 'affordable', label: 'Most Affordable', icon: DollarSign },
    { value: '2day', label: 'Delivery in 2 Days', icon: Clock },
    { value: '3day', label: 'Delivery in 3 Days', icon: Calendar }
  ];

  const analyzeRates = async () => {
    if (!selectedCriteria) {
      toast.error('Please select optimization criteria');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      shipments.forEach(shipment => {
        if (!shipment.availableRates || shipment.availableRates.length === 0) return;
        
        let bestRate;
        
        switch (selectedCriteria) {
          case 'fastest':
            bestRate = shipment.availableRates.reduce((prev, curr) => 
              (curr.delivery_days || 999) < (prev.delivery_days || 999) ? curr : prev
            );
            break;
          case 'affordable':
            bestRate = shipment.availableRates.reduce((prev, curr) => {
              const currRate = typeof curr.rate === 'string' ? parseFloat(curr.rate) : curr.rate;
              const prevRate = typeof prev.rate === 'string' ? parseFloat(prev.rate) : prev.rate;
              return currRate < prevRate ? curr : prev;
            });
            break;
          case '2day':
            bestRate = shipment.availableRates.find(rate => rate.delivery_days === 2) ||
                      shipment.availableRates.reduce((prev, curr) => 
                        Math.abs((curr.delivery_days || 999) - 2) < Math.abs((prev.delivery_days || 999) - 2) ? curr : prev
                      );
            break;
          case '3day':
            bestRate = shipment.availableRates.find(rate => rate.delivery_days === 3) ||
                      shipment.availableRates.reduce((prev, curr) => 
                        Math.abs((curr.delivery_days || 999) - 3) < Math.abs((prev.delivery_days || 999) - 3) ? curr : prev
                      );
            break;
          default:
            bestRate = shipment.availableRates[0];
        }
        
        if (bestRate) {
          onApplyAISelection(shipment.id, bestRate.id);
        }
      });
      
      const criteriaLabel = criteria.find(c => c.value === selectedCriteria)?.label;
      toast.success(`AI has optimized rates for ${criteriaLabel}!`);
      
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to analyze rates. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-purple-800">AI Rate Optimizer</span>
        </div>
        
        <Select value={selectedCriteria} onValueChange={setSelectedCriteria}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Choose optimization" />
          </SelectTrigger>
          <SelectContent>
            {criteria.map((criterion) => {
              const Icon = criterion.icon;
              return (
                <SelectItem key={criterion.value} value={criterion.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{criterion.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        <Button
          onClick={analyzeRates}
          disabled={!selectedCriteria || isAnalyzing}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isAnalyzing ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Find Best Rates with AI
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default AIRatePicker;
