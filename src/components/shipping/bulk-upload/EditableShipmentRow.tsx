
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Trash2 } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import InsuranceOptions from './InsuranceOptions';
import { displayWeightInPounds, parseWeightInput } from '@/utils/weightConversion';

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onRefreshRates?: (shipmentId: string) => void;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates
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

  // Update editData when shipment changes
  useEffect(() => {
    setEditData({
      customer_name: shipment.customer_name || shipment.recipient,
      weight: shipment.details?.weight || 1,
      length: shipment.details?.length || 1,
      width: shipment.details?.width || 1,
      height: shipment.details?.height || 1,
      declared_value: shipment.details?.declared_value || 200
    });
  }, [shipment]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Create updates object with proper structure
      const updates: Partial<BulkShipment> = {
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
      
      console.log('Saving shipment updates:', updates);
      
      // Apply the changes to the shipment
      onEditShipment(shipment.id, updates);
      
      // Exit edit mode
      setIsEditing(false);
      
      // Refresh rates after saving changes if function is provided
      if (onRefreshRates) {
        console.log('Refreshing rates for shipment:', shipment.id);
        setTimeout(() => {
          onRefreshRates(shipment.id);
        }, 500); // Small delay to ensure state updates are processed
      }
    } catch (error) {
      console.error('Error saving shipment changes:', error);
    }
  };

  const handleCancel = () => {
    // Reset editData to original shipment values
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

  const handleInputChange = (field: string, value: number | string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Get street address safely
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
    <TableRow>
      <TableCell>
        {isEditing ? (
          <Input
            value={editData.customer_name}
            onChange={(e) => handleInputChange('customer_name', e.target.value)}
            className="w-full"
          />
        ) : (
          <div>
            <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
            <div className="text-sm text-gray-500">{getStreetAddress()}</div>
          </div>
        )}
      </TableCell>
      
      <TableCell>
        {isEditing ? (
          <div className="space-y-2">
            <Input
              type="number"
              value={editData.weight}
              onChange={(e) => handleInputChange('weight', Number(e.target.value))}
              placeholder="Weight (lb)"
              step="0.1"
            />
            <div className="grid grid-cols-3 gap-1">
              <Input
                type="number"
                value={editData.length}
                onChange={(e) => handleInputChange('length', Number(e.target.value))}
                placeholder="L"
                step="0.1"
              />
              <Input
                type="number"
                value={editData.width}
                onChange={(e) => handleInputChange('width', Number(e.target.value))}
                placeholder="W"
                step="0.1"
              />
              <Input
                type="number"
                value={editData.height}
                onChange={(e) => handleInputChange('height', Number(e.target.value))}
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
          declaredValue={isEditing ? editData.declared_value : (shipment.details?.declared_value || 200)}
          onInsuranceToggle={(id, enabled) => {
            onEditShipment(id, {
              details: { ...shipment.details, insurance_enabled: enabled }
            });
          }}
          onDeclaredValueChange={(id, value) => {
            if (isEditing) {
              handleInputChange('declared_value', value);
            }
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
