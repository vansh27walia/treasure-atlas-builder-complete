import React, { useState } from 'react';
import { Edit, RefreshCw } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';

// Inline utility functions
const convertOuncesToPounds = (ounces: number) => ounces / 16;
const convertPoundsToOunces = (pounds: number) => pounds * 16;

// In-file component definitions to replace external imports
const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg transform transition-all scale-100 opacity-100">
        {children}
      </div>
    </div>
  );
};
const DialogContent = ({ children }: any) => <div>{children}</div>;
const DialogHeader = ({ children }: any) => <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>;
const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>;
const DialogTrigger = ({ asChild, children, onClick }: any) => {
  if (asChild) {
    return React.cloneElement(children, { onClick });
  }
  return <button onClick={onClick}>{children}</button>;
};
const Button = ({ variant, size, onClick, children, disabled, className }: any) => {
  let baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  if (variant === 'outline') {
    baseClasses += ' border border-gray-300 bg-white text-gray-700 hover:bg-gray-100';
  } else {
    baseClasses += ' bg-blue-600 text-white hover:bg-blue-700';
  }
  if (size === 'sm') {
    baseClasses += ' h-8 px-3 text-sm';
  } else {
    baseClasses += ' h-10 px-4 py-2';
  }
  return <button className={`${baseClasses} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
};
const Input = (props: any) => <input className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" {...props} />;
const Label = (props: any) => <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props} />;
const Select = ({ value, onValueChange, children }: any) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange(e.target.value);
  };
  return <select value={value} onChange={handleChange} className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">{children}</select>;
};
const SelectContent = ({ children }: any) => children;
const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>;
const SelectTrigger = ({ children }: any) => children;
const SelectValue = ({ placeholder }: any) => <>{placeholder}</>;

// Simple toast notification system
const useToast = () => {
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (message: string, type: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return {
    toasts,
    toast: {
      success: (message: string) => addToast(message, 'success'),
      error: (message: string) => addToast(message, 'error'),
      warning: (message: string) => addToast(message, 'warning'),
    },
  };
};

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
  const { toasts, toast } = useToast();
  
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
      // Validate that essential addresses and parcel data exist
      if (!pickupAddress || !shipment.customer_address || localData.weight <= 0) {
        toast.error('Required shipment details are missing to fetch rates.');
        setIsLoading(false);
        return;
      }

      // Format address data for normal shipping endpoint
      const addressObj = typeof shipment.customer_address === 'string' 
        ? { 
            street1: shipment.customer_address, 
            street2: '', 
            city: shipment.city || '', 
            state: shipment.state || '', 
            zip: shipment.zip || '' 
          }
        : shipment.customer_address || {};

      // Ensure all required address fields are populated
      const fromAddress = {
        name: pickupAddress?.name || pickupAddress?.company || 'Sender Name',
        company: pickupAddress?.company || 'Sender Company',
        street1: pickupAddress?.street1 || 'Required Street',
        street2: pickupAddress?.street2 || '',
        city: pickupAddress?.city || 'Required City',
        state: pickupAddress?.state || 'CA',
        zip: pickupAddress?.zip || '90210',
        country: pickupAddress?.country || 'US',
        phone: pickupAddress?.phone || '123-456-7890',
        email: pickupAddress?.email || 'sender@example.com'
      };
      
      // Ensure all required address fields are populated for toAddress
      const toAddress = {
        name: localData.recipient || shipment.customer_name || shipment.recipient || 'Required Name',
        company: shipment.company || 'Company',
        street1: addressObj.street1 || shipment.customer_address || 'Required Street',
        street2: addressObj.street2 || '',
        city: addressObj.city || shipment.city || 'Required City',
        state: addressObj.state || shipment.state || 'CA',
        zip: addressObj.zip || shipment.zip || '90210',
        country: localData.country || shipment.country || 'US',
        phone: localData.phone || shipment.phone || '123-456-7890',
        email: shipment.email || 'recipient@example.com'
      };

      // Format parcel data - convert pounds to ounces for backend
      const parcel = {
        weight: convertPoundsToOunces(localData.weight), // Convert to ounces for EasyPost
        length: localData.length,
        width: localData.width,
        height: localData.height
      };

      console.log('Sending payload to backend:', { fromAddress, toAddress, parcel, declaredValue: localData.declared_value });

      const response = await fetch('/functions/v1/get-shipping-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromAddress,
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

    // This is the key part:
    // This function passes the updated shipment data to the parent component.
    // The parent component is responsible for saving this data to the backend.
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
    <>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t: any) => (
          <div key={t.id} className={`p-4 rounded-lg shadow-lg text-white ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}>
            {t.message}
          </div>
        ))}
      </div>
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
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="Enter recipient name"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={localData.phone}
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Select value={localData.country} onValueChange={(value: any) => setLocalData(prev => ({ ...prev, country: value }))}>
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
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
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
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
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
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
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
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
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
                  onChange={(e: any) => setLocalData(prev => ({ ...prev, declared_value: parseFloat(e.target.value) || 0 }))}
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
                onChange={(e: any) => setLocalData(prev => ({ ...prev, insurance_enabled: e.target.checked }))}
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
                        selectedRate?.id === rate.id ? 'border-blue-600 bg-blue-600/5' : 'hover:border-blue-600/50'
                      }`}
                      onClick={() => setSelectedRate(rate)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{rate.carrier} - {rate.service}</div>
                          {rate.delivery_days && (
                            <div className="text-sm text-gray-500">
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
    </>
  );
};

export default FreshEditModal;