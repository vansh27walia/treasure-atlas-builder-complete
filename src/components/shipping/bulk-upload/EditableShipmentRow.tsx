
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import InsuranceOptions from './InsuranceOptions';
import { displayWeightInPounds, parseWeightInput } from '@/utils/weightConversion';

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onUpdate: (updates: Partial<BulkShipment>) => void;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: shipment.customer_name || shipment.recipient,
    weight: shipment.details?.weight || 1,
    length: shipment.details?.length || 1,
    width: shipment.details?.width || 1,
    height: shipment.details?.height || 1,
    declared_value: shipment.details?.declared_value || 200
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const updates = {
      customer_name: editData.customer_name,
      recipient: editData.customer_name,
      details: {
        ...shipment.details,
        weight: parseWeightInput(editData.weight),
        length: editData.length,
        width: editData.width,
        height: editData.height,
        declared_value: editData.declared_value
      }
    };
    
    onUpdate(updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      customer_name: shipment.customer_name || shipment.recipient,
      weight: shipment.details?.weight || 1,
      length: shipment.details?.length || 1,
      width: shipment.details?.width || 1,
      height: shipment.details?.height || 1,
      declared_value: shipment.details?.declared_value || 200
    });
    setIsEditing(false);
  };

  const getStreetAddress = () => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).street1 || '';
    }
    return '';
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Customer</label>
          {isEditing ? (
            <Input
              value={editData.customer_name}
              onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
              className="w-full"
            />
          ) : (
            <div>
              <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
              <div className="text-sm text-gray-500">{getStreetAddress()}</div>
            </div>
          )}
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Package Details</label>
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
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Rate</label>
          {shipment.availableRates && shipment.availableRates.length > 0 ? (
            <div className="space-y-2">
              {shipment.selectedRateId ? (
                (() => {
                  const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                  return selectedRate ? (
                    <RateDisplay
                      actualRate={selectedRate.rate}
                      carrier={selectedRate.carrier}
                      service={selectedRate.service}
                      deliveryDays={selectedRate.delivery_days}
                    />
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
        </div>
        
        <div className="flex items-end justify-end space-x-2">
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
            <Button
              onClick={handleEdit}
              size="sm"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditableShipmentRow;
