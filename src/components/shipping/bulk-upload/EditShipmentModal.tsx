import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, AlertTriangle, Phone, Globe } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

interface EditShipmentModalProps {
  shipment: BulkShipment;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
}

const EditShipmentModal: React.FC<EditShipmentModalProps> = ({
  shipment,
  onEditShipment
}) => {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: shipment.customer_name || shipment.recipient || '',
    weight: shipment.details?.weight || 1,
    length: shipment.details?.length || 1,
    width: shipment.details?.width || 1,
    height: shipment.details?.height || 1,
    declared_value: shipment.details?.declared_value || 100,
    insurance_enabled: shipment.details?.insurance_enabled !== false,
    phone_number: shipment.details?.phone_number || '',
    to_country: shipment.details?.to_country || 'US'
  });

  // Check if shipment is international
  const isInternational = editData.to_country !== 'US' && editData.to_country !== 'USA';
  
  // Check if carrier is FedEx
  const isFedEx = shipment.carrier?.toLowerCase().includes('fedex');

  // Validation function
  const validateShipment = (): boolean => {
    // FedEx requires phone number
    if (isFedEx && !editData.phone_number.trim()) {
      toast.error('FedEx shipments require a phone number for the recipient address');
      return false;
    }

    // International shipments require customs documents (placeholder - would need actual customs data)
    if (isInternational) {
      toast.warning('International shipments require customs documents. Please ensure customs information is complete.');
    }

    return true;
  };

  const handleSave = () => {
    if (!validateShipment()) {
      return;
    }

    // Calculate insurance cost based on declared value and enabled status
    const insuranceCost = editData.insurance_enabled && editData.declared_value > 0 
      ? Math.max(editData.declared_value * 0.02, 1) 
      : 0;

    const updates: Partial<BulkShipment> = {
      customer_name: editData.customer_name,
      recipient: editData.customer_name,
      insurance_cost: insuranceCost,
      details: {
        ...shipment.details,
        weight: editData.weight,
        length: editData.length,
        width: editData.width,
        height: editData.height,
        declared_value: editData.declared_value,
        insurance_enabled: editData.insurance_enabled,
        phone_number: editData.phone_number,
        to_country: editData.to_country
      }
    };

    console.log('Saving shipment edit with validation:', {
      shipmentId: shipment.id,
      isFedEx,
      hasPhoneNumber: !!editData.phone_number,
      isInternational,
      updates
    });

    onEditShipment(shipment.id, updates);
    setOpen(false);
    toast.success('Shipment updated successfully');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Shipment Details
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="customer_name">Recipient Name</Label>
              <Input
                id="customer_name"
                value={editData.customer_name}
                onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>

            <div>
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
                {isFedEx && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="phone_number"
                value={editData.phone_number}
                onChange={(e) => setEditData(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Phone number"
                className={isFedEx && !editData.phone_number ? 'border-red-300' : ''}
              />
              {isFedEx && !editData.phone_number && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  FedEx requires phone number
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="to_country" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Country
              </Label>
              <Select
                value={editData.to_country}
                onValueChange={(value) => setEditData(prev => ({ ...prev, to_country: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="MX">Mexico</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
              {isInternational && (
                <p className="text-orange-500 text-sm mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  International shipment - customs documents required
                </p>
              )}
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                step="0.1"
                min="0.1"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"
                  type="number"
                  value={editData.length}
                  onChange={(e) => setEditData(prev => ({ ...prev, length: Number(e.target.value) }))}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div>
                <Label htmlFor="width">Width</Label>
                <Input
                  id="width"
                  type="number"
                  value={editData.width}
                  onChange={(e) => setEditData(prev => ({ ...prev, width: Number(e.target.value) }))}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  type="number"
                  value={editData.height}
                  onChange={(e) => setEditData(prev => ({ ...prev, height: Number(e.target.value) }))}
                  step="0.1"
                  min="0.1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="declared_value">Declared Value ($)</Label>
              <Input
                id="declared_value"
                type="number"
                value={editData.declared_value}
                onChange={(e) => setEditData(prev => ({ ...prev, declared_value: Number(e.target.value) }))}
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="insurance_enabled"
                checked={editData.insurance_enabled}
                onChange={(e) => setEditData(prev => ({ ...prev, insurance_enabled: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="insurance_enabled">Enable Insurance</Label>
            </div>

            {editData.insurance_enabled && (
              <p className="text-sm text-gray-600">
                Insurance cost: ${Math.max(editData.declared_value * 0.02, 1).toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-1" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditShipmentModal;