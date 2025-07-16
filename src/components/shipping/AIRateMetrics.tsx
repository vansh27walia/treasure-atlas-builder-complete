
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Sparkles, Zap, DollarSign, Shield, Clock, Leaf } from 'lucide-react';

interface AIRateMetricsProps {
  onMetricSelect: (metric: string) => void;
  selectedMetric: string;
}

const defaultMetrics = [
  { value: 'fastest', label: 'Fastest Delivery', icon: Zap, description: 'Prioritize speed' },
  { value: 'cheapest', label: 'Cheapest Rate', icon: DollarSign, description: 'Lowest cost' },
  { value: 'reliable', label: 'Most Reliable', icon: Shield, description: 'Best track record' },
  { value: 'value', label: 'Best Value', icon: Sparkles, description: 'Price vs speed balance' },
  { value: 'overnight', label: 'Overnight Only', icon: Clock, description: 'Next day delivery' },
  { value: 'eco', label: 'Eco-Friendly', icon: Leaf, description: 'Carbon neutral options' },
];

const AIRateMetrics: React.FC<AIRateMetricsProps> = ({
  onMetricSelect,
  selectedMetric,
}) => {
  const [customMetrics, setCustomMetrics] = useState<string[]>([]);

  const handleMetricChange = (metric: string) => {
    onMetricSelect(metric);
  };

  const selectedMetricData = defaultMetrics.find(m => m.value === selectedMetric);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <Label className="text-sm font-semibold text-purple-800">AI Rate Metrics</Label>
      </div>
      
      <Select onValueChange={handleMetricChange} value={selectedMetric}>
        <SelectTrigger className="w-full bg-white border-purple-200 focus:ring-purple-500">
          <SelectValue placeholder="Select priority metric" />
        </SelectTrigger>
        <SelectContent className="bg-white border-purple-200">
          {defaultMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <SelectItem key={metric.value} value={metric.value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{metric.label}</div>
                    <div className="text-xs text-gray-500">{metric.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedMetricData && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <selectedMetricData.icon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              {selectedMetricData.label}
            </span>
          </div>
          <p className="text-xs text-purple-600">
            {selectedMetricData.description}
          </p>
          <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
            AI Optimized
          </Badge>
        </div>
      )}
    </div>
  );
};

export default AIRateMetrics;
