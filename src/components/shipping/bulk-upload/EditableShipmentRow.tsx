
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BulkShipment } from '@/types/shipping';

export interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onSave: (updates: any) => void;
  onCancel: () => void;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onSave,
  onCancel
}) => {
  const [editedData, setEditedData] = useState({
    recipient: shipment.recipient || shipment.customer_name || '',
    customer_address: shipment.customer_address || '',
    customer_phone: shipment.customer_phone || '',
    customer_email: shipment.customer_email || ''
  });

  const handleSave = () => {
    onSave(editedData);
  };

  return (
    <div className="border rounded-lg p-4 bg-blue-50">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Recipient</label>
          <Input
            value={editedData.recipient}
            onChange={(e) => setEditedData(prev => ({ ...prev, recipient: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Address</label>
          <Input
            value={editedData.customer_address}
            onChange={(e) => setEditedData(prev => ({ ...prev, customer_address: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Phone</label>
          <Input
            value={editedData.customer_phone}
            onChange={(e) => setEditedData(prev => ({ ...prev, customer_phone: e.target.value }))}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            value={editedData.customer_email}
            onChange={(e) => setEditedData(prev => ({ ...prev, customer_email: e.target.value }))}
          />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
          <Button onClick={onCancel} variant="outline" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditableShipmentRow;
