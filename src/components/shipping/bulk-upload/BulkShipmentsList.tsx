
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit3, Save, X, Package, MapPin, Clock, DollarSign } from 'lucide-react';
import EditableShipmentRow from './EditableShipmentRow';
import CarrierLogo from '@/components/shipping/CarrierLogo';
import { standardizeCarrierName, standardizeServiceName } from '@/utils/carrierUtils';

interface ShipmentData {
  id: string;
  fromAddress: {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  toAddress: {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  package: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  selectedRate?: {
    id: string;
    carrier: string;
    service: string;
    rate: string;
    delivery_days: number;
  };
  rates?: Array<{
    id: string;
    carrier: string;
    service: string;
    rate: string;
    delivery_days: number;
  }>;
  error?: string;
  status: 'pending' | 'processed' | 'error';
}

interface BulkShipmentsListProps {
  shipments: ShipmentData[];
  onShipmentUpdate: (index: number, updatedShipment: ShipmentData) => void;
  onShipmentRemove: (index: number) => void;
  selectedShipments: number[];
  onShipmentToggle: (index: number) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onShipmentUpdate,
  onShipmentRemove,
  selectedShipments,
  onShipmentToggle,
  onSelectAll,
  allSelected
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempShipment, setTempShipment] = useState<ShipmentData | null>(null);

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
    const selectedRate = shipment.rates?.find(rate => rate.id === rateId);
    
    if (selectedRate) {
      const updatedShipment = {
        ...shipment,
        selectedRate: selectedRate
      };
      onShipmentUpdate(shipmentIndex, updatedShipment);
    }
  };

  // Function to get the best rate (cheapest) for a shipment
  const getBestRate = (rates: any[]) => {
    if (!rates || rates.length === 0) return null;
    return rates.reduce((best, current) => {
      return parseFloat(current.rate) < parseFloat(best.rate) ? current : best;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Processed</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Error</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
    }
  };

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
              <EditableShipmentRow
                shipment={tempShipment!}
                onSave={() => handleSave(index)}
                onCancel={handleCancel}
                onChange={setTempShipment}
              />
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
                  {/* From Address */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <MapPin className="w-4 h-4" />
                      From
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">{shipment.fromAddress.name}</div>
                      <div>{shipment.fromAddress.street1}</div>
                      <div>
                        {shipment.fromAddress.city}, {shipment.fromAddress.state} {shipment.fromAddress.zip}
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
                      <div className="font-medium">{shipment.toAddress.name}</div>
                      <div>{shipment.toAddress.street1}</div>
                      <div>
                        {shipment.toAddress.city}, {shipment.toAddress.state} {shipment.toAddress.zip}
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
                        {shipment.package.length}"×{shipment.package.width}"×{shipment.package.height}"
                      </div>
                      <div>{shipment.package.weight} oz</div>
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
                {shipment.rates && shipment.rates.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                      <DollarSign className="w-4 h-4" />
                      Available Rates
                    </div>
                    
                    {/* Rate Selector */}
                    <Select 
                      value={shipment.selectedRate?.id || ''} 
                      onValueChange={(value) => handleRateSelection(index, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a shipping rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipment.rates.map((rate) => {
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
                                    {rate.delivery_days} days
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {/* Selected Rate Display */}
                    {shipment.selectedRate && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CarrierLogo 
                              carrier={standardizeCarrierName(shipment.selectedRate.carrier)} 
                              className="w-8 h-8" 
                            />
                            <div>
                              <div className="font-medium text-sm text-blue-900">
                                {standardizeCarrierName(shipment.selectedRate.carrier)} - {standardizeServiceName(shipment.selectedRate.service, standardizeCarrierName(shipment.selectedRate.carrier))}
                              </div>
                              <div className="text-xs text-blue-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {shipment.selectedRate.delivery_days} days delivery
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-blue-900">
                              ${typeof shipment.selectedRate.rate === 'string' 
                                ? parseFloat(shipment.selectedRate.rate).toFixed(2) 
                                : shipment.selectedRate.rate.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
