
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, Star, Zap, DollarSign, Shield, Leaf } from 'lucide-react';
import CarrierLogo from './CarrierLogo';
import { supabase } from '@/integrations/supabase/client';

interface AIRateSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  rates: any[];
  selectedRate: any;
  onRateSelect: (rate: any) => void;
  shipmentDetails: any;
}

const AIRateSidePanel: React.FC<AIRateSidePanelProps> = ({
  isOpen,
  onClose,
  rates,
  selectedRate,
  onRateSelect,
  shipmentDetails
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && rates.length > 0) {
      analyzeRates();
    }
  }, [isOpen, rates]);

  const analyzeRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rate', {
        body: { 
          rates,
          shipmentDetails,
          analysisType: 'comprehensive'
        }
      });

      if (!error && data) {
        setAiAnalysis(data);
      }
    } catch (error) {
      console.error('Error analyzing rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'cheapest': return DollarSign;
      case 'fastest': return Zap;
      case 'most_reliable': return Shield;
      case 'eco_friendly': return Leaf;
      case 'ai_recommended': return Brain;
      default: return Star;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'cheapest': return 'bg-green-100 text-green-800 border-green-300';
      case 'fastest': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'most_reliable': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'eco_friendly': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ai_recommended': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l z-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Rate Assistant</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing rates with AI...</p>
          </div>
        )}

        {/* AI Analysis Results */}
        {aiAnalysis && !loading && (
          <div className="space-y-6">
            {/* Current Selection Analysis */}
            {selectedRate && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Selected Rate Analysis</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <CarrierLogo carrier={selectedRate.carrier} className="w-8 h-8" />
                  <div>
                    <p className="font-medium">{selectedRate.carrier} - {selectedRate.service}</p>
                    <p className="text-2xl font-bold text-blue-700">${selectedRate.rate}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">AI Score:</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">
                      {aiAnalysis.selectedRateScore || 85}/100
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">
                    {aiAnalysis.selectedRateReason || "Good balance of cost and delivery time for your shipment."}
                  </p>
                </div>
              </Card>
            )}

            {/* AI Recommendations */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">AI Recommendations</h3>
              <div className="space-y-3">
                {aiAnalysis.recommendations?.map((rec: any, index: number) => {
                  const Icon = getRecommendationIcon(rec.type);
                  const rate = rates.find(r => r.id === rec.rateId);
                  
                  if (!rate) return null;

                  return (
                    <Card 
                      key={index}
                      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                        selectedRate?.id === rate.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => onRateSelect(rate)}
                    >
                      <div className="flex items-start space-x-3">
                        <CarrierLogo carrier={rate.carrier} className="w-6 h-6 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge 
                              variant="outline"
                              className={getRecommendationColor(rec.type)}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {rec.label}
                            </Badge>
                            <Badge variant="outline">
                              {rec.score}/100
                            </Badge>
                          </div>
                          <p className="font-medium text-gray-900">
                            {rate.carrier} - {rate.service}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ${rate.rate}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {rec.reason}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <Card className="p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Rate Overview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Cheapest Option</p>
                  <p className="font-bold text-green-600">
                    ${Math.min(...rates.map(r => parseFloat(r.rate))).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Fastest Option</p>
                  <p className="font-bold text-blue-600">
                    {Math.min(...rates.map(r => r.delivery_days || 5))} days
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Average Price</p>
                  <p className="font-bold text-gray-700">
                    ${(rates.reduce((sum, r) => sum + parseFloat(r.rate), 0) / rates.length).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Options Available</p>
                  <p className="font-bold text-gray-700">{rates.length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRateSidePanel;
