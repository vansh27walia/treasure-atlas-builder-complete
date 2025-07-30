
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, TrendingUp, Clock, DollarSign, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AIRateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRate: any;
  allRates: any[];
  onRateSelect: (rateId: string) => void;
}

const AIRateSidebar: React.FC<AIRateSidebarProps> = ({
  isOpen,
  onClose,
  selectedRate,
  allRates,
  onRateSelect
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (isOpen && selectedRate) {
      analyzeRate();
    }
  }, [isOpen, selectedRate]);

  const analyzeRate = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rate', {
        body: {
          selectedRate,
          allRates,
          context: {
            totalRates: allRates.length,
            priceRange: {
              min: Math.min(...allRates.map(r => parseFloat(r.rate))),
              max: Math.max(...allRates.map(r => parseFloat(r.rate)))
            }
          }
        }
      });

      if (error) throw error;
      setAiAnalysis(data);
    } catch (error) {
      console.error('Error analyzing rate:', error);
      toast.error('Failed to analyze rate');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateDynamicDiscount = (rate: any) => {
    const originalPrice = parseFloat(rate.list_rate || rate.retail_rate || rate.rate);
    const currentPrice = parseFloat(rate.rate);
    
    if (originalPrice > currentPrice) {
      const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l z-50 overflow-y-auto">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Rate Analysis
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {/* Selected Rate Info */}
          {selectedRate && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">{selectedRate.carrier} {selectedRate.service}</h3>
                {calculateDynamicDiscount(selectedRate) > 0 && (
                  <Badge className="bg-green-100 text-green-800">
                    {calculateDynamicDiscount(selectedRate)}% OFF
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-800">${parseFloat(selectedRate.rate).toFixed(2)}</span>
                {selectedRate.list_rate && parseFloat(selectedRate.list_rate) > parseFloat(selectedRate.rate) && (
                  <span className="text-sm text-gray-500 line-through">${parseFloat(selectedRate.list_rate).toFixed(2)}</span>
                )}
              </div>
              <p className="text-sm text-blue-600">{selectedRate.delivery_days} days delivery</p>
            </div>
          )}

          {/* AI Analysis */}
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">AI analyzing rate...</span>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{aiAnalysis.overallScore}/100</div>
                <div className="text-sm text-gray-600">AI Recommendation Score</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">Speed</div>
                  <div className="text-lg font-bold">{aiAnalysis.speedScore}/100</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-medium">Value</div>
                  <div className="text-lg font-bold">{aiAnalysis.costScore}/100</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">AI Recommendation</span>
                </div>
                <p className="text-sm text-gray-700">{aiAnalysis.recommendation}</p>
              </div>
            </div>
          ) : null}

          {/* Alternative Rates */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Alternative Options
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allRates
                .filter(rate => rate.id !== selectedRate?.id)
                .slice(0, 5)
                .map((rate) => (
                <div
                  key={rate.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onRateSelect(rate.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{rate.carrier} {rate.service}</span>
                    {calculateDynamicDiscount(rate) > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {calculateDynamicDiscount(rate)}% OFF
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">${parseFloat(rate.rate).toFixed(2)}</span>
                    <span className="text-xs text-gray-600">{rate.delivery_days} days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIRateSidebar;
