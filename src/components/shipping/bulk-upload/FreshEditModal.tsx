import React, { useState } from 'react';
import { Edit, RefreshCw } from 'lucide-react';

// Use project UI components and utils instead of inline stubs
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { convertOuncesToPounds, convertPoundsToOunces } from "@/utils/weightConversion";

// Local helpers for kg conversion
const poundsToKg = (lb: number) => Number((lb * 0.45359237).toFixed(2));
const kgToPounds = (kg: number) => Number((kg / 0.45359237).toFixed(2));
const kgToOunces = (kg: number) => Number((kg * 35.27396195).toFixed(2));
const ouncesToKg = (oz: number) => Number((oz / 35.27396195).toFixed(2));

// Minimal props typing for reliability
interface FreshEditModalProps {
  shipment: any;
  pickupAddress: any;
  onUpdateShipment: (id: string, updated: any) => void;
}

// ... keep existing code (component implementation continues)

const FreshEditModal = ({
  shipment,
  pickupAddress,
  onUpdateShipment
}: FreshEditModalProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  // Determine initial weight from shipment details (stored in ounces)
  const initialWeightOz = (shipment?.details?.weight ?? shipment?.details?.parcel_weight ?? shipment?.weight ?? 0) as number;
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb'); // Always default to pounds

  // Local state for shipment data - now including address fields
  const [localData, setLocalData] = useState({
    recipient: shipment.details?.to_name || shipment.recipient || shipment.customer_name || '',
    phone: shipment.details?.to_phone || shipment.customer_phone || shipment.phone || '',
    country: shipment.details?.to_country || shipment.country || 'US',
    street1: shipment.details?.to_street1 || shipment.customer_address?.street1 || '',
    street2: shipment.details?.to_street2 || shipment.customer_address?.street2 || '',
    city: shipment.details?.to_city || shipment.customer_address?.city || '',
    state: shipment.details?.to_state || shipment.customer_address?.state || '',
    zip: shipment.details?.to_zip || shipment.customer_address?.zip || '',
    weight: Math.max(0.1, convertOuncesToPounds(initialWeightOz)), // display in pounds by default, minimum 0.1 lb
    length: (shipment.details?.length ?? shipment.details?.parcel_length ?? shipment.length ?? 0) as number,
    width: (shipment.details?.width ?? shipment.details?.parcel_width ?? shipment.width ?? 0) as number,
    height: (shipment.details?.height ?? shipment.details?.parcel_height ?? shipment.height ?? 0) as number,
    declared_value: shipment.declared_value || 0,
    insurance_enabled: shipment.insurance_enabled || false
  });

  const fetchRatesFromNormalShipping = async () => {
    setIsLoading(true);
    setRates([]);
    setSelectedRate(null);

    try {
      // Log props received by the component for debugging
      console.log('Component props received:', { shipment, pickupAddress });
      
      // Validate pickupAddress (must be provided from parent/hook)
      if (!pickupAddress || !pickupAddress.street1 || !pickupAddress.city || !pickupAddress.state || !pickupAddress.zip || !pickupAddress.country) {
        toast.error('Pickup address is missing. Please set your pickup address in Settings.');
        setIsLoading(false);
        return;
      }

      // Use provided pickupAddress directly (no fake fallbacks)
      const fromAddress = {
        name: pickupAddress.name || pickupAddress.company || 'Sender',
        company: pickupAddress.company || '',
        street1: pickupAddress.street1,
        street2: pickupAddress.street2 || '',
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip: pickupAddress.zip,
        country: pickupAddress.country,
        phone: pickupAddress.phone || '',
        email: pickupAddress.email || ''
      };
      
      // Use local form data as-is for recipient
      const toAddress = {
        name: localData.recipient || 'Recipient',
        company: shipment.company || '',
        street1: localData.street1,
        street2: localData.street2 || '',
        city: localData.city,
        state: localData.state,
        zip: localData.zip,
        country: localData.country,
        phone: localData.phone || '',
        email: shipment.email || ''
      };

      // Format parcel data - convert to ounces for backend based on selected unit
      const weightOz = weightUnit === 'lb'  
        ? convertPoundsToOunces(localData.weight)
        : kgToOunces(localData.weight);

      const parcel = {
        weight: weightOz,
        length: localData.length,
        width: localData.width,
        height: localData.height
      };
      
      const payload = {
        fromAddress,
        toAddress,
        parcel,
        declaredValue: localData.declared_value
      };
      console.log('Sending payload to backend (via Supabase):', JSON.stringify(payload, null, 2));

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        console.error('Server responded with an error:', error);
        throw new Error('Failed to fetch rates: ' + (error.message || 'Unknown server error'));
      }

      if (data && data.rates && data.rates.length > 0) {
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

  const handleSaveChanges = async () => {
    console.log('💾 Saving shipment changes...');
    
    try {
      // Validate required fields
      if (!localData.recipient || !localData.street1 || !localData.city || !localData.state || !localData.zip) {
        toast.error('Please fill in all required fields (name, address, city, state, zip)');
        return;
      }

      if (!localData.weight || localData.weight <= 0) {
        toast.error('Weight must be greater than 0');
        return;
      }

      // Calculate insurance cost
      const insuranceCost = localData.insurance_enabled  
        ? Math.max(1, localData.declared_value * 0.02)  
        : 0;

      // Normalize weight to ounces based on selected unit - FIXED CONVERSION
      let weightOzToSave;
      if (weightUnit === 'lb') {
        weightOzToSave = convertPoundsToOunces(localData.weight);
      } else {
        weightOzToSave = kgToOunces(localData.weight);
      }

      console.log(`🔢 Weight conversion: ${localData.weight} ${weightUnit} = ${weightOzToSave} oz`);

      // Create comprehensive updated shipment with ALL fields properly mapped
      const updatedShipment = {
        ...shipment,
        // Primary fields
        recipient: localData.recipient.trim(),
        customer_name: localData.recipient.trim(),
        phone: localData.phone.trim(),
        customer_phone: localData.phone.trim(),
        country: localData.country,
        
        // Address structure - multiple formats for compatibility
        customer_address: {
          street1: localData.street1.trim(),
          street2: localData.street2.trim(),
          city: localData.city.trim(),
          state: localData.state.trim(),
          zip: localData.zip.trim()
        },
        
        // Package dimensions and weight
        weight: weightOzToSave,
        length: localData.length,
        width: localData.width,
        height: localData.height,
        declared_value: localData.declared_value,
        insurance_enabled: localData.insurance_enabled,
        insurance_cost: insuranceCost,
        
        // Rate data - preserve existing unless a new rate is selected
        ...(selectedRate ? {
          carrier: selectedRate.carrier,
          service: selectedRate.service,
          rate: selectedRate.rate,
          selectedRateId: selectedRate.id,
          easypost_id: shipment.easypost_id,
          availableRates: rates,
        } : {
          carrier: shipment.carrier,
          service: shipment.service,
          rate: shipment.rate,
          selectedRateId: shipment.selectedRateId,
          easypost_id: shipment.easypost_id,
          availableRates: shipment.availableRates || [],
        }),
        status: 'processed' as const,
        
        // Comprehensive details object for API calls
        details: {
          to_name: localData.recipient.trim(),
          to_phone: localData.phone.trim(),
          to_country: localData.country,
          to_street1: localData.street1.trim(),
          to_street2: localData.street2.trim(),
          to_city: localData.city.trim(),
          to_state: localData.state.trim(),
          to_zip: localData.zip.trim(),
          length: localData.length,
          width: localData.width,
          height: localData.height,
          weight: weightOzToSave,
          parcel_length: localData.length,
          parcel_width: localData.width,
          parcel_height: localData.height,
          parcel_weight: weightOzToSave,
          declared_value: localData.declared_value,
          insurance_enabled: localData.insurance_enabled,
          insurance_cost: insuranceCost
        }
      };

      console.log('📦 Complete updated shipment data:', updatedShipment);

      // Call parent update function
      await onUpdateShipment(shipment.id, updatedShipment);
      
      // Close modal and show success
      setOpen(false);
      toast.success('✅ Shipment saved! Rates will be refreshed automatically.');
      
    } catch (error) {
      console.error('❌ Error saving shipment:', error);
      toast.error('Failed to save shipment changes');
    }
  };

  const handleOpenModal = () => {
    setOpen(true);
    // REMOVED: Auto-fetch rates when modal opens
    // This removes the race condition and ensures the "save first, then fetch" flow is enforced by the parent component (BulkUploadView.tsx).
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleOpenModal}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shipment Details</DialogTitle>
            <DialogDescription>
              Update recipient address, package dimensions and weight. Rates will use your saved pickup address.
            </DialogDescription>
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
                <Label htmlFor="street1">Street 1</Label>
                <Input
                  id="street1"
                  value={localData.street1}
                  onChange={(e) => setLocalData(prev => ({ ...prev, street1: e.target.value }))}
                  placeholder="Enter street address"
                />
              </div>

              <div>
                <Label htmlFor="street2">Street 2</Label>
                <Input
                  id="street2"
                  value={localData.street2}
                  onChange={(e) => setLocalData(prev => ({ ...prev, street2: e.target.value }))}
                  placeholder="Enter apartment or unit"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={localData.city}
                  onChange={(e) => setLocalData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={localData.state}
                  onChange={(e) => setLocalData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Enter state code (e.g., CA)"
                />
              </div>
              
              <div>
                <Label htmlFor="zip">Zip Code</Label>
                <Input
                  id="zip"
                  value={localData.zip}
                  onChange={(e) => setLocalData(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="Enter zip code"
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
                <Label htmlFor="weight">Weight</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localData.weight}
                    onChange={(e) => setLocalData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    placeholder={weightUnit === 'lb' ? 'Weight in pounds' : 'Weight in kilograms'}
                    className="col-span-2"
                  />
                  <Select
                    value={weightUnit}
                    onValueChange={(val: 'lb' | 'kg') => {
                      setWeightUnit((prevUnit) => {
                        // Convert displayed weight when switching units
                        if (prevUnit === 'lb' && val === 'kg') {
                          setLocalData(prev => ({ ...prev, weight: poundsToKg(prev.weight) }));
                        } else if (prevUnit === 'kg' && val === 'lb') {
                          setLocalData(prev => ({ ...prev, weight: kgToPounds(prev.weight) }));
                        }
                        return val;
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Weight display defaults to pounds (lb). You can switch to kg if needed.</p>
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
                  (Cost: ${Math.max(1, localData.declared_value * 0.02).toFixed(2)})
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
              <Button onClick={handleSaveChanges}>
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
