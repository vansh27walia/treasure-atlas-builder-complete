import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';
import AddressAutoComplete from '../AddressAutoComplete';
import { supabase } from '@/integrations/supabase/client';

interface AddManualShipmentModalProps {
  pickupAddress: any;
  onShipmentAdded: (shipment: any) => void;
}

const AddManualShipmentModal: React.FC<AddManualShipmentModalProps> = ({
  pickupAddress,
  onShipmentAdded
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    to_name: '',
    to_street1: '',
    to_street2: '',
    to_city: '',
    to_state: '',
    to_zip: '',
    to_country: 'US',
    weight: '',
    length: '',
    width: '',
    height: '',
    reference: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelect = (address: any) => {
    setFormData(prev => ({
      ...prev,
      to_street1: address.street1 || '',
      to_street2: address.street2 || '',
      to_city: address.city || '',
      to_state: address.state || '',
      to_zip: address.zip || '',
      to_country: address.country || 'US'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.to_name || !formData.to_street1 || !formData.to_city || 
        !formData.to_state || !formData.to_zip || !formData.weight ||
        !formData.length || !formData.width || !formData.height) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Fetch rates for the new shipment
      const { data: ratesData, error: ratesError } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: {
            name: pickupAddress?.name || pickupAddress?.company,
            street1: pickupAddress?.street1,
            street2: pickupAddress?.street2 || '',
            city: pickupAddress?.city,
            state: pickupAddress?.state,
            zip: pickupAddress?.zip,
            country: pickupAddress?.country || 'US',
            phone: pickupAddress?.phone || ''
          },
          toAddress: {
            name: formData.to_name,
            street1: formData.to_street1,
            street2: formData.to_street2 || '',
            city: formData.to_city,
            state: formData.to_state,
            zip: formData.to_zip,
            country: formData.to_country,
            phone: ''
          },
          parcel: {
            length: parseFloat(formData.length),
            width: parseFloat(formData.width),
            height: parseFloat(formData.height),
            weight: parseFloat(formData.weight)
          },
          reference: formData.reference || undefined
        }
      });

      if (ratesError) throw ratesError;

      // Select the cheapest rate by default (or UPS 2-Day if available)
      const rates = ratesData?.rates || [];
      const ups2Day = rates.find((r: any) => 
        r.carrier === 'UPS' && (
          r.service.toLowerCase().includes('2') || 
          r.service.toLowerCase().includes('two')
        )
      );
      const selectedRate = ups2Day || rates[0];

      const newShipment = {
        id: `manual-${Date.now()}`,
        recipient: formData.to_name,
        customer_name: formData.to_name,
        customer_address: {
          street1: formData.to_street1,
          street2: formData.to_street2,
          city: formData.to_city,
          state: formData.to_state,
          zip: formData.to_zip,
          country: formData.to_country
        },
        details: {
          name: formData.to_name,
          street1: formData.to_street1,
          street2: formData.to_street2,
          city: formData.to_city,
          state: formData.to_state,
          zip: formData.to_zip,
          country: formData.to_country,
          weight: parseFloat(formData.weight),
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          reference: formData.reference,
          declared_value: 0,
          insurance_enabled: false
        },
        carrier: selectedRate?.carrier || 'USPS',
        service: selectedRate?.service || 'First Class',
        rate: parseFloat(selectedRate?.rate || '0'),
        selectedRateId: selectedRate?.id,
        availableRates: rates,
        insurance_cost: 0,
        declared_value: 0,
        insurance_enabled: false
      };

      onShipmentAdded(newShipment);
      
      // Reset form
      setFormData({
        to_name: '',
        to_street1: '',
        to_street2: '',
        to_city: '',
        to_state: '',
        to_zip: '',
        to_country: 'US',
        weight: '',
        length: '',
        width: '',
        height: '',
        reference: ''
      });
      
      setOpen(false);
      toast.success('Shipment added successfully');
    } catch (error) {
      console.error('Error adding manual shipment:', error);
      toast.error('Failed to add shipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Shipment Manually
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add Manual Shipment
          </DialogTitle>
          <DialogDescription>
            Add a new shipment manually to your batch. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Recipient Information</h3>
            
            <div>
              <Label htmlFor="to_name">Recipient Name *</Label>
              <Input
                id="to_name"
                value={formData.to_name}
                onChange={(e) => handleInputChange('to_name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <AddressAutoComplete
                onAddressSelected={handleAddressSelect}
                placeholder="Start typing address..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to_street1">Street Address *</Label>
                <Input
                  id="to_street1"
                  value={formData.to_street1}
                  onChange={(e) => handleInputChange('to_street1', e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div>
                <Label htmlFor="to_street2">Apt/Suite (Optional)</Label>
                <Input
                  id="to_street2"
                  value={formData.to_street2}
                  onChange={(e) => handleInputChange('to_street2', e.target.value)}
                  placeholder="Apt 4B"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="to_city">City *</Label>
                <Input
                  id="to_city"
                  value={formData.to_city}
                  onChange={(e) => handleInputChange('to_city', e.target.value)}
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <Label htmlFor="to_state">State *</Label>
                <Input
                  id="to_state"
                  value={formData.to_state}
                  onChange={(e) => handleInputChange('to_state', e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="to_zip">ZIP Code *</Label>
                <Input
                  id="to_zip"
                  value={formData.to_zip}
                  onChange={(e) => handleInputChange('to_zip', e.target.value)}
                  placeholder="10001"
                  required
                />
              </div>
            </div>
          </div>

          {/* Package Dimensions */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Package Dimensions</h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="length">Length (in) *</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  placeholder="12"
                  required
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in) *</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  placeholder="8"
                  required
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in) *</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="4"
                  required
                />
              </div>
            </div>
          </div>

          {/* Reference */}
          <div>
            <Label htmlFor="reference">Reference/Order Number (Optional)</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              placeholder="Order #1234"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Shipment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddManualShipmentModal;
