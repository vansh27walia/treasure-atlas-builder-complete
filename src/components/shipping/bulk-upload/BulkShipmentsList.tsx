
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Edit, Trash2, RefreshCw, Package, Truck } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import ShippingRateDropdown from '@/components/shipping/ShippingRateDropdown';
import { toast } from '@/components/ui/sonner';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates
}) => {
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);

  const handleRateSelect = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
    toast.success('Rate selected successfully');
  };

  const getAddressString = (address: any) => {
    if (typeof address === 'string') return address;
    if (!address) return 'N/A';
    return `${address.street1 || ''}, ${address.city || ''}, ${address.state_province || ''} ${address.postal_code || ''}`.trim();
  };

  // Convert Rate[] to ShippingRate[] format
  const convertRatesToShippingRates = (rates: any[] = []) => {
    return rates.map(rate => ({
      ...rate,
      rate: rate.rate?.toString() || '0', // Convert number to string
      delivery_days: rate.delivery_days || 0,
      delivery_date: rate.delivery_date || null,
      delivery_date_guaranteed: rate.delivery_date_guaranteed || false
    }));
  };

  const shipmentsWithRates = shipments.filter(s => s.selectedRateId).length;
  const totalShipments = shipments.length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-900">Review Your Shipments</h3>
              <p className="text-blue-700">Select rates for each shipment before proceeding to payment</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">{shipmentsWithRates}/{totalShipments}</div>
            <div className="text-sm text-blue-600">Rates Selected</div>
          </div>
        </div>
        
        {shipmentsWithRates < totalShipments && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-800">
                Please select rates for all {totalShipments - shipmentsWithRates} remaining shipments
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Shipments List */}
      <div className="space-y-4">
        {shipments.map((shipment, index) => (
          <Card key={shipment.id} className={`transition-all duration-200 ${
            shipment.selectedRateId ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    shipment.selectedRateId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{shipment.customer_name || shipment.recipient}</div>
                    <div className="text-sm font-normal text-gray-600">
                      {getAddressString(shipment.customer_address)}
                    </div>
                  </div>
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  {shipment.selectedRateId && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Rate Selected
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedShipment(
                      expandedShipment === shipment.id ? null : shipment.id
                    )}
                  >
                    {expandedShipment === shipment.id ? 'Collapse' : 'Expand'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Rate Selection */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Select Shipping Rate</span>
                </div>
                
                <ShippingRateDropdown
                  rates={convertRatesToShippingRates(shipment.availableRates)}
                  selectedRateId={shipment.selectedRateId}
                  onSelectRate={(rateId) => handleRateSelect(shipment.id, rateId)}
                  isLoading={isFetchingRates}
                  className="w-full"
                />
              </div>

              {/* Expanded Details */}
              {expandedShipment === shipment.id && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Weight:</span>
                      <div className="text-gray-600">{shipment.details?.weight_oz || 'N/A'} oz</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dimensions:</span>
                      <div className="text-gray-600">
                        {shipment.details?.length || 'N/A'} × {shipment.details?.width || 'N/A'} × {shipment.details?.height || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Value:</span>
                      <div className="text-gray-600">${shipment.details?.value || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Row:</span>
                      <div className="text-gray-600">#{shipment.row}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRefreshRates(shipment.id)}
                      disabled={isFetchingRates}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isFetchingRates ? 'animate-spin' : ''}`} />
                      Refresh Rates
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditShipment(shipment.id, shipment.details)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveShipment(shipment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {shipments.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipments Found</h3>
          <p className="text-gray-600">Upload a CSV file to get started with batch shipping labels.</p>
        </div>
      )}
    </div>
  );
};

export default BulkShipmentsList;
