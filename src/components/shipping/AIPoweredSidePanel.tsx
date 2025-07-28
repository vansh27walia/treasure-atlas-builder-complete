
import React, { useState } from 'react';
import { X, Sparkles, TrendingUp, Filter, Calculator, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AIRateMetrics from './AIRateMetrics';
import ShippingAIRecommendation from './ShippingAIRecommendation';

interface AIPoweredSidePanelProps {
  rates: any[];
  onRatesReorder: (reorderedRates: any[]) => void;
  onCarrierFilter: (carrier: string) => void;
  onRateSelect: (rate: any) => void;
  onOpenRateCalculator: () => void;
  onClose: () => void;
}

const AIPoweredSidePanel: React.FC<AIPoweredSidePanelProps> = ({
  rates,
  onRatesReorder,
  onCarrierFilter,
  onRateSelect,
  onOpenRateCalculator,
  onClose
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('value');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      // Sort rates based on selected metric
      const sortedRates = [...rates].sort((a, b) => {
        switch (metric) {
          case 'fastest':
            return a.days - b.days;
          case 'cheapest':
            return parseFloat(a.rate) - parseFloat(b.rate);
          case 'reliable':
            return b.reliability - a.reliability;
          default:
            return parseFloat(a.rate) - parseFloat(b.rate);
        }
      });
      onRatesReorder(sortedRates);
    }, 1500);
  };

  const aiRecommendation = {
    bestOverall: rates[0]?.id || null,
    bestValue: rates.find(r => r.isRecommended)?.id || rates[0]?.id || null,
    fastest: rates.sort((a, b) => a.days - b.days)[0]?.id || null,
    mostReliable: rates.sort((a, b) => b.reliability - a.reliability)[0]?.id || null,
    analysisText: `Based on your shipping preferences, I've analyzed ${rates.length} available rates. The AI recommends balancing cost and delivery time for optimal value.`
  };

  const handleRecommendationSelect = (rateId: string) => {
    const selectedRate = rates.find(r => r.id === rateId);
    if (selectedRate) {
      onRateSelect(selectedRate);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 border-l-4 border-blue-500 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-blue-600 text-white p-4 shadow-lg z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-xl font-bold">AI Overview</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-blue-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          AI-powered shipping insights and recommendations
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* AI Rate Metrics */}
        <Card className="border-blue-200 bg-white shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Optimization Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIRateMetrics 
              onMetricSelect={handleMetricSelect}
              selectedMetric={selectedMetric}
            />
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-blue-200 bg-white shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShippingAIRecommendation
              aiRecommendation={aiRecommendation}
              isLoading={isAnalyzing}
              onSelectRecommendation={handleRecommendationSelect}
            />
          </CardContent>
        </Card>

        {/* Rate Analysis */}
        <Card className="border-blue-200 bg-white shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Rate Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Rates Found:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {rates.length}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Price Range:</span>
                <span className="text-sm text-gray-600">
                  ${Math.min(...rates.map(r => parseFloat(r.rate)))} - ${Math.max(...rates.map(r => parseFloat(r.rate)))}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Delivery Range:</span>
                <span className="text-sm text-gray-600">
                  {Math.min(...rates.map(r => r.days))} - {Math.max(...rates.map(r => r.days))} days
                </span>
              </div>

              <div className="pt-3 border-t">
                <Button 
                  onClick={onOpenRateCalculator}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Open Rate Calculator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-blue-200 bg-white shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium mb-1">💡 Cost Optimization</p>
                <p className="text-blue-700">
                  You could save up to ${(Math.max(...rates.map(r => parseFloat(r.rate))) - Math.min(...rates.map(r => parseFloat(r.rate)))).toFixed(2)} by choosing the most economical option.
                </p>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium mb-1">⚡ Speed Insight</p>
                <p className="text-green-700">
                  Express options are available for next-day delivery with premium carriers.
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-800 font-medium mb-1">🛡️ Reliability</p>
                <p className="text-amber-700">
                  USPS and UPS show highest reliability scores for this route.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIPoweredSidePanel;
