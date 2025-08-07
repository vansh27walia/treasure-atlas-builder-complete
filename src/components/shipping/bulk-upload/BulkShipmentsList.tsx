
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Trash2, 
  Edit, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Package,
  DollarSign,
  Truck,
  MapPin,
  Weight,
  Ruler,
  Save,
  X,
  Brain
} from 'lucide-react';
import { BulkShipment, ShippingOption } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '@/components/shipping/CarrierLogo';
import { standardizeCarrierName } from '@/utils/carrierUtils';

export interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => Promise<void>;
  onAIAnalysis: (shipment?: any) => void;
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
  const [editingShipment, setEditingShipment] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_rates':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rates_fetched':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rate_selected':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'error':
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_rates':
        return 'Fetching Rates...';
      case 'rates_fetched':
        return 'Rates Available';
      case 'rate_selected':
        return 'Rate Selected';
      case 'label_purchased':
        return 'Label Created';
      case 'completed':
        return 'Completed';
      case 'error':
      case 'failed':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const startEditing = (shipment: BulkShipment) => {
    setEditingShipment(shipment.id);
    setEditForm({
      name: shipment.details?.name || '',
      company: shipment.details?.company || '',
      street1: shipment.details?.street1 || '',
      street2: shipment.details?.street2 || '',
      city: shipment.details?.city || '',
      state: shipment.details?.state || '',
      zip: shipment.details?.zip || '',
      country: shipment.details?.country || 'US',
      phone: shipment.details?.phone || '',
      parcel_length: shipment.details?.parcel_length || 12,
      parcel_width: shipment.details?.parcel_width || 8,
      parcel_height: shipment.details?.parcel_height || 4,
      parcel_weight: shipment.details?.parcel_weight || 16
    });
  };

  const saveEdit = () => {
    if (editingShipment) {
      onEditShipment(editingShipment, editForm);
      setEditingShipment(null);
      setEditForm({});
    }
  };

  const cancelEdit = () => {
    setEditingShipment(null);
    setEditForm({});
  };

  const handleRateSelect = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
  };

  const handleRefreshRates = async (shipmentId: string) => {
    try {
      await onRefreshRates(shipmentId);
    } catch (error) {
      console.error('Error refreshing rates:', error);
    }
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No shipments uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => (
        <Card key={shipment.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(shipment.status)}
                  <CardTitle className="text-lg">{shipment.details?.name || 'Unknown Recipient'}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getStatusText(shipment.status)}
                </Badge>
                {shipment.status === 'pending_rates' && isFetchingRates && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAIAnalysis(shipment)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(shipment)}
                  disabled={editingShipment === shipment.id}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRefreshRates(shipment.id)}
                  disabled={isFetchingRates}
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingRates ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onRemoveShipment(shipment.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {editingShipment === shipment.id ? (
              // Edit Form
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={editForm.company}
                      onChange={(e) => setEditForm({...editForm, company: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="street1">Street Address *</Label>
                    <Input
                      id="street1"
                      value={editForm.street1}
                      onChange={(e) => setEditForm({...editForm, street1: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="street2">Street Address 2</Label>
                    <Input
                      id="street2"
                      value={editForm.street2}
                      onChange={(e) => setEditForm({...editForm, street2: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={editForm.city}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={editForm.state}
                      onChange={(e) => setEditForm({...editForm, state: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      value={editForm.zip}
                      onChange={(e) => setEditForm({...editForm, zip: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="length">Length (in)</Label>
                    <Input
                      id="length"
                      type="number"
                      value={editForm.parcel_length}
                      onChange={(e) => setEditForm({...editForm, parcel_length: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (in)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={editForm.parcel_width}
                      onChange={(e) => setEditForm({...editForm, parcel_width: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (in)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={editForm.parcel_height}
                      onChange={(e) => setEditForm({...editForm, parcel_height: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (oz)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={editForm.parcel_weight}
                      onChange={(e) => setEditForm({...editForm, parcel_weight: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button onClick={saveEdit}>
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              // Display Mode
              <>
                {/* Shipment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Delivery Address:</span>
                    </div>
                    <div className="ml-6 text-gray-700">
                      {shipment.details?.company && <div>{shipment.details.company}</div>}
                      <div>{shipment.details?.street1}</div>
                      {shipment.details?.street2 && <div>{shipment.details.street2}</div>}
                      <div>{shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}</div>
                      {shipment.details?.phone && <div>Phone: {shipment.details.phone}</div>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Package Dimensions:</span>
                    </div>
                    <div className="ml-6 text-gray-700">
                      <div className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {shipment.details?.parcel_length}"L x {shipment.details?.parcel_width}"W x {shipment.details?.parcel_height}"H
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="w-3 h-3" />
                        {shipment.details?.parcel_weight} oz
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Rates */}
                {shipment.availableRates && shipment.availableRates.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Available Rates:</span>
                    </div>
                    
                    <div className="ml-6">
                      <Select 
                        value={shipment.selectedRateId || ''} 
                        onValueChange={(value) => handleRateSelect(shipment.id, value)}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Select a shipping rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {shipment.availableRates.map((rate: ShippingOption) => {
                            const standardizedCarrier = standardizeCarrierName(rate.carrier);
                            return (
                              <SelectItem key={rate.id} value={rate.id}>
                                <div className="flex items-center gap-2 w-full">
                                  <CarrierLogo carrier={standardizedCarrier} className="w-4 h-4" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{standardizedCarrier} {rate.service}</div>
                                    <div className="text-xs text-gray-600">
                                      ${parseFloat(rate.rate).toFixed(2)} - {rate.delivery_days} days
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Rate Display */}
                    {shipment.selectedRateId && (() => {
                      const selectedRate = shipment.availableRates.find(rate => rate.id === shipment.selectedRateId);
                      if (selectedRate) {
                        const standardizedCarrier = standardizeCarrierName(selectedRate.carrier);
                        return (
                          <div className="ml-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CarrierLogo carrier={standardizedCarrier} className="w-5 h-5" />
                                <span className="font-medium text-blue-900">
                                  {standardizedCarrier} {selectedRate.service}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-bold text-lg text-green-700">
                                    ${parseFloat(selectedRate.rate).toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  {selectedRate.delivery_days} business days
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

                {/* Error Message */}
                {shipment.error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 text-sm">{shipment.error}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
