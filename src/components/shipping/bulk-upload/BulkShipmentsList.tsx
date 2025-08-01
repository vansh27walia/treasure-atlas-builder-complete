
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trash2, 
  Edit, 
  RefreshCw, 
  Package,
  Brain,
  Sparkles
} from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import CarrierLogo from '../CarrierLogo';
import RateDisplay from './RateDisplay';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis?: (shipment: BulkShipment) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis
}) => {
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  if (!shipments || shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by uploading a CSV file.</p>
      </div>
    );
  }

  const handleRateSelect = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
  };

  const toggleExpanded = (shipmentId: string) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  return (
    <div className="space-y-4">
      {shipments.map((shipment, index) => (
        <Card key={shipment.id} className="overflow-hidden border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Shipment Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{shipment.recipient}</h3>
                    <p className="text-sm text-gray-500">
                      Row {shipment.row} • {shipment.details?.city}, {shipment.details?.state}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Rate Display */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <CarrierLogo carrier={shipment.carrier} className="w-6 h-6" />
                    <div>
                      <p className="font-medium text-sm">{shipment.carrier}</p>
                      <p className="text-lg font-bold text-green-600">
                        ${parseFloat(shipment.rate?.toString() || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  {onAIAnalysis && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAIAnalysis(shipment)}
                      className="h-8 px-2 border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      <Brain className="w-3 h-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(shipment.id)}
                    className="h-8 px-2"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRefreshRates(shipment.id)}
                    disabled={isFetchingRates}
                    className="h-8 px-2"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingRates ? 'animate-spin' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveShipment(shipment.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Expanded Rate Selection */}
            {expandedShipment === shipment.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Rate Selection */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">Available Rates</h4>
                    {shipment.availableRates && shipment.availableRates.length > 0 ? (
                      <Select 
                        value={shipment.selectedRateId} 
                        onValueChange={(rateId) => handleRateSelect(shipment.id, rateId)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {shipment.availableRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id}>
                              <div className="flex items-center gap-2 w-full">
                                <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">
                                    {rate.carrier} - {rate.service}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    ${parseFloat(rate.rate.toString()).toFixed(2)} • {rate.delivery_days} days
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                        No rates available. Click refresh to fetch rates.
                      </div>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">Shipping Details</h4>
                    <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                      <p><strong>To:</strong> {shipment.recipient}</p>
                      {shipment.details?.address && (
                        <p><strong>Address:</strong> {shipment.details.address}</p>
                      )}
                      {shipment.details?.city && shipment.details?.state && (
                        <p>
                          <strong>Location:</strong> {shipment.details.city}, {shipment.details.state} {shipment.details?.zip}
                        </p>
                      )}
                      {shipment.details?.weight && (
                        <p><strong>Weight:</strong> {shipment.details.weight} lbs</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                {shipment.selectedRateId && onAIAnalysis && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">AI Insights Available</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAIAnalysis(shipment)}
                        className="text-purple-600 border-purple-300 hover:bg-purple-100"
                      >
                        <Brain className="w-3 h-3 mr-1" />
                        Analyze
                      </Button>
                    </div>
                    <p className="text-xs text-purple-700 mt-1">
                      Get AI-powered rate analysis and optimization suggestions for this shipment.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
