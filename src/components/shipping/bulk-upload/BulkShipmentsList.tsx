import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Package, Truck, Edit, FileText } from 'lucide-react';
import { BulkShipment, Rate } from '@/types/shipping';
import CustomsDocumentationModal from '../CustomsDocumentationModal';
import type { CustomsInfo } from '@/types/shipping';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onRateSelect: (shipmentId: string, rateId: string) => void;
  onEditShipment?: (shipmentId: string) => void;
  pickupAddress?: any;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  selectedShipments?: string[];
  onShipmentSelect?: (shipmentId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  filters?: any;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onRateSelect,
  onEditShipment,
  pickupAddress,
  sortField,
  sortDirection,
  onSort,
  selectedShipments,
  onShipmentSelect,
  onSelectAll,
  filters
}) => {
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [selectedShipmentForCustoms, setSelectedShipmentForCustoms] = useState<string | null>(null);

  const isInternationalShipment = (shipment: BulkShipment, fromCountry: string) => {
    const toCountry = shipment.details?.to_address?.country || 'US';
    return fromCountry !== toCountry;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rates_fetched':
      case 'rate_selected':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rates_fetched':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>;
      case 'rate_selected':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Rate Selected</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'error':
      case 'failed':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending_rates':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">Processing</Badge>;
    }
  };

  const handleCustomsClick = (shipmentId: string) => {
    setSelectedShipmentForCustoms(shipmentId);
    setCustomsModalOpen(true);
  };

  const handleCustomsSubmit = (customsData: CustomsInfo) => {
    if (selectedShipmentForCustoms) {
      // Update the shipment with customs information
      const shipmentIndex = shipments.findIndex(s => s.id === selectedShipmentForCustoms);
      if (shipmentIndex >= 0) {
        const updatedShipments = [...shipments];
        updatedShipments[shipmentIndex] = {
          ...updatedShipments[shipmentIndex],
          customs_info: customsData
        };
        // Note: You may need to pass this update back to parent component
        // For now, we'll just close the modal
      }
    }
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  const handleCustomsClose = () => {
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  const getCurrentShipmentForCustoms = () => {
    return shipments.find(s => s.id === selectedShipmentForCustoms);
  };

  const getFromCountry = () => {
    return pickupAddress?.country || 'US';
  };

  const getToCountry = (shipment: BulkShipment) => {
    return shipment.details?.to_address?.country || 'US';
  };

  const filteredShipments = shipments.filter(shipment => {
    if (!filters) return true;
    
    if (filters.status && filters.status !== 'all' && shipment.status !== filters.status) {
      return false;
    }
    
    if (filters.carrier && filters.carrier !== 'all' && shipment.carrier !== filters.carrier) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Shipments ({filteredShipments.length})</h3>
          {onSelectAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectAll(selectedShipments?.length !== filteredShipments.length)}
            >
              {selectedShipments?.length === filteredShipments.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {filteredShipments.map((shipment) => (
        <Card key={shipment.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {onShipmentSelect && (
                  <input
                    type="checkbox"
                    checked={selectedShipments?.includes(shipment.id) || false}
                    onChange={(e) => onShipmentSelect(shipment.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                )}
                
                {getStatusIcon(shipment.status)}
                
                <div>
                  <h4 className="font-medium">
                    {shipment.details?.to_address?.name || shipment.recipient || `Shipment ${shipment.row || ''}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {shipment.details?.to_address?.city}, {shipment.details?.to_address?.state} {shipment.details?.to_address?.zip}
                  </p>
                  {shipment.tracking_code && (
                    <p className="text-xs text-blue-600 font-mono">
                      {shipment.tracking_code}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusBadge(shipment.status)}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditShipment?.(shipment.id)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>

                {isInternationalShipment(shipment, getFromCountry()) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCustomsClick(shipment.id)}
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Customs Information
                  </Button>
                )}
              </div>
            </div>

            {shipment.status === 'error' && shipment.error && (
              <div className="mt-3 p-3 bg-red-50 rounded-md">
                <p className="text-sm text-red-600">
                  Error: {shipment.error}
                </p>
              </div>
            )}

            {shipment.status === 'rates_fetched' && shipment.availableRates && shipment.availableRates.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Available Rates:</span>
                </div>
                
                <Select
                  value={shipment.selectedRateId || ''}
                  onValueChange={(value) => onRateSelect(shipment.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a shipping rate" />
                  </SelectTrigger>
                  <SelectContent>
                    {shipment.availableRates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">{rate.carrier}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              {rate.service}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">${parseFloat(rate.rate).toFixed(2)}</span>
                            {rate.delivery_days && (
                              <div className="text-xs text-gray-500">
                                {rate.delivery_days} days
                              </div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {shipment.selectedRateId && shipment.availableRates && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                {(() => {
                  const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                  return selectedRate ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{selectedRate.carrier} {selectedRate.service}</span>
                        {selectedRate.delivery_days && (
                          <span className="text-sm text-gray-600 ml-2">
                            ({selectedRate.delivery_days} days)
                          </span>
                        )}
                      </div>
                      <span className="font-medium text-blue-600">
                        ${parseFloat(selectedRate.rate).toFixed(2)}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {selectedShipmentForCustoms && (
        <CustomsDocumentationModal
          isOpen={customsModalOpen}
          onClose={handleCustomsClose}
          onSubmit={handleCustomsSubmit}
          fromCountry={getFromCountry()}
          toCountry={getToCountry(getCurrentShipmentForCustoms()!)}
          initialData={getCurrentShipmentForCustoms()?.customs_info}
        />
      )}
    </div>
  );
};

export default BulkShipmentsList;
