
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Trash2, RefreshCw, Loader } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import InsuranceOptions from './InsuranceOptions';
import { displayWeightInPounds, parseWeightInput } from '@/utils/weightConversion';

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  isRefreshing?: boolean;
  onRefreshRates?: () => void;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  isRefreshing = false,
  onRefreshRates
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: shipment.customer_name || shipment.recipient,
    weight: shipment.details?.weight || 1,
    length: shipment.details?.length || 1,
    width: shipment.details?.width || 1,
    height: shipment.details?.height || 1,
    declared_value: shipment.details?.declared_value || 200,
    phone: shipment.details?.phone || '',
    street1: shipment.details?.street1 || '',
    city: shipment.details?.city || '',
    state: shipment.details?.state || '',
    zip: shipment.details?.zip || '',
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Apply the changes to the shipment
    const updates = {
      customer_name: editData.customer_name,
      recipient: editData.customer_name,
      details: {
        ...shipment.details,
        weight: parseWeightInput(editData.weight),
        length: editData.length,
        width: editData.width,
        height: editData.height,
        declared_value: editData.declared_value,
        phone: editData.phone,
        street1: editData.street1,
        city: editData.city,
        state: editData.state,
        zip: editData.zip,
        // Ensure all parcel dimensions are updated
        parcel_weight: parseWeightInput(editData.weight),
        parcel_length: editData.length,
        parcel_width: editData.width,
        parcel_height: editData.height,
      }
    };
    
    onEditShipment(shipment.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      customer_name: shipment.customer_name || shipment.recipient,
      weight: shipment.details?.weight || 1,
      length: shipment.details?.length || 1,
      width: shipment.details?.width || 1,
      height: shipment.details?.height || 1,
      declared_value: shipment.details?.declared_value || 200,
      phone: shipment.details?.phone || '',
      street1: shipment.details?.street1 || '',
      city: shipment.details?.city || '',
      state: shipment.details?.state || '',
      zip: shipment.details?.zip || '',
    });
    setIsEditing(false);
  };

  // Get street address safely
  const getStreetAddress = () => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).street1 || '';
    }
    return shipment.details?.street1 || '';
  };

  return (
    <TableRow className={isRefreshing ? 'opacity-60' : ''}>
      <TableCell>
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editData.customer_name}
              onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
              className="w-full"
            />
            <Input
              value={editData.street1}
              onChange={(e) => setEditData(prev => ({ ...prev, street1: e.target.value }))}
              placeholder="Street address"
              className="w-full"
            />
            <div className="grid grid-cols-3 gap-1">
              <Input
                value={editData.city}
                onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
              <Input
                value={editData.state}
                onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
              <Input
                value={editData.zip}
                onChange={(e) => setEditData(prev => ({ ...prev, zip: e.target.value }))}
                placeholder="ZIP"
              />
            </div>
            <Input
              value={editData.phone}
              onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone (required for customs)"
              className="w-full"
            />
          </div>
        ) : (
          <div>
            <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
            <div className="text-sm text-gray-500">{getStreetAddress()}</div>
            <div className="text-sm text-gray-500">
              {shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}
            </div>
            {shipment.details?.phone && (
              <div className="text-xs text-gray-500">📞 {shipment.details.phone}</div>
            )}
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <div className="space-y-2">
            <Input
              type="number"
              value={editData.weight}
              onChange={(e) => setEditData(prev => ({ ...prev, weight: Number(e.target.value) }))}
              placeholder="Weight (lb)"
              step="0.1"
            />
            <div className="grid grid-cols-3 gap-1">
              <Input
                type="number"
                value={editData.length}
                onChange={(e) => setEditData(prev => ({ ...prev, length: Number(e.target.value) }))}
                placeholder="L"
                step="0.1"
              />
              <Input
                type="number"
                value={editData.width}
                onChange={(e) => setEditData(prev => ({ ...prev, width: Number(e.target.value) }))}
                placeholder="W"
                step="0.1"
              />
              <Input
                type="number"
                value={editData.height}
                onChange={(e) => setEditData(prev => ({ ...prev, height: Number(e.target.value) }))}
                placeholder="H"
                step="0.1"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="font-medium">{displayWeightInPounds(shipment.details?.weight || 1)}</div>
            <div className="text-sm text-gray-500">
              {shipment.details?.length || 1}" × {shipment.details?.width || 1}" × {shipment.details?.height || 1}"
            </div>
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {shipment.availableRates && shipment.availableRates.length > 0 ? (
          <div className="space-y-2">
            {shipment.selectedRateId ? (
              (() => {
                const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                return selectedRate ? (
                  <div className="space-y-1">
                    <RateDisplay
                      actualRate={selectedRate.rate}
                      carrier={selectedRate.carrier}
                      service={selectedRate.service}
                      deliveryDays={selectedRate.delivery_days}
                      listRate={selectedRate.list_rate}
                    />
                    {isRefreshing && (
                      <Badge variant="secondary" className="text-xs">
                        <Loader className="h-3 w-3 mr-1 animate-spin" />
                        Updating...
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">No rate selected</Badge>
                );
              })()
            ) : (
              <Badge variant="outline">No rate selected</Badge>
            )}
          </div>
        ) : (
          <Badge variant="secondary">Loading rates...</Badge>
        )}
      </TableCell>
      
      <TableCell>
        <InsuranceOptions
          shipmentId={shipment.id}
          insuranceEnabled={shipment.details?.insurance_enabled !== false}
          declaredValue={editData.declared_value}
          onInsuranceToggle={(id, enabled) => {
            onEditShipment(id, {
              details: { ...shipment.details, insurance_enabled: enabled }
            });
          }}
          onDeclaredValueChange={(id, value) => {
            setEditData(prev => ({ ...prev, declared_value: value }));
            onEditShipment(id, {
              details: { ...shipment.details, declared_value: value }
            });
          }}
        />
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleEdit}
                size="sm"
                variant="outline"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {onRefreshRates && (
                <Button
                  onClick={onRefreshRates}
                  size="sm"
                  variant="outline"
                  disabled={isRefreshing}
                  title="Refresh rates for this shipment"
                >
                  {isRefreshing ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </>
          )}
          <Button
            onClick={() => onRemoveShipment(shipment.id)}
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default EditableShipmentRow;
