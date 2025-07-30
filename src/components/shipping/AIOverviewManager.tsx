
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Brain, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AIOverviewManagerProps {
  isVisible: boolean;
  context: 'normal' | 'bulk';
  selectedRate?: any;
  allRates?: any[];
  onClose: () => void;
  onManualDismiss: () => void;
  triggers?: {
    ratesFetched?: boolean;
    rateSelected?: boolean;
    paymentEntered?: boolean;
  };
}

const AIOverviewManager: React.FC<AIOverviewManagerProps> = ({
  isVisible,
  context,
  selectedRate,
  allRates = [],
  onClose,
  onManualDismiss,
  triggers = {}
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isManuallyDismissed, setIsManuallyDismissed] = useState(false);
  const [shouldAutoShow, setShouldAutoShow] = useState(false);

  // Handle triggers for auto-showing
  useEffect(() => {
    if (triggers.ratesFetched && !isManuallyDismissed) {
      setShouldAutoShow(true);
    }
  }, [triggers.ratesFetched, isManuallyDismissed]);

  // Hide during payment entry
  useEffect(() => {
    if (triggers.paymentEntered) {
      setShouldAutoShow(false);
    }
  }, [triggers.paymentEntered]);

  const handleManualClose = () => {
    setIsManuallyDismissed(true);
    setShouldAutoShow(false);
    onManualDismiss();
  };

  const getAIInsights = () => {
    if (!allRates.length) return null;

    const cheapest = allRates.reduce((prev, current) => 
      parseFloat(prev.rate) < parseFloat(current.rate) ? prev : current
    );
    
    const fastest = allRates.reduce((prev, current) => 
      (prev.delivery_days || 999) < (current.delivery_days || 999) ? prev : current
    );

    return {
      totalRates: allRates.length,
      cheapestRate: cheapest,
      fastestRate: fastest,
      averagePrice: (allRates.reduce((sum, rate) => sum + parseFloat(rate.rate), 0) / allRates.length).toFixed(2)
    };
  };

  if (!isVisible || isManuallyDismissed || (!shouldAutoShow && !triggers.rateSelected)) {
    return null;
  }

  const insights = getAIInsights();

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-600 rounded-full">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900">AI Overview</h3>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Smart
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 text-blue-600"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualClose}
                className="h-6 w-6 p-0 text-gray-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="space-y-3">
              {/* Context-specific content */}
              {context === 'normal' && selectedRate && (
                <div className="bg-white/70 p-3 rounded-lg border">
                  <h4 className="font-medium text-gray-800 mb-2">Selected Rate Analysis</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Carrier:</span>
                      <span className="font-medium">{selectedRate.carrier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span className="font-medium">${parseFloat(selectedRate.rate).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span className="font-medium">{selectedRate.delivery_days} days</span>
                    </div>
                  </div>
                </div>
              )}

              {insights && (
                <div className="bg-white/70 p-3 rounded-lg border space-y-2">
                  <h4 className="font-medium text-gray-800">Quick Insights</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-green-100 rounded">
                      <div className="font-bold text-green-800">${parseFloat(insights.cheapestRate.rate).toFixed(2)}</div>
                      <div className="text-green-600">Cheapest</div>
                    </div>
                    <div className="text-center p-2 bg-blue-100 rounded">
                      <div className="font-bold text-blue-800">{insights.fastestRate.delivery_days} days</div>
                      <div className="text-blue-600">Fastest</div>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-600">
                    {insights.totalRates} rates • Avg: ${insights.averagePrice}
                  </div>
                </div>
              )}

              {context === 'bulk' && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <h4 className="font-medium text-amber-800 mb-1">Bulk Processing</h4>
                  <p className="text-xs text-amber-700">
                    AI is optimizing rates across all shipments for best value.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIOverviewManager;
