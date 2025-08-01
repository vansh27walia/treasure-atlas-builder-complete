
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
    <div className="space-y-6">
      {shipments.map((shipment, index) => (
        <Card key={shipment.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-600">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{shipment.recipient}</h3>
                  <p className="text-sm text-gray-600">Row {shipment.row}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onAIAnalysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAIAnalysis(shipment)}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-pink-100"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    AI Analysis
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(shipment.id)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRefreshRates(shipment.id)}
                  disabled={isFetchingRates}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingRates ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveShipment(shipment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name:</p>
                  <p className="text-sm text-gray-600">{shipment.recipient}</p>
                </div>
                {shipment.details?.address && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address:</p>
                    <p className="text-sm text-gray-600">{shipment.details.address}</p>
                  </div>
                )}
                {shipment.details?.city && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">City:</p>
                    <p className="text-sm text-gray-600">{shipment.details.city}, {shipment.details?.state} {shipment.details?.zip}</p>
                  </div>
                )}
                {shipment.details?.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone:</p>
                    <p className="text-sm text-gray-600">{shipment.details.phone}</p>
                  </div>
                )}
                {shipment.details?.weight && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Weight:</p>
                    <p className="text-sm text-gray-600">{shipment.details.weight} lbs</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Order Number:</p>
                  <p className="text-sm text-gray-600">#{shipment.id.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Current Rate Selection */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Selected Shipping Rate</h4>
              {shipment.selectedRateId && shipment.availableRates ? (
                <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                  {(() => {
                    const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                    return selectedRate ? (
                      <RateDisplay
                        actualRate={selectedRate.rate}
                        carrier={selectedRate.carrier}
                        service={selectedRate.service}
                        deliveryDays={selectedRate.delivery_days}
                      />
                    ) : (
                      <div className="flex items-center space-x-4">
                        <CarrierLogo carrier={shipment.carrier} className="w-12 h-12" />
                        <div>
                          <p className="font-semibold text-lg">{shipment.carrier}</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${parseFloat(shipment.rate?.toString() || '0').toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CarrierLogo carrier={shipment.carrier} className="w-12 h-12" />
                    <div>
                      <p className="font-semibold text-lg">{shipment.carrier}</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${parseFloat(shipment.rate?.toString() || '0').toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Options */}
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-3">Insurance Options</h4>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Package Insurance</p>
                    <p className="text-xs text-blue-700">Protect your shipment up to $100</p>
                  </div>
                  <Badge className="bg-blue-600 text-white">$2.00</Badge>
                </div>
              </div>
            </div>

            {/* Expanded Rate Selection */}
            {expandedShipment === shipment.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Available Shipping Options</h4>
                {shipment.availableRates && shipment.availableRates.length > 0 ? (
                  <Select 
                    value={shipment.selectedRateId} 
                    onValueChange={(rateId) => handleRateSelect(shipment.id, rateId)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a shipping rate" />
                    </SelectTrigger>
                    <SelectContent>
                      {shipment.availableRates.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id}>
                          <div className="flex items-center space-x-3 w-full">
                            <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                            <div className="flex-1">
                              <div className="font-medium">
                                {rate.carrier} - {rate.service}
                              </div>
                              <div className="text-sm text-gray-600">
                                ${parseFloat(rate.rate.toString()).toFixed(2)} • {rate.delivery_days} days delivery
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="mx-auto h-8 w-8 mb-2" />
                    <p>No shipping rates available</p>
                    <p className="text-sm">Click refresh to fetch rates</p>
                  </div>
                )}

                {/* AI Insights for expanded */}
                {shipment.selectedRateId && onAIAnalysis && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">AI Insights Available</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAIAnalysis(shipment)}
                        className="text-purple-600 border-purple-300 hover:bg-purple-100"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        View Analysis
                      </Button>
                    </div>
                    <p className="text-sm text-purple-700 mt-2">
                      Get AI-powered insights and optimization suggestions for this shipment.
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
