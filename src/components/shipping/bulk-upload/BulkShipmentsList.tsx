
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Package, MapPin, Weight } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import CarrierLogo from '../CarrierLogo';
import { standardizeCarrierName } from '@/utils/carrierUtils';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates?: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRefreshRates: (shipmentId: string) => void;
  onBulkApplyCarrier: (carrierName: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates = false,
  onSelectRate,
  onRefreshRates,
  onBulkApplyCarrier
}) => {
  
  // Get unique carriers with standardized names
  const getUniqueCarriers = () => {
    const carriers = new Set<string>();
    shipments.forEach(shipment => {
      shipment.availableRates?.forEach(rate => {
        carriers.add(standardizeCarrierName(rate.carrier));
      });
    });
    return Array.from(carriers);
  };

  const uniqueCarriers = getUniqueCarriers();

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {uniqueCarriers.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-900">Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-blue-700 font-medium">Apply to all:</span>
              {uniqueCarriers.map(carrier => (
                <Button
                  key={carrier}
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkApplyCarrier(carrier)}
                  className="flex items-center gap-1 text-xs"
                >
                  <CarrierLogo carrier={carrier} className="w-4 h-4" />
                  {carrier}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipments Grid */}
      <div className="grid gap-4">
        {shipments.map((shipment, index) => (
          <Card key={shipment.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Package #{index + 1}
                  {shipment.status === 'pending_rates' && (
                    <Badge variant="secondary" className="text-xs">Loading Rates...</Badge>
                  )}
                  {shipment.status === 'error' && (
                    <Badge variant="destructive" className="text-xs">Error</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefreshRates(shipment.id)}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Shipment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Destination
                  </h4>
                  <p className="text-sm text-gray-600">
                    {shipment.details.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {shipment.details.city}, {shipment.details.state} {shipment.details.zip}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Weight className="w-3 h-3" />
                    Package Info
                  </h4>
                  <p className="text-sm text-gray-600">
                    {shipment.details.parcel_weight} oz
                  </p>
                  <p className="text-sm text-gray-600">
                    {shipment.details.parcel_length}"×{shipment.details.parcel_width}"×{shipment.details.parcel_height}"
                  </p>
                </div>
              </div>

              {/* Rate Selection */}
              {shipment.availableRates && shipment.availableRates.length > 0 ? (
                <div>
                  <h4 className="font-medium text-sm mb-3">Select Shipping Rate:</h4>
                  <div className="grid gap-2">
                    {shipment.availableRates.map((rate) => {
                      const standardizedCarrier = standardizeCarrierName(rate.carrier);
                      const isSelected = shipment.selectedRateId === rate.id;
                      
                      return (
                        <div
                          key={rate.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => onSelectRate(shipment.id, rate.id.toString())}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CarrierLogo carrier={standardizedCarrier} className="w-6 h-6" />
                              <div>
                                <p className="font-medium text-sm">
                                  {standardizedCarrier} {rate.service}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {rate.delivery_days} days delivery
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                ${parseFloat(rate.rate.toString()).toFixed(2)}
                              </p>
                              {rate.original_rate && parseFloat(rate.original_rate.toString()) > parseFloat(rate.rate.toString()) && (
                                <p className="text-xs text-gray-500 line-through">
                                  ${parseFloat(rate.original_rate.toString()).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">
                    {shipment.status === 'pending_rates' 
                      ? 'Loading rates...' 
                      : 'No rates available'
                    }
                  </p>
                </div>
              )}

              {/* Error Display */}
              {shipment.error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{shipment.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BulkShipmentsList;
