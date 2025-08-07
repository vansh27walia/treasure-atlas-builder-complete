
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit3, Save, X, Package, MapPin, Clock, DollarSign } from 'lucide-react';
import CarrierLogo from '@/components/shipping/CarrierLogo';
import { standardizeCarrierName, standardizeServiceName } from '@/utils/carrierUtils';
import { BulkShipment } from '@/types/shipping';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onShipmentUpdate: (index: number, updatedShipment: BulkShipment) => void;
  onShipmentRemove: (index: number) => void;
  selectedShipments: number[];
  onShipmentToggle: (index: number) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments = [], // Add default empty array
  onShipmentUpdate,
  onShipmentRemove,
  selectedShipments = [], // Add default empty array
  onShipmentToggle,
  onSelectAll,
  allSelected = false // Add default value
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempShipment, setTempShipment] = useState<BulkShipment | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setTempShipment({ ...shipments[index] });
  };

  const handleSave = (index: number) => {
    if (tempShipment) {
      onShipmentUpdate(index, tempShipment);
    }
    setEditingIndex(null);
    setTempShipment(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setTempShipment(null);
  };

  const handleRateSelection = (shipmentIndex: number, rateId: string) => {
    const shipment = shipments[shipmentIndex];
    const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
    
    if (selectedRate) {
      const updatedShipment = {
        ...shipment,
        selectedRateId: selectedRate.id,
        rate: parseFloat(selectedRate.rate.toString()),
        carrier: selectedRate.carrier,
        service: selectedRate.service
      };
      onShipmentUpdate(shipmentIndex, updatedShipment);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'rates_fetched':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Processed</Badge>;
      case 'error':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    }
  };

  const getSelectedRate = (shipment: BulkShipment) => {
    if (!shipment.availableRates || !shipment.selectedRateId) return null;
    return shipment.availableRates.find(rate => rate.id === shipment.selectedRateId);
  };

  const EditableShipmentRow = ({ shipment, onChange }: { shipment: BulkShipment, onChange: (shipment: BulkShipment) => void }) => {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Customer Name</label>
            <Input
              value={shipment.customer_name || ''}
              onChange={(e) => onChange({ ...shipment, customer_name: e.target.value })}
              placeholder="Customer Name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Weight (oz)</label>
            <Input
              type="number"
              value={shipment.details?.parcel?.weight || 1}
              onChange={(e) => onChange({
                ...shipment,
                details: {
                  ...shipment.details,
                  parcel: {
                    ...shipment.details?.parcel,
                    weight: parseFloat(e.target.value)
                  }
                }
              })}
              placeholder="Weight"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Length</label>
            <Input
              type="number"
              value={shipment.details?.parcel?.length || 1}
              onChange={(e) => onChange({
                ...shipment,
                details: {
                  ...shipment.details,
                  parcel: {
                    ...shipment.details?.parcel,
                    length: parseFloat(e.target.value)
                  }
                }
              })}
              placeholder="L"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Width</label>
            <Input
              type="number"
              value={shipment.details?.parcel?.width || 1}
              onChange={(e) => onChange({
                ...shipment,
                details: {
                  ...shipment.details,
                  parcel: {
                    ...shipment.details?.parcel,
                    width: parseFloat(e.target.value)
                  }
                }
              })}
              placeholder="W"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Height</label>
            <Input
              type="number"
              value={shipment.details?.parcel?.height || 1}
              onChange={(e) => onChange({
                ...shipment,
                details: {
                  ...shipment.details,
                  parcel: {
                    ...shipment.details?.parcel,
                    height: parseFloat(e.target.value)
                  }
                }
              })}
              placeholder="H"
            />
          </div>
        </div>
      </div>
    );
  };

  // Add safety check for shipments array
  if (!shipments) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipments (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Loading shipments...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Shipments ({shipments.length})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onSelectAll}
              id="select-all"
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              Select All
            </label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {shipments.map((shipment, index) => (
          <div
            key={shipment.id}
            className={`p-4 border rounded-lg transition-colors ${
              selectedShipments.includes(index) 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-200 bg-white'
            }`}
          >
            {editingIndex === index ? (
              <div className="space-y-4">
                <EditableShipmentRow
                  shipment={tempShipment!}
                  onChange={setTempShipment}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => handleSave(index)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header with checkbox and actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedShipments.includes(index)}
                      onCheckedChange={() => onShipmentToggle(index)}
                    />
                    <div>
                      <div className="font-medium text-gray-900">Shipment #{index + 1}</div>
                      {getStatusBadge(shipment.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onShipmentRemove(index)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Addresses and Package Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* From Address - using pickup address or first available */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      From
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">
                        {shipment.details?.from_address?.name || 'Pickup Address'}
                      </div>
                      <div>{shipment.details?.from_address?.street1 || 'Default pickup location'}</div>
                      <div>
                        {shipment.details?.from_address?.city || 'City'}, {shipment.details?.from_address?.state || 'ST'} {shipment.details?.from_address?.zip || '00000'}
                      </div>
                    </div>
                  </div>

                  {/* To Address */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      To
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{shipment.details?.to_address?.name || shipment.customer_name || 'N/A'}</div>
                      <div>{shipment.details?.to_address?.street1}</div>
                      <div>
                        {shipment.details?.to_address?.city}, {shipment.details?.to_address?.state} {shipment.details?.to_address?.zip}
                      </div>
                    </div>
                  </div>

                  {/* Package Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <Package className="w-4 h-4" />
                      Package
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>
                        {shipment.details?.parcel?.length || 0}"×{shipment.details?.parcel?.width || 0}"×{shipment.details?.parcel?.height || 0}"
                      </div>
                      <div>{shipment.details?.parcel?.weight || 0} oz</div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {shipment.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{shipment.error}</p>
                  </div>
                )}

                {/* Rates Selection */}
                {shipment.availableRates && shipment.availableRates.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      Available Rates
                    </div>
                    
                    {/* Rate Selector */}
                    <Select 
                      value={shipment.selectedRateId || ''} 
                      onValueChange={(value) => handleRateSelection(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a shipping rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipment.availableRates.map((rate) => {
                          const standardizedCarrier = standardizeCarrierName(rate.carrier);
                          const standardizedService = standardizeServiceName(rate.service, standardizedCarrier);
                          const rateValue = typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate;
                          
                          return (
                            <SelectItem key={rate.id} value={rate.id}>
                              <div className="flex items-center gap-3 w-full">
                                <CarrierLogo carrier={standardizedCarrier} className="w-6 h-6" />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{standardizedCarrier}</div>
                                  <div className="text-xs text-gray-600">{standardizedService}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-sm">${rateValue.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {rate.delivery_days || rate.est_delivery_days || 'N/A'} days
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Selected Rate Display */}
                    {(() => {
                      const selectedRate = getSelectedRate(shipment);
                      if (selectedRate) {
                        const standardizedCarrier = standardizeCarrierName(selectedRate.carrier);
                        const standardizedService = standardizeServiceName(selectedRate.service, standardizedCarrier);
                        const rateValue = typeof selectedRate.rate === 'string' ? parseFloat(selectedRate.rate) : selectedRate.rate;
                        
                        return (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CarrierLogo 
                                  carrier={standardizedCarrier} 
                                  className="w-8 h-8" 
                                />
                                <div>
                                  <div className="font-medium text-sm text-blue-900">
                                    {standardizedCarrier} - {standardizedService}
                                  </div>
                                  <div className="text-xs text-blue-700 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {selectedRate.delivery_days || selectedRate.est_delivery_days || 'N/A'} days delivery
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-blue-900">
                                  ${rateValue.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {shipments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No shipments uploaded yet. Upload a CSV file to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BulkShipmentsList;
