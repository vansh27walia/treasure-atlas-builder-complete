import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Edit2, Trash2, CheckCircle, Loader2, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BulkShipment } from '@/types/shipping';
import CustomsClearanceButton from './CustomsClearanceButton';

// Local customs info interface
interface LocalCustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type?: string;
  restriction_comments?: string;
  customs_items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number?: string;
    origin_country: string;
  }>;
  eel_pfc?: string;
}

interface EditShipmentData {
  recipient: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  reference?: string;
}

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onRefreshRates: (shipmentId: string) => void;
  onBulkApplyCarrier: (carrier: string) => void;
  shipmentCustomsInfo: Record<string, LocalCustomsInfo>;
  onSaveCustomsInfo: (shipmentId: string, customsInfo: LocalCustomsInfo) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onBulkApplyCarrier,
  shipmentCustomsInfo,
  onSaveCustomsInfo
}) => {
  const [editingShipment, setEditingShipment] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditShipmentData>({
    recipient: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    weight: 0,
    length: 0,
    width: 0,
    height: 0,
    reference: ''
  });
  const [refreshingRates, setRefreshingRates] = useState<Set<string>>(new Set());

  const carriers = Array.from(new Set(
    shipments.flatMap(s => s.availableRates?.map(r => r.carrier) || [])
  )).filter(Boolean);

  const handleEditStart = (shipment: BulkShipment) => {
    setEditData({
      recipient: shipment.recipient,
      address: shipment.address,
      city: shipment.details?.to_city || '',
      state: shipment.details?.to_state || '',
      zip: shipment.details?.to_zip || '',
      country: shipment.details?.to_country || 'US',
      weight: shipment.details?.weight || 0,
      length: shipment.details?.length || 0,
      width: shipment.details?.width || 0,
      height: shipment.details?.height || 0,
      reference: shipment.details?.reference || ''
    });
    setEditingShipment(shipment.id);
  };

  const handleEditSave = () => {
    if (!editingShipment) return;
    
    const updates: Partial<BulkShipment> = {
      recipient: editData.recipient,
      address: editData.address,
      details: {
        ...shipments.find(s => s.id === editingShipment)?.details,
        to_city: editData.city,
        to_state: editData.state,
        to_zip: editData.zip,
        to_country: editData.country,
        weight: editData.weight,
        length: editData.length,
        width: editData.width,
        height: editData.height,
        reference: editData.reference
      }
    };
    
    onEditShipment(editingShipment, updates);
    setEditingShipment(null);
  };

  const handleRefreshRates = async (shipmentId: string) => {
    setRefreshingRates(prev => new Set([...prev, shipmentId]));
    try {
      await onRefreshRates(shipmentId);
    } finally {
      setRefreshingRates(prev => {
        const newSet = new Set(prev);
        newSet.delete(shipmentId);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCarrierClass = (carrier: string) => {
    const carrierColors: { [key: string]: string } = {
      'USPS': 'bg-blue-100 text-blue-800 border-blue-200',
      'UPS': 'bg-amber-100 text-amber-800 border-amber-200',
      'FedEx': 'bg-purple-100 text-purple-800 border-purple-200',
      'DHL': 'bg-red-100 text-red-800 border-red-200'
    };
    return carrierColors[carrier] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No shipments to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      {carriers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Apply to all:</Label>
            <div className="flex gap-2 flex-wrap">
              {carriers.map(carrier => (
                <Button
                  key={carrier}
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkApplyCarrier(carrier)}
                  className="text-xs"
                >
                  {carrier}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Shipments Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 bg-white">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Recipient</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Address</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Weight</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Service</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Rate</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Ready</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Custom Clearance</th>
              <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((shipment) => {
              const isInternational = shipment.details?.to_country && 
                shipment.details.to_country.toUpperCase() !== 'US' && 
                shipment.details.to_country.toUpperCase() !== 'USA' && 
                shipment.details.to_country.toUpperCase() !== 'UNITED STATES';

              const hasCustomsInfo = shipmentCustomsInfo[shipment.id];

              return (
                <tr key={shipment.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="font-medium text-gray-900">{shipment.recipient}</div>
                    {shipment.details?.reference && (
                      <div className="text-sm text-gray-500">Ref: {shipment.details.reference}</div>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="text-sm text-gray-900">{shipment.address}</div>
                    <div className="text-sm text-gray-500">
                      {shipment.details?.to_city}, {shipment.details?.to_state} {shipment.details?.to_zip}
                    </div>
                    <div className="text-sm text-gray-500">{shipment.details?.to_country}</div>
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-sm">
                    {shipment.details?.weight} oz
                    <div className="text-xs text-gray-500">
                      {shipment.details?.length}×{shipment.details?.width}×{shipment.details?.height}"
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    {shipment.availableRates && shipment.availableRates.length > 0 ? (
                      <Select
                        value={shipment.selectedRateId}
                        onValueChange={(value) => onSelectRate(shipment.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {shipment.availableRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={getCarrierClass(rate.carrier)}>
                                  {rate.carrier}
                                </Badge>
                                <span className="text-xs">{rate.service}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-600">No rates</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshRates(shipment.id)}
                          disabled={refreshingRates.has(shipment.id)}
                          className="ml-1"
                        >
                          {refreshingRates.has(shipment.id) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            'Retry'
                          )}
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-3 font-medium">
                    {shipment.selectedRateId && shipment.availableRates ? (
                      <div>
                        {formatCurrency(shipment.rate)}
                        {shipment.availableRates.find(r => r.id === shipment.selectedRateId)?.delivery_days && (
                          <div className="text-xs text-gray-500">
                            {shipment.availableRates.find(r => r.id === shipment.selectedRateId)?.delivery_days} days
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-3 text-center">
                    {shipment.selectedRateId && (!isInternational || hasCustomsInfo) ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <CustomsClearanceButton
                      shipment={shipment}
                      customsInfo={shipmentCustomsInfo[shipment.id]}
                      onCustomsInfoSave={(info) => onSaveCustomsInfo(shipment.id, info)}
                    />
                  </td>
                  <td className="border border-gray-200 px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStart(shipment)}
                        className="p-2"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveShipment(shipment.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingShipment} onOpenChange={() => setEditingShipment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Shipment</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Recipient Name</Label>
              <Input
                value={editData.recipient}
                onChange={(e) => setEditData(prev => ({ ...prev, recipient: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={editData.city}
                onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={editData.state}
                onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input
                value={editData.zip}
                onChange={(e) => setEditData(prev => ({ ...prev, zip: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={editData.country}
                onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Weight (oz)</Label>
              <Input
                type="number"
                step="0.1"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Dimensions (L×W×H inches)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={editData.length}
                  onChange={(e) => setEditData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                  placeholder="L"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={editData.width}
                  onChange={(e) => setEditData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                  placeholder="W"
                />
                <Input
                  type="number"
                  step="0.1"
                  value={editData.height}
                  onChange={(e) => setEditData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  placeholder="H"
                />
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={editData.reference}
                onChange={(e) => setEditData(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="Order number or reference"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingShipment(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkShipmentsList;
