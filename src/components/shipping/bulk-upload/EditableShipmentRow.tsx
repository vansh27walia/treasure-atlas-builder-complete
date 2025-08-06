
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BulkShipment } from '@/types/shipping';

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onSave,
  onCancel
}) => {
  const [editData, setEditData] = useState({
    recipient: shipment.recipient || '',
    customer_name: shipment.customer_name || '',
    customer_address: shipment.customer_address || '',
    customer_phone: shipment.customer_phone || '',
    customer_email: shipment.customer_email || '',
    // Add other editable fields as needed
  });

  const handleSave = () => {
    onSave(editData);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipient">Recipient</Label>
          <Input
            id="recipient"
            value={editData.recipient}
            onChange={(e) => setEditData(prev => ({ ...prev, recipient: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="customer_name">Customer Name</Label>
          <Input
            id="customer_name"
            value={editData.customer_name}
            onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer_address">Address</Label>
          <Input
            id="customer_address"
            value={editData.customer_address}
            onChange={(e) => setEditData(prev => ({ ...prev, customer_address: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="customer_phone">Phone</Label>
          <Input
            id="customer_phone"
            value={editData.customer_phone}
            onChange={(e) => setEditData(prev => ({ ...prev, customer_phone: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="customer_email">Email</Label>
        <Input
          id="customer_email"
          value={editData.customer_email}
          onChange={(e) => setEditData(prev => ({ ...prev, customer_email: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default EditableShipmentRow;
