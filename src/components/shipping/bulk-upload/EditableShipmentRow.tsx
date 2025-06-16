
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import InsuranceOptions from './InsuranceOptions';
import AIRatePicker from './AIRatePicker';
import { displayWeightInPounds, parseWeightInput } from '@/utils/weightConversion';

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onSelectRate,
  onRemoveShipment,
  onEditShipment
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
        declared_value: editData.declared_value
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
      declared_value: shipment.details?.declared_value || 200
    });
    setIsEditing(false);
  };

  return (
    <TableRow>
      <TableCell>
        {isEditing ? (
          <Input
            value={editData.customer_name}
            onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
            className="w-full"
          />
        ) : (
          <div>
            <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
            <div className="text-sm text-gray-500">{shipment.customer_address?.street1}</div>
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
            <Button
              onClick={handleEdit}
              size="sm"
              variant="outline"
            >
              <Edit className="h-4 w-4" />
            </Button>
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
