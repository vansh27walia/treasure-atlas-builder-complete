import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Package, MapPin, Truck } from 'lucide-react';
import { toast } from 'sonner';
import AddressAutoComplete from '../AddressAutoComplete';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AddManualShipmentModalProps {
  pickupAddress: any;
  onShipmentAdded: (shipment: any) => void;
  triggerButton?: React.ReactNode;
}

const AddManualShipmentModal: React.FC<AddManualShipmentModalProps> = ({
  pickupAddress,
  onShipmentAdded,
  triggerButton
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pickup');
  
  // Pickup address state (editable)
  const [pickupData, setPickupData] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });

  // Destination address state
  const [formData, setFormData] = useState({
    to_name: '',
    to_street1: '',
    to_street2: '',
    to_city: '',
    to_state: '',
    to_zip: '',
    to_country: 'US',
    to_phone: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    reference: ''
  });

  // Initialize pickup data from props
  useEffect(() => {
    if (pickupAddress && open) {
      setPickupData({
        name: pickupAddress.name || '',
        company: pickupAddress.company || '',
        street1: pickupAddress.street1 || '',
        street2: pickupAddress.street2 || '',
        city: pickupAddress.city || '',
        state: pickupAddress.state || '',
        zip: pickupAddress.zip || '',
        country: pickupAddress.country || 'US',
        phone: pickupAddress.phone || ''
      });
    }
  }, [pickupAddress, open]);

  const handlePickupInputChange = (field: string, value: string) => {
    setPickupData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupData(prev => ({
      ...prev,
      street1: address.street1 || '',
      street2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      country: address.country || 'US'
    }));
  };

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
    
    // Validation - Pickup address
    if (!pickupData.street1 || !pickupData.city || !pickupData.state || !pickupData.zip) {
      toast.error('Please fill in all pickup address fields');
      setActiveTab('pickup');
      return;
    }

    // Validation - Destination address and package
    if (!formData.to_name || !formData.to_street1 || !formData.to_city || 
        !formData.to_state || !formData.to_zip || !formData.weight ||
        !formData.length || !formData.width || !formData.height) {
      toast.error('Please fill in all destination and package fields');
      setActiveTab('destination');
      return;
    }

    setIsLoading(true);

    try {
      // Fetch rates for the new shipment
      const { data: ratesData, error: ratesError } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: {
            name: pickupData.name || pickupData.company || 'Sender',
            company: pickupData.company || '',
            street1: pickupData.street1,
            street2: pickupData.street2 || '',
            city: pickupData.city,
            state: pickupData.state,
            zip: pickupData.zip,
            country: pickupData.country || 'US',
            phone: pickupData.phone || ''
          },
          toAddress: {
            name: formData.to_name,
            street1: formData.to_street1,
            street2: formData.to_street2 || '',
            city: formData.to_city,
            state: formData.to_state,
            zip: formData.to_zip,
            country: formData.to_country,
            phone: formData.to_phone || ''
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

      // Select UPS 2-Day if available, otherwise cheapest rate
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
        isManuallyAdded: true, // Flag for deletion tracking
        recipient: formData.to_name,
        customer_name: formData.to_name,
        row: `M${Date.now().toString().slice(-4)}`, // Manual row identifier
        customer_address: {
          street1: formData.to_street1,
          street2: formData.to_street2,
          city: formData.to_city,
          state: formData.to_state,
          zip: formData.to_zip,
          country: formData.to_country
        },
        // Store pickup address with the shipment
        pickup_address: {
          name: pickupData.name,
          company: pickupData.company,
          street1: pickupData.street1,
          street2: pickupData.street2,
          city: pickupData.city,
          state: pickupData.state,
          zip: pickupData.zip,
          country: pickupData.country,
          phone: pickupData.phone
        },
        details: {
          name: formData.to_name,
          street1: formData.to_street1,
          street2: formData.to_street2,
          city: formData.to_city,
          state: formData.to_state,
          zip: formData.to_zip,
          country: formData.to_country,
          to_country: formData.to_country,
          phone: formData.to_phone,
          weight: parseFloat(formData.weight),
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          reference: formData.reference,
          declared_value: 0,
          insurance_enabled: false,
          // Include pickup address in details
          from_name: pickupData.name,
          from_company: pickupData.company,
          from_street1: pickupData.street1,
          from_street2: pickupData.street2,
          from_city: pickupData.city,
          from_state: pickupData.state,
          from_zip: pickupData.zip,
          from_country: pickupData.country,
          from_phone: pickupData.phone
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
      
      // Reset destination form but keep pickup address
      setFormData({
        to_name: '',
        to_street1: '',
        to_street2: '',
        to_city: '',
        to_state: '',
        to_zip: '',
        to_country: 'US',
        to_phone: '',
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

  const defaultTrigger = (
    <Button 
      variant="outline" 
      className="w-full border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Another Shipment
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Add New Shipment
          </DialogTitle>
          <DialogDescription>
            Add a new shipment to your batch. You can modify the pickup address or use the default.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pickup" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Address
              </TabsTrigger>
              <TabsTrigger value="destination" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Destination & Package
              </TabsTrigger>
            </TabsList>

            {/* Pickup Address Tab */}
            <TabsContent value="pickup" className="space-y-4 mt-4">
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Pickup (From) Address
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="pickup_name">Name</Label>
                    <Input
                      id="pickup_name"
                      value={pickupData.name}
                      onChange={(e) => handlePickupInputChange('name', e.target.value)}
                      placeholder="Sender Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_company">Company (Optional)</Label>
                    <Input
                      id="pickup_company"
                      value={pickupData.company}
                      onChange={(e) => handlePickupInputChange('company', e.target.value)}
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label>Search Address</Label>
                  <AddressAutoComplete
                    onAddressSelected={handlePickupAddressSelect}
                    placeholder="Start typing pickup address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="pickup_street1">Street Address *</Label>
                    <Input
                      id="pickup_street1"
                      value={pickupData.street1}
                      onChange={(e) => handlePickupInputChange('street1', e.target.value)}
                      placeholder="123 Main St"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_street2">Apt/Suite</Label>
                    <Input
                      id="pickup_street2"
                      value={pickupData.street2}
                      onChange={(e) => handlePickupInputChange('street2', e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label htmlFor="pickup_city">City *</Label>
                    <Input
                      id="pickup_city"
                      value={pickupData.city}
                      onChange={(e) => handlePickupInputChange('city', e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_state">State *</Label>
                    <Input
                      id="pickup_state"
                      value={pickupData.state}
                      onChange={(e) => handlePickupInputChange('state', e.target.value)}
                      placeholder="ST"
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="pickup_zip">ZIP *</Label>
                    <Input
                      id="pickup_zip"
                      value={pickupData.zip}
                      onChange={(e) => handlePickupInputChange('zip', e.target.value)}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pickup_phone">Phone</Label>
                  <Input
                    id="pickup_phone"
                    value={pickupData.phone}
                    onChange={(e) => handlePickupInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="button" onClick={() => setActiveTab('destination')}>
                  Next: Destination & Package →
                </Button>
              </div>
            </TabsContent>

            {/* Destination & Package Tab */}
            <TabsContent value="destination" className="space-y-4 mt-4">
              {/* Recipient Information */}
              <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  Recipient (To) Address
                </h3>
                
                <div className="mb-4">
                  <Label htmlFor="to_name">Recipient Name *</Label>
                  <Input
                    id="to_name"
                    value={formData.to_name}
                    onChange={(e) => handleInputChange('to_name', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="mb-4">
                  <Label>Search Address</Label>
                  <AddressAutoComplete
                    onAddressSelected={handleAddressSelect}
                    placeholder="Start typing destination address..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
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
                    <Label htmlFor="to_street2">Apt/Suite</Label>
                    <Input
                      id="to_street2"
                      value={formData.to_street2}
                      onChange={(e) => handleInputChange('to_street2', e.target.value)}
                      placeholder="Apt 4B"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
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

                <div>
                  <Label htmlFor="to_phone">Phone</Label>
                  <Input
                    id="to_phone"
                    value={formData.to_phone}
                    onChange={(e) => handleInputChange('to_phone', e.target.value)}
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>

              {/* Package Dimensions */}
              <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-600" />
                  Package Details
                </h3>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
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

                <div>
                  <Label htmlFor="reference">Reference/Order Number (Optional)</Label>
                  <Input
                    id="reference"
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder="Order #1234"
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setActiveTab('pickup')}>
                  ← Back to Pickup
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding Shipment...' : 'Add Shipment'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddManualShipmentModal;
