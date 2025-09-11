import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Edit, RefreshCw } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { convertOuncesToPounds, convertPoundsToOunces } from '@/utils/weightConversion';

interface FreshEditModalProps {
  shipment: BulkShipment;
  pickupAddress: any;
  onUpdateShipment: (shipmentId: string, updatedShipment: BulkShipment) => void;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  delivery_days?: number;
  delivery_date?: string;
}

const FreshEditModal: React.FC<FreshEditModalProps> = ({
  shipment,
  pickupAddress,
  onUpdateShipment
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  
  // Local state for shipment data - always in pounds for display
  const [localData, setLocalData] = useState({
    recipient: shipment.recipient || shipment.customer_name || '',
    phone: shipment.phone || '',
    country: shipment.country || 'US',
    weight: convertOuncesToPounds(shipment.weight || 0),
    length: shipment.length || 0,
    width: shipment.width || 0,
    height: shipment.height || 0,
    declared_value: shipment.declared_value || 0,
    insurance_enabled: shipment.insurance_enabled || false
  });

  const fetchRatesFromNormalShipping = async () => {
    setIsLoading(true);
    setRates([]);
    setSelectedRate(null);

    try {
      // Format address data for normal shipping endpoint
      const addressObj = typeof shipment.customer_address === 'string' 
        ? { street1: shipment.customer_address, street2: '', city: '', state: '', zip: '' }
        : shipment.customer_address || {};
        
      const toAddress = {
        name: localData.recipient,
        street1: addressObj.street1 || '',
        street2: addressObj.street2 || '',
        city: addressObj.city || '',
        state: addressObj.state || '',
        zip: addressObj.zip || '',
        country: localData.country,
        phone: localData.phone || ''
      };

      // Format parcel data - convert pounds to ounces for backend
      const parcel = {
        weight: convertPoundsToOunces(localData.weight), // Convert to ounces for EasyPost
        length: localData.length,
        width: localData.width,
        height: localData.height
      };

      // Use normal shipping rate endpoint
      const response = await fetch('/functions/v1/get-shipping-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress: pickupAddress,
          toAddress,
          parcel,
          declaredValue: localData.declared_value
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }

      const data = await response.json();
      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} shipping rates`);
      } else {
        toast.warning('No rates available for this shipment');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch shipping rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = () => {
    if (!selectedRate) {
      toast.error('Please select a shipping rate');
      return;
    }

    // Calculate insurance cost
    const insuranceCost = localData.insurance_enabled 
      ? Math.max(1, localData.declared_value * 0.01) 
      : 0;

    // Create updated shipment with local changes
    const updatedShipment: BulkShipment = {
      ...shipment,
      recipient: localData.recipient,
      phone: localData.phone,
      country: localData.country,
      weight: convertPoundsToOunces(localData.weight), // Store as ounces in data
      length: localData.length,
      width: localData.width,
      height: localData.height,
      declared_value: localData.declared_value,
      insurance_enabled: localData.insurance_enabled,
      insurance_cost: insuranceCost,
      carrier: selectedRate.carrier,
      service: selectedRate.service,
      rate: selectedRate.rate,
      rate_id: selectedRate.id
    };

    // Update locally and close modal
    onUpdateShipment(shipment.id, updatedShipment);
    setOpen(false);
    toast.success('Shipment updated successfully');
  };

  const handleOpenModal = () => {
    setOpen(true);
    // Auto-fetch rates when modal opens
    setTimeout(() => {
      fetchRatesFromNormalShipping();
    }, 100);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpenModal}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipment Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient">Recipient Name</Label>
              <Input
                id="recipient"
                value={localData.recipient}
                onChange={(e) => setLocalData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="Enter recipient name"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={localData.phone}
                onChange={(e) => setLocalData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={localData.country} onValueChange={(value) => setLocalData(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weight">Weight (POUNDS ONLY)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={localData.weight}
                onChange={(e) => setLocalData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                placeholder="Weight in pounds"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter weight in pounds only</p>
            </div>

            <div>
              <Label htmlFor="length">Length (inches)</Label>
              <Input
                id="length"
                type="number"
                min="0"
                value={localData.length}
                onChange={(e) => setLocalData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                placeholder="Length in inches"
              />
            </div>

            <div>
              <Label htmlFor="width">Width (inches)</Label>
              <Input
                id="width"
                type="number"
                min="0"
                value={localData.width}
                onChange={(e) => setLocalData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                placeholder="Width in inches"
              />
            </div>

            <div>
              <Label htmlFor="height">Height (inches)</Label>
              <Input
                id="height"
                type="number"
                min="0"
                value={localData.height}
                onChange={(e) => setLocalData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                placeholder="Height in inches"
              />
            </div>

            <div>
              <Label htmlFor="declared_value">Declared Value ($)</Label>
              <Input
                id="declared_value"
                type="number"
                min="0"
                step="0.01"
                value={localData.declared_value}
                onChange={(e) => setLocalData(prev => ({ ...prev, declared_value: parseFloat(e.target.value) || 0 }))}
                placeholder="Declared value"
              />
            </div>
          </div>

          {/* Insurance Option */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="insurance"
              checked={localData.insurance_enabled}
              onChange={(e) => setLocalData(prev => ({ ...prev, insurance_enabled: e.target.checked }))}
              className="h-4 w-4"
            />
            <Label htmlFor="insurance">Enable Insurance</Label>
            {localData.insurance_enabled && (
              <span className="text-sm text-muted-foreground">
                (Cost: ${Math.max(1, localData.declared_value * 0.01).toFixed(2)})
              </span>
            )}
          </div>

          {/* Refresh Rates Button */}
          <div className="flex justify-center">
            <Button onClick={fetchRatesFromNormalShipping} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching Rates...' : 'Refresh Rates'}
            </Button>
          </div>

          {/* Shipping Rates */}
          {rates.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Available Shipping Rates:</h4>
              <div className="grid gap-2">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedRate?.id === rate.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRate(rate)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{rate.carrier} - {rate.service}</div>
                        {rate.delivery_days && (
                          <div className="text-sm text-muted-foreground">
                            Delivery: {rate.delivery_days} business days
                          </div>
                        )}
                      </div>
                      <div className="font-bold">${rate.rate.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={!selectedRate}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreshEditModal;