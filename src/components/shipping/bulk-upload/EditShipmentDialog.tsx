
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BulkShipment } from '@/types/shipping';

interface EditShipmentDialogProps {
  shipment: BulkShipment;
  open: boolean;
  onClose: () => void;
  onSave: (shipmentId: string, details: BulkShipment['details']) => void;
}

const EditShipmentDialog: React.FC<EditShipmentDialogProps> = ({ shipment, open, onClose, onSave }) => {
  const [details, setDetails] = useState<BulkShipment['details']>({ ...shipment.details });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (['parcel_length', 'parcel_width', 'parcel_height', 'parcel_weight'].includes(name)) {
      setDetails({
        ...details,
        [name]: value === '' ? '' : parseFloat(value) || 0,
      });
    } else {
      setDetails({
        ...details,
        [name]: value,
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(shipment.id, details);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Shipment #{shipment.row}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Recipient Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={details.name || ''} 
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="company">Company (Optional)</Label>
              <Input 
                id="company" 
                name="company" 
                value={details.company || ''} 
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="street1">Address Line 1</Label>
            <Input 
              id="street1" 
              name="street1" 
              value={details.street1 || ''} 
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="street2">Address Line 2 (Optional)</Label>
            <Input 
              id="street2" 
              name="street2" 
              value={details.street2 || ''} 
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                name="city" 
                value={details.city || ''} 
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input 
                id="state" 
                name="state" 
                value={details.state || ''} 
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="zip">ZIP/Postal Code</Label>
              <Input 
                id="zip" 
                name="zip" 
                value={details.zip || ''} 
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                name="country" 
                value={details.country || 'US'} 
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input 
                id="phone" 
                name="phone" 
                value={details.phone || ''} 
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="font-medium mb-3">Package Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="parcel_length">Length (in)</Label>
                <Input 
                  id="parcel_length" 
                  name="parcel_length" 
                  type="number"
                  value={details.parcel_length || ''} 
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div>
                <Label htmlFor="parcel_width">Width (in)</Label>
                <Input 
                  id="parcel_width" 
                  name="parcel_width" 
                  type="number"
                  value={details.parcel_width || ''} 
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div>
                <Label htmlFor="parcel_height">Height (in)</Label>
                <Input 
                  id="parcel_height" 
                  name="parcel_height" 
                  type="number"
                  value={details.parcel_height || ''} 
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>
              
              <div>
                <Label htmlFor="parcel_weight">Weight (lbs)</Label>
                <Input 
                  id="parcel_weight" 
                  name="parcel_weight" 
                  type="number"
                  value={details.parcel_weight || ''} 
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  required
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditShipmentDialog;
