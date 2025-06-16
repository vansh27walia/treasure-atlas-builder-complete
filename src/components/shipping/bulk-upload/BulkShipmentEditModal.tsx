
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BulkShipment } from '@/types/shipping';

interface BulkShipmentEditModalProps {
  shipment: BulkShipment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedShipment: BulkShipment) => void;
}

const BulkShipmentEditModal: React.FC<BulkShipmentEditModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    phone: '',
    parcel_length: 0,
    parcel_width: 0,
    parcel_height: 0,
    parcel_weight: 0,
    declared_value: 0
  });

  useEffect(() => {
    if (shipment) {
      setFormData({
        name: shipment.details.name || '',
        company: shipment.details.company || '',
        street1: shipment.details.street1 || '',
        street2: shipment.details.street2 || '',
        city: shipment.details.city || '',
        state: shipment.details.state || '',
        zip: shipment.details.zip || '',
        country: shipment.details.country || 'US',
        phone: shipment.details.phone || '',
        parcel_length: shipment.details.parcel_length || 0,
        parcel_width: shipment.details.parcel_width || 0,
        parcel_height: shipment.details.parcel_height || 0,
        parcel_weight: shipment.details.parcel_weight || 0,
        declared_value: shipment.details.declared_value || 0
      });
    }
  }, [shipment]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const updatedShipment: BulkShipment = {
      ...shipment,
      recipient: formData.name,
      customer_name: formData.name,
      customer_address: `${formData.street1}, ${formData.city}, ${formData.state} ${formData.zip}`,
      details: {
        ...shipment.details,
        name: formData.name,
        company: formData.company,
        street1: formData.street1,
        street2: formData.street2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        phone: formData.phone,
        parcel_length: formData.parcel_length,
        parcel_width: formData.parcel_width,
        parcel_height: formData.parcel_height,
        parcel_weight: formData.parcel_weight,
        declared_value: formData.declared_value
      }
    };

    onSave(updatedShipment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipment Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="Company Name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="street1">Address Line 1 *</Label>
              <Input
                id="street1"
                value={formData.street1}
                onChange={(e) => handleInputChange('street1', e.target.value)}
                placeholder="Street Address"
              />
            </div>
            
            <div>
              <Label htmlFor="street2">Address Line 2</Label>
              <Input
                id="street2"
                value={formData.street2}
                onChange={(e) => handleInputChange('street2', e.target.value)}
                placeholder="Apt, Suite, Unit, etc."
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="ZIP Code"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Package Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.parcel_length}
                  onChange={(e) => handleInputChange('parcel_length', Number(e.target.value))}
                  placeholder="Length"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.parcel_width}
                  onChange={(e) => handleInputChange('parcel_width', Number(e.target.value))}
                  placeholder="Width"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.parcel_height}
                  onChange={(e) => handleInputChange('parcel_height', Number(e.target.value))}
                  placeholder="Height"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (oz)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.parcel_weight}
                  onChange={(e) => handleInputChange('parcel_weight', Number(e.target.value))}
                  placeholder="Weight"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="declared_value">Declared Value ($)</Label>
              <Input
                id="declared_value"
                type="number"
                value={formData.declared_value}
                onChange={(e) => handleInputChange('declared_value', Number(e.target.value))}
                placeholder="Package Value"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Confirm Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkShipmentEditModal;
