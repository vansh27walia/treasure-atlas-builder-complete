
import React from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, RefreshCcw, Edit, Package, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipment: BulkShipment) => void;
  onRefreshRates: (shipmentId: string) => void;
  onRateSelectionAndLabel?: (shipmentId: string, rateId: string) => void; // Optional combined handler
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onRateSelectionAndLabel
}) => {
  if (shipments.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <p className="text-gray-500">No shipments found with the current filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map(shipment => (
        <Card key={shipment.id} className="p-4 border shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Shipment info */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold">{shipment.to_address?.name || 'Unnamed Recipient'}</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEditShipment(shipment)} 
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onRemoveShipment(shipment.id)} 
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-gray-600">To:</span> {shipment.to_address?.street1}, {shipment.to_address?.city}, {shipment.to_address?.state} {shipment.to_address?.zip}
                </div>
                <div>
                  <span className="text-gray-600">From:</span> {shipment.from_address?.city}, {shipment.from_address?.state}
                </div>
                <div>
                  <span className="text-gray-600">Package:</span> {shipment.parcel?.weight}oz, {shipment.parcel?.length}×{shipment.parcel?.width}×{shipment.parcel?.height} in
                </div>
                <div>
                  <span className="text-gray-600">Reference:</span> {shipment.reference || 'N/A'}
                </div>
              </div>
              
              {shipment.error && (
                <div className="mt-2 text-red-600 text-sm">{shipment.error}</div>
              )}
              
              {shipment.label_url && (
                <div className="mt-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    <Check className="mr-1 h-3 w-3" /> Label Created
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Rates selection */}
            <div className="lg:w-1/2 border-t lg:border-t-0 lg:border-l pt-3 lg:pt-0 lg:pl-4 flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm">Shipping Options</h4>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRefreshRates(shipment.id)}
                  disabled={isFetchingRates}
                  className="h-8 text-xs"
                >
                  <RefreshCcw className={`h-3 w-3 mr-1 ${isFetchingRates ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              {shipment.isLoadingRates ? (
                <div className="text-center py-3 text-sm text-gray-500">
                  Loading rates...
                </div>
              ) : shipment.availableRates && shipment.availableRates.length > 0 ? (
                <div className="space-y-2 overflow-y-auto max-h-[150px] pr-2">
                  {shipment.availableRates.map(rate => (
                    <div 
                      key={rate.id} 
                      className={`border rounded-md p-2 text-xs cursor-pointer transition-colors ${shipment.selected_rate_id === rate.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => onSelectRate(shipment.id, rate.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{rate.carrier} {rate.service}</div>
                          <div className="text-gray-600">{rate.delivery_days ? `${rate.delivery_days} day${rate.delivery_days !== 1 ? 's' : ''}` : 'Delivery time varies'}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${parseFloat(rate.rate).toFixed(2)}</div>
                          
                          {shipment.selected_rate_id === rate.id && !shipment.label_url && (
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="mt-2 h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRateSelectionAndLabel) {
                                  onRateSelectionAndLabel(shipment.id, rate.id);
                                }
                              }}
                              disabled={shipment.isGeneratingLabel}
                            >
                              <Package className="h-3 w-3 mr-1" />
                              {shipment.isGeneratingLabel ? 'Creating...' : 'Create Label'}
                            </Button>
                          )}
                          
                          {shipment.selected_rate_id === rate.id && shipment.label_url && (
                            <Badge className="mt-1 bg-green-100 text-green-800">
                              <Check className="mr-1 h-3 w-3" /> Label Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-sm text-gray-500">
                  {shipment.availableRates?.length === 0 ? 'No shipping rates available' : 'Select "Refresh" to get shipping rates'}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
