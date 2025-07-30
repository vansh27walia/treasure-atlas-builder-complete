
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Check, AlertCircle, Zap, Star } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import DynamicDiscountBadge from '@/components/shipping/DynamicDiscountBadge';
import AIRatePicker from './AIRatePicker';
import { toast } from '@/components/ui/sonner';

interface EnhancedRateFetchingDisplayProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onFetchRates: (shipments: BulkShipment[]) => void;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRefreshRates: (shipmentId: string) => void;
  onBulkApplyCarrier: (carrier: string) => void;
}

const EnhancedRateFetchingDisplay: React.FC<EnhancedRateFetchingDisplayProps> = ({
  shipments,
  isFetchingRates,
  onFetchRates,
  onSelectRate,
  onRefreshRates,
  onBulkApplyCarrier
}) => {
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4" />;
      case 'processing': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <RefreshCw className="w-4 h-4" />;
    }
  };

  const handleApplyAISelection = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
    toast.success('AI recommendation applied');
  };

  const formatRate = (rate: any) => {
    const numericRate = typeof rate === 'string' ? parseFloat(rate) : Number(rate);
    return numericRate.toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* AI Rate Picker */}
      <AIRatePicker 
        shipments={shipments}
        onApplyAISelection={handleApplyAISelection}
      />

      {/* Fetch Rates Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => onFetchRates(shipments)}
          disabled={isFetchingRates || shipments.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          {isFetchingRates ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Fetching Live Rates...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Get Live Shipping Rates
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Shipments Display */}
      <div className="grid gap-4">
        {shipments.map((shipment) => (
          <Card key={shipment.id} className="border-2 hover:border-blue-200 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-3">
                  <span>{shipment.customer_name || shipment.recipient}</span>
                  <Badge className={`${getStatusColor(shipment.status)} flex items-center space-x-1`}>
                    {getStatusIcon(shipment.status)}
                    <span className="capitalize">{shipment.status}</span>
                  </Badge>
                </CardTitle>
                
                <div className="flex items-center space-x-2">
                  {shipment.availableRates && shipment.availableRates.length > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {shipment.availableRates.length} rates available
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedShipment(
                      expandedShipment === shipment.id ? null : shipment.id
                    )}
                  >
                    {expandedShipment === shipment.id ? 'Collapse' : 'View Rates'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600">Destination</div>
                  <div className="font-medium text-sm">
                    {shipment.customer_address || `${shipment.details?.city}, ${shipment.details?.state}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Weight</div>
                  <div className="font-medium">{shipment.details?.parcel_weight || 'N/A'} lbs</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Selected Rate</div>
                  <div className="font-bold text-lg text-green-600">
                    ${shipment.rate?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Carrier</div>
                  <div className="font-medium flex items-center space-x-2">
                    <span>{shipment.carrier}</span>
                    {shipment.selectedRateId && shipment.availableRates && (
                      <DynamicDiscountBadge 
                        rate={shipment.availableRates.find(r => r.id === shipment.selectedRateId)} 
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Rate Details */}
              {expandedShipment === shipment.id && shipment.availableRates && (
                <div className="border-t pt-4">
                  <div className="grid gap-3">
                    {shipment.availableRates.map((rate) => (
                      <div
                        key={rate.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          shipment.selectedRateId === rate.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => onSelectRate(shipment.id, rate.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-semibold text-lg">
                                {rate.carrier} - {rate.service}
                              </div>
                              <div className="text-sm text-gray-600">
                                {rate.delivery_days} business days
                              </div>
                            </div>
                            {shipment.selectedRateId === rate.id && (
                              <Star className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          
                          <div className="text-right flex items-center space-x-3">
                            <DynamicDiscountBadge rate={rate} />
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                ${formatRate(rate.rate)}
                              </div>
                              {rate.list_rate && parseFloat(rate.list_rate.toString()) > parseFloat(rate.rate.toString()) && (
                                <div className="text-sm text-gray-500 line-through">
                                  ${formatRate(rate.list_rate)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EnhancedRateFetchingDisplay;
