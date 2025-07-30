import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Truck, 
  Clock, 
  DollarSign, 
  Shield, 
  RefreshCw, 
  Star,
  Brain,
  Info,
  Calculator
} from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import CarrierLogo from '../CarrierLogo';
import AIRateAnalysisPanel from '../AIRateAnalysisPanel';
import { toast } from '@/components/ui/sonner';

interface EnhancedBulkRateDisplayProps {
  shipment: BulkShipment;
  onRateSelect: (shipmentId: string, rateId: string) => void;
  onRefreshRates: (shipmentId: string) => void;
  isRefreshing: boolean;
  itemValue?: number;
}

const EnhancedBulkRateDisplay: React.FC<EnhancedBulkRateDisplayProps> = ({
  shipment,
  onRateSelect,
  onRefreshRates,
  isRefreshing,
  itemValue = 100
}) => {
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState(null);
  const [showAllRates, setShowAllRates] = useState(false);

  // Calculate insurance cost: $2 for every $100 of item value
  const calculateInsuranceCost = (value: number) => {
    return Math.max(2, Math.ceil((value / 100) * 2));
  };

  const insuranceCost = calculateInsuranceCost(itemValue);

  // Auto-open AI panel when rates are available
  useEffect(() => {
    if (shipment.availableRates && shipment.availableRates.length > 0 && !showAIPanel) {
      setShowAIPanel(true);
      if (shipment.availableRates[0] && !selectedRate) {
        setSelectedRate(shipment.availableRates[0]);
      }
    }
  }, [shipment.availableRates, showAIPanel, selectedRate]);

  const handleRateSelect = (rateId: string) => {
    const rate = shipment.availableRates?.find(r => r.id === rateId);
    if (rate) {
      setSelectedRate(rate);
      setShowAIPanel(true);
      onRateSelect(shipment.id, rateId);
    }
  };

  const handleProceedToPayment = () => {
    setShowAIPanel(false);
    // Trigger payment flow
    toast.success('Proceeding to payment...');
  };

  const handleOptimizationChange = (filter: string) => {
    if (!shipment.availableRates) return;
    
    let sortedRates = [...shipment.availableRates];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate.toString()) - parseFloat(b.rate.toString()));
        break;
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'balanced':
        sortedRates.sort((a, b) => {
          const scoreA = (parseFloat(a.rate.toString()) / 10) + (a.delivery_days || 999);
          const scoreB = (parseFloat(b.rate.toString()) / 10) + (b.delivery_days || 999);
          return scoreA - scoreB;
        });
        break;
    }
    
    if (sortedRates.length > 0) {
      handleRateSelect(sortedRates[0].id);
    }
  };

  if (!shipment.availableRates || shipment.availableRates.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">No rates available</h4>
                <p className="text-sm text-gray-500">
                  {shipment.details.name} - {shipment.details.city}, {shipment.details.state}
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => onRefreshRates(shipment.id)}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentRate = selectedRate || shipment.availableRates.find(r => r.id === shipment.selectedRateId) || shipment.availableRates[0];
  const otherRates = shipment.availableRates.filter(r => r.id !== currentRate?.id);
  const shippingCost = parseFloat(currentRate?.rate?.toString() || '0');
  const totalCost = shippingCost + insuranceCost;

  return (
    <div className={`transition-all duration-300 ${showAIPanel ? 'pr-80' : ''}`}>
      <Card className="mb-4 relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">
                  {shipment.details.name}
                </CardTitle>
                <p className="text-sm text-gray-500">
                  {shipment.details.city}, {shipment.details.state} {shipment.details.zip}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowAIPanel(true)}
                variant="ghost"
                size="sm"
                className="text-purple-600 hover:bg-purple-50"
              >
                <Brain className="w-4 h-4 mr-1" />
                AI Analysis
              </Button>
              
              <Button
                onClick={() => onRefreshRates(shipment.id)}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Selected Rate - Prominent Display */}
          <div className="mb-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CarrierLogo carrier={currentRate?.carrier || ''} className="w-12 h-12" />
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-lg text-blue-800">
                        {currentRate?.carrier}
                      </h4>
                      <Badge className="bg-blue-600 text-white">SELECTED</Badge>
                      {currentRate?.delivery_days <= 2 && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Express
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-blue-700 mb-1">
                      {currentRate?.service}
                    </p>
                    <div className="flex items-center text-sm text-blue-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{currentRate?.delivery_days || 'N/A'} business days</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-end text-sm">
                      <span className="text-gray-600 mr-2">Shipping:</span>
                      <span className="font-medium">${shippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-end text-sm">
                      <Shield className="w-3 h-3 text-green-600 mr-1" />
                      <span className="text-gray-600 mr-2">Insurance (${itemValue}):</span>
                      <span className="font-medium text-green-600">${insuranceCost.toFixed(2)}</span>
                    </div>
                    <hr className="my-1" />
                    <div className="flex items-center justify-end">
                      <span className="text-lg font-bold text-blue-800">
                        Total: ${totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Insurance: $2 per $100 value
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rate Selector Dropdown */}
          {shipment.availableRates.length > 1 && (
            <div className="mb-4">
              <Select value={currentRate?.id} onValueChange={handleRateSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose shipping rate" />
                </SelectTrigger>
                <SelectContent>
                  {shipment.availableRates.map((rate) => (
                    <SelectItem key={rate.id} value={rate.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                          <span className="font-medium">
                            {rate.carrier} {rate.service}
                          </span>
                        </div>
                        <div className="text-right text-sm">
                          <div>${(parseFloat(rate.rate.toString()) + insuranceCost).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            {rate.delivery_days} days
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Other Rates - Collapsible */}
          {otherRates.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowAllRates(!showAllRates)}
                className="w-full text-sm"
                size="sm"
              >
                {showAllRates ? 'Hide' : 'View'} {otherRates.length} Other Options
              </Button>
              
              {showAllRates && (
                <div className="space-y-2">
                  {otherRates.map((rate) => {
                    const rateCost = parseFloat(rate.rate.toString());
                    const rateTotal = rateCost + insuranceCost;
                    
                    return (
                      <div
                        key={rate.id}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleRateSelect(rate.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                            <div>
                              <h5 className="font-medium text-gray-900">
                                {rate.carrier}
                              </h5>
                              <p className="text-sm text-gray-600">
                                {rate.service}
                              </p>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {rate.delivery_days} days
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-gray-900">
                              ${rateTotal.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              +${insuranceCost} insurance
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Proceed to Payment */}
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={handleProceedToPayment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Proceed to Payment - ${totalCost.toFixed(2)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Panel */}
      {showAIPanel && currentRate && (
        <AIRateAnalysisPanel
          selectedRate={currentRate}
          allRates={shipment.availableRates || []}
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          onOptimizationChange={handleOptimizationChange}
        />
      )}
    </div>
  );
};

export default EnhancedBulkRateDisplay;
