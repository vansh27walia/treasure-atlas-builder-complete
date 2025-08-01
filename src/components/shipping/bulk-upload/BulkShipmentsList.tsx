import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RefreshCw, Edit, Eye, Brain } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import CarrierLogo from '../CarrierLogo';
import { toast } from '@/components/ui/sonner';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onShipmentUpdate: (shipmentId: string, updates: any) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => Promise<void>;
  onShipmentSelect?: (shipment: BulkShipment) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onShipmentUpdate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onShipmentSelect
}) => {
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set());

  const toggleExpanded = (shipmentId: string) => {
    const newExpanded = new Set(expandedShipments);
    if (newExpanded.has(shipmentId)) {
      newExpanded.delete(shipmentId);
    } else {
      newExpanded.add(shipmentId);
    }
    setExpandedShipments(newExpanded);
  };

  const handleRateSelect = (shipmentId: string, rateId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment?.availableRates) return;

    const selectedRate = shipment.availableRates.find(rate => rate.id === rateId);
    if (selectedRate) {
      onShipmentUpdate(shipmentId, {
        selectedRateId: rateId,
        carrier: selectedRate.carrier,
        service: selectedRate.service,
        rate: parseFloat(selectedRate.rate.toString())
      });
      toast.success('Rate updated successfully');
    }
  };

  const handleAIAnalysis = (shipment: BulkShipment) => {
    if (onShipmentSelect) {
      onShipmentSelect(shipment);
    }
  };

  const getAddressDisplay = (details: any) => {
    return `${details.name}, ${details.street1}, ${details.city}, ${details.state} ${details.zip}, ${details.country}`;
  };

  return (
    <div className="space-y-4">
      {shipments.map((shipment, index) => {
        const isExpanded = expandedShipments.has(shipment.id);
        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);

        return (
          <Card key={shipment.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
            
            <div className="bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    <div className="text-sm font-semibold text-gray-900">
                      {shipment.details.name}
                    </div>
                    {shipment.status === 'processing' && (
                      <Badge variant="secondary">Processing</Badge>
                    )}
                    {shipment.status === 'error' && (
                      <Badge variant="destructive">Error</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIAnalysis(shipment)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                  >
                    <Brain className="w-4 h-4 mr-1" />
                    AI Analysis
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(shipment.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    {isExpanded ? 'Hide' : 'Details'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRefreshRates(shipment.id)}
                    disabled={isFetchingRates}
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isFetchingRates ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditShipment(shipment.id, shipment.details)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onRemoveShipment(shipment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Shipping To
                  </h4>
                  <p className="text-xs text-gray-600">
                    {getAddressDisplay(shipment.details)}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Rate Selection
                  </h4>
                  {shipment.availableRates && shipment.availableRates.length > 0 ? (
                    <Select
                      value={shipment.selectedRateId || ''}
                      onValueChange={(rateId) => handleRateSelect(shipment.id, rateId)}
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Select rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipment.availableRates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id} className="text-xs">
                            <div className="flex items-center space-x-2">
                              <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                              <span>{rate.carrier} - {rate.service} (${rate.rate})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-gray-500">No rates available</p>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Shipment Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">
                        Length: {shipment.details.parcel_length} inches
                      </p>
                      <p className="text-xs text-gray-600">
                        Width: {shipment.details.parcel_width} inches
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">
                        Height: {shipment.details.parcel_height} inches
                      </p>
                      <p className="text-xs text-gray-600">
                        Weight: {shipment.details.parcel_weight} lbs
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default BulkShipmentsList;
