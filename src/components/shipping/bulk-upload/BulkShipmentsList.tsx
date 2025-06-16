
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, RefreshCw, Package, MapPin, Loader2 } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onRefreshRates: (shipmentId?: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates
}) => {
  const [editingShipment, setEditingShipment] = useState<BulkShipment | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<BulkShipment>>({});

  const handleEditClick = (shipment: BulkShipment) => {
    setEditingShipment(shipment);
    setEditFormData({
      to_name: shipment.to_name,
      to_company: shipment.to_company || '',
      to_street1: shipment.to_street1,
      to_street2: shipment.to_street2 || '',
      to_city: shipment.to_city,
      to_state: shipment.to_state,
      to_zip: shipment.to_zip,
      to_country: shipment.to_country || 'US',
      to_phone: shipment.to_phone || '',
      to_email: shipment.to_email || '',
      weight: shipment.weight,
      length: shipment.length || '12',
      width: shipment.width || '8',
      height: shipment.height || '4',
      reference: shipment.reference || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editingShipment) return;

    // Convert weight from ounces to pounds if needed
    const weightInPounds = editFormData.weight ? 
      (parseFloat(editFormData.weight.toString()) / 16).toFixed(2) : 
      editingShipment.weight;

    const updatedShipment = {
      ...editFormData,
      weight: weightInPounds
    };

    onEditShipment(editingShipment.id, updatedShipment);
    setEditingShipment(null);
    setEditFormData({});
    toast.success('Shipment updated successfully');
  };

  const formatWeight = (weight: string | number) => {
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight;
    const pounds = Math.floor(weightNum);
    const ounces = Math.round((weightNum - pounds) * 16);
    
    if (pounds === 0) {
      return `${ounces} oz`;
    } else if (ounces === 0) {
      return `${pounds} lbs`;
    } else {
      return `${pounds} lbs ${ounces} oz`;
    }
  };

  const formatRate = (rate: any) => {
    if (!rate) return 'No rate selected';
    
    // Show inflated rate (crossed out) and actual rate
    const actualRate = parseFloat(rate.rate);
    const inflatedRate = rate.original_rate ? parseFloat(rate.original_rate) : actualRate * 1.85;
    
    return (
      <div className="flex items-center gap-2">
        <span className="line-through text-gray-500 text-sm">${inflatedRate.toFixed(2)}</span>
        <span className="font-bold text-green-600">${actualRate.toFixed(2)}</span>
        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
          Save ${(inflatedRate - actualRate).toFixed(2)}
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {shipments.map((shipment, index) => (
        <Card key={shipment.id} className="border border-gray-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  #{index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{shipment.to_name}</h3>
                  {shipment.to_company && (
                    <p className="text-sm text-gray-600">{shipment.to_company}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(shipment)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Shipment #{index + 1}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="to_name">Recipient Name *</Label>
                        <Input
                          id="to_name"
                          value={editFormData.to_name || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_company">Company</Label>
                        <Input
                          id="to_company"
                          value={editFormData.to_company || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_company: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="to_street1">Street Address *</Label>
                        <Input
                          id="to_street1"
                          value={editFormData.to_street1 || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_street1: e.target.value }))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="to_street2">Apt/Suite</Label>
                        <Input
                          id="to_street2"
                          value={editFormData.to_street2 || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_street2: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_city">City *</Label>
                        <Input
                          id="to_city"
                          value={editFormData.to_city || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_state">State *</Label>
                        <Input
                          id="to_state"
                          value={editFormData.to_state || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_state: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_zip">ZIP Code *</Label>
                        <Input
                          id="to_zip"
                          value={editFormData.to_zip || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_zip: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="weight">Weight (lbs) *</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          value={editFormData.weight || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, weight: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_phone">Phone</Label>
                        <Input
                          id="to_phone"
                          value={editFormData.to_phone || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="to_email">Email</Label>
                        <Input
                          id="to_email"
                          type="email"
                          value={editFormData.to_email || ''}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, to_email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditingShipment(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveEdit}>
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRefreshRates(shipment.id)}
                  disabled={isFetchingRates}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isFetchingRates ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveShipment(shipment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Destination:</p>
                  <p className="text-gray-600">
                    {shipment.to_street1}
                    {shipment.to_street2 && `, ${shipment.to_street2}`}
                  </p>
                  <p className="text-gray-600">
                    {shipment.to_city}, {shipment.to_state} {shipment.to_zip}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Package Details:</p>
                  <p className="text-gray-600">Weight: {formatWeight(shipment.weight)}</p>
                  <p className="text-gray-600">
                    Dimensions: {shipment.length || '12'}" × {shipment.width || '8'}" × {shipment.height || '4'}"
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-700">Select Shipping Rate:</Label>
                  <Select
                    value={shipment.selectedRateId || ''}
                    onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}
                    disabled={!shipment.rates || shipment.rates.length === 0}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={
                        isFetchingRates ? "Fetching rates..." :
                        !shipment.rates || shipment.rates.length === 0 ? "No rates available" :
                        "Select a shipping rate"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {shipment.rates?.map((rate) => (
                        <SelectItem key={rate.id} value={rate.id}>
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {rate.carrier.toUpperCase()} - {rate.service}
                              </span>
                              <span className="text-xs text-gray-500">
                                {rate.delivery_days} {rate.delivery_days === 1 ? 'day' : 'days'} delivery
                              </span>
                            </div>
                            <div className="text-right ml-4">
                              {formatRate(rate)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {shipment.selectedRateId && (
                  <div className="lg:w-64 text-right">
                    <div className="text-sm text-gray-600">Selected Rate:</div>
                    {formatRate(shipment.rates?.find(r => r.id === shipment.selectedRateId))}
                  </div>
                )}
              </div>

              {isFetchingRates && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching updated rates...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
