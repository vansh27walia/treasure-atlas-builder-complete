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
    weight: Number(shipment.details?.weight || 1), // ALWAYS IN POUNDS - NO CONVERSION
    length: Number(shipment.details?.length || 1),
    width: Number(shipment.details?.width || 1),
    height: Number(shipment.details?.height || 1),
    declared_value: Number(shipment.details?.declared_value || 100),
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

  const handleSave = async () => {
    console.log('EditShipmentModal: Starting save process', { shipmentId: shipment.id, editData });
    
    if (!validateShipment()) {
      console.log('EditShipmentModal: Validation failed');
      return;
    }

    // Ensure all numeric values are properly converted
    const weight = Number(editData.weight);
    const length = Number(editData.length);
    const width = Number(editData.width);
    const height = Number(editData.height);
    const declared_value = Number(editData.declared_value);

    // Validate numeric inputs
    if (weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
      toast.error('All dimensions and weight must be greater than 0');
      return;
    }

    // Calculate insurance cost based on declared value and enabled status
    const insuranceCost = editData.insurance_enabled && declared_value > 0 
      ? Math.max(declared_value * 0.02, 1) 
      : 0;

    // STEP 1: SAVE CHANGES LOCALLY FIRST (as requested by user)
    const updates: Partial<BulkShipment> = {
      customer_name: editData.customer_name,
      recipient: editData.customer_name,
      insurance_cost: insuranceCost,
      details: {
        ...shipment.details,
        // POUNDS ONLY - Weight is stored in pounds (no conversion needed)
        weight: weight,
        length: length,
        width: width,
        height: height,
        declared_value: declared_value,
        insurance_enabled: editData.insurance_enabled,
        phone_number: editData.phone_number,
        to_country: editData.to_country,
        // Update all address fields properly
        to_name: editData.customer_name,
        to_street1: shipment.details?.to_street1 || '',
        to_city: shipment.details?.to_city || '',
        to_state: shipment.details?.to_state || '',
        to_zip: shipment.details?.to_zip || '',
      }
    };

    console.log('EditShipmentModal: Saving updates locally first (WEIGHT IN POUNDS):', {
      shipmentId: shipment.id,
      weightInPounds: weight,
      dimensions: { length, width, height },
      isFedEx,
      hasPhoneNumber: !!editData.phone_number,
      isInternational,
      insuranceCost,
      fullUpdates: updates
    });

    try {
      // STEP 1: Save locally first (as user requested)
      console.log('EditShipmentModal: Saving locally first...');
      onEditShipment(shipment.id, updates);
      
      // Close modal after successful local save
      setOpen(false);
      
      // Show local save success
      toast.success('✅ Changes saved locally! Fetching new rates...');
      
      console.log('EditShipmentModal: Local save completed successfully');
    } catch (error) {
      console.error('EditShipmentModal: Error saving shipment locally:', error);
      toast.error('❌ Failed to save shipment changes locally');
    }
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
              <Label htmlFor="weight" className="font-semibold text-blue-700 text-lg">
                📦 Weight - POUNDS ONLY (lbs) - NO OUNCES!
              </Label>
              <Input
                id="weight"
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                step="0.1"
                min="0.1"
                placeholder="Enter weight in POUNDS ONLY (e.g., 2.5)"
                className="border-blue-300 focus:border-blue-500 text-lg font-semibold bg-blue-50"
              />
              <div className="bg-blue-100 p-3 rounded mt-2 border-2 border-blue-400">
                <p className="text-sm text-blue-900 font-bold">
                  🚫 NO OUNCES! POUNDS ONLY! 🚫
                </p>
                <p className="text-xs text-blue-700 font-semibold">
                  • 2.5 pounds = enter "2.5" (NOT ounces)<br/>
                  • 1 pound = enter "1.0" (NOT ounces)<br/>
                  • System ONLY accepts POUNDS - NO conversion
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="length">Length (inches)</Label>
                <Input
                  id="length"
                  type="number"
                  value={editData.length}
                  onChange={(e) => setEditData(prev => ({ ...prev, length: Number(e.target.value) }))}
                  step="0.1"
                  min="0.1"
                  placeholder="Length"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  value={editData.width}
                  onChange={(e) => setEditData(prev => ({ ...prev, width: Number(e.target.value) }))}
                  step="0.1"
                  min="0.1"
                  placeholder="Width"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  value={editData.height}
                  onChange={(e) => setEditData(prev => ({ ...prev, height: Number(e.target.value) }))}
                  step="0.1"
                  min="0.1"
                  placeholder="Height"
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