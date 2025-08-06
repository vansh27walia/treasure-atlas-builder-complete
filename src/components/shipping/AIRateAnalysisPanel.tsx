
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Clock, DollarSign, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface AIRateAnalysisPanelProps {
  selectedRate: any;
  allRates: any[];
  isOpen: boolean;
  onClose: () => void;
  onOptimizationChange: (filter: string) => void;
  onProceedToPayment?: () => void;
  customFormData?: any;
}

const AIRateAnalysisPanel: React.FC<AIRateAnalysisPanelProps> = ({
  selectedRate,
  allRates,
  isOpen,
  onClose,
  onOptimizationChange,
  onProceedToPayment,
  customFormData
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (selectedRate && isOpen) {
      fetchAnalysis();
    }
  }, [selectedRate, isOpen]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rate', {
        body: {
          selectedRate,
          allRates,
          context: {
            totalRates: allRates.length,
            priceRange: {
              min: Math.min(...allRates.map(r => parseFloat(r.rate) * 1.05)),
              max: Math.max(...allRates.map(r => parseFloat(r.rate) * 1.05))
            }
          }
        }
      });

      if (error) throw error;
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('AI Panel closing - resetting layout');
    onClose();
  };

  const handlePayment = () => {
    console.log('Proceeding to payment from AI panel');
    if (onProceedToPayment) {
      onProceedToPayment();
    }
  };

  if (!isOpen) return null;

  // Calculate final price with 5% markup
  const actualRate = parseFloat(selectedRate.rate);
  const finalPrice = actualRate * 1.05;
  const retailRate = selectedRate.retail_rate ? parseFloat(selectedRate.retail_rate) : null;
  const savings = retailRate ? retailRate - finalPrice : 0;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">AI Rate Analysis</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClose}
            className="h-8 w-8 p-0 hover:bg-white/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Rate Summary */}
      <div className="p-4 bg-blue-50 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">{selectedRate.carrier}</span>
          <Badge variant="secondary">{selectedRate.service}</Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">EasyPost Rate:</span>
            <span className="font-medium">${actualRate.toFixed(2)}</span>
          </div>
          
          {retailRate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Retail Price:</span>
              <span className="text-sm line-through text-gray-500">${retailRate.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Processing Fee (5%):</span>
            <span className="text-sm">${(actualRate * 0.05).toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center">
            <span className="font-semibold">Final Price:</span>
            <span className="font-bold text-lg text-green-600">${finalPrice.toFixed(2)}</span>
          </div>
          
          {savings > 0 && (
            <div className="text-sm text-green-600 text-center">
              You save ${savings.toFixed(2)} vs retail!
            </div>
          )}
        </div>
      </div>

      {/* Custom Form Data Display */}
      {customFormData && (
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium text-sm mb-2">Additional Information</h3>
          <div className="space-y-1">
            {Object.entries(customFormData).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span className="font-medium">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimization Controls */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">Optimize Selection</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-6 w-6 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        
        {expanded && (
          <Select onValueChange={onOptimizationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose optimization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cheapest">Cheapest Option</SelectItem>
              <SelectItem value="fastest">Fastest Delivery</SelectItem>
              <SelectItem value="balanced">Best Balance</SelectItem>
              <SelectItem value="most-reliable">Most Reliable</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Analysis Results */}
      {loading ? (
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ) : analysis && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{analysis.reliabilityScore}</div>
              <div className="text-xs text-gray-600">Reliability</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{analysis.speedScore}</div>
              <div className="text-xs text-gray-600">Speed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{analysis.costScore}</div>
              <div className="text-xs text-gray-600">Value</div>
            </div>
          </div>
          
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-purple-50">
            <p className="text-sm text-gray-700">{analysis.recommendation}</p>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="sticky bottom-0 p-4 bg-white border-t space-y-3">
        <Button 
          onClick={handlePayment}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Pay ${finalPrice.toFixed(2)} & Create Label
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleClose}
          className="w-full"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  );
};

export default AIRateAnalysisPanel;
