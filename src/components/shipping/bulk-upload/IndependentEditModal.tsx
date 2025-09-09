import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, AlertTriangle, Phone, Globe } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface IndependentEditModalProps {
  shipment: BulkShipment;
  pickupAddress: any;
  onLocalUpdate: (shipmentId: string, updatedShipment: BulkShipment, newRates: any[]) => void;
}

const IndependentEditModal: React.FC<IndependentEditModalProps> = ({
  shipment,
  pickupAddress,
  onLocalUpdate
}) => {
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: shipment.customer_name || shipment.recipient || '',
    weight: Number(shipment.details?.weight || 1), // ALWAYS POUNDS
    length: Number(shipment.details?.length || 1),
    width: Number(shipment.details?.width || 1),
    height: Number(shipment.details?.height || 1),
    declared_value: Number(shipment.details?.declared_value || 100),
    insurance_enabled: shipment.details?.insurance_enabled !== false,
    phone_number: shipment.details?.phone_number || '',
    to_country: shipment.details?.to_country || 'US'
  });

  const isInternational = editData.to_country !== 'US' && editData.to_country !== 'USA';
  const isFedEx = shipment.carrier?.toLowerCase().includes('fedex');

  const validateShipment = (): boolean => {
    if (isFedEx && !editData.phone_number.trim()) {
      toast.error('FedEx shipments require a phone number');
      return false;
    }

    if (editData.weight <= 0 || editData.length <= 0 || editData.width <= 0 || editData.height <= 0) {
      toast.error('All dimensions and weight must be greater than 0');
      return false;
    }

    return true;
  };

  const fetchNormalShippingRates = async (requestData: any) => {
    try {
      console.log('IndependentEditModal: Calling normal shipping rates with:', requestData);
      
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          toAddress: requestData.toAddress,
          parcel: requestData.parcel,
          fromAddress: requestData.fromAddress
        }
      });

      if (error) {
        console.error('IndependentEditModal: Error from get-shipping-rates:', error);
        throw error;
      }

      if (!data || !data.rates || !Array.isArray(data.rates)) {
        console.error('IndependentEditModal: Invalid response format:', data);
        throw new Error('Invalid response format from shipping rates API');
      }

      console.log('IndependentEditModal: Successfully fetched rates:', data.rates);
      return data.rates;
    } catch (error) {
      console.error('IndependentEditModal: Error fetching rates:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    console.log('IndependentEditModal: Starting save process', { shipmentId: shipment.id, editData });
    
    if (!validateShipment()) {
      return;
    }

    if (!pickupAddress) {
      toast.error('Pickup address is required');
      return;
    }

    setIsRefreshing(true);

    try {
      // STEP 1: Create updated shipment object (LOCAL SAVE)
      const weight = Number(editData.weight); // POUNDS ONLY
      const insuranceCost = editData.insurance_enabled && editData.declared_value > 0 
        ? Math.max(editData.declared_value * 0.02, 1) 
        : 0;

      const updatedShipment: BulkShipment = {
        ...shipment,
        customer_name: editData.customer_name,
        recipient: editData.customer_name,
        insurance_cost: insuranceCost,
        details: {
          ...shipment.details,
          weight: weight, // POUNDS ONLY
          length: editData.length,
          width: editData.width,
          height: editData.height,
          declared_value: editData.declared_value,
          insurance_enabled: editData.insurance_enabled,
          phone_number: editData.phone_number,
          to_country: editData.to_country,
          to_name: editData.customer_name,
          to_street1: shipment.details?.to_street1 || '',
          to_city: shipment.details?.to_city || '',
          to_state: shipment.details?.to_state || '',
          to_zip: shipment.details?.to_zip || '',
        }
      };

      console.log('IndependentEditModal: Created updated shipment (LOCAL):', {
        shipmentId: shipment.id,
        weightInPounds: weight,
        dimensions: { length: editData.length, width: editData.width, height: editData.height },
        updatedShipment
      });

      // STEP 2: Prepare request for normal shipping rates with FROM address
      const requestData = {
        fromAddress: {
          name: pickupAddress.name || '',
          company: pickupAddress.company || '',
          street1: pickupAddress.street1 || '',
          street2: pickupAddress.street2 || '',
          city: pickupAddress.city || '',
          state: pickupAddress.state || '',
          zip: pickupAddress.zip || '',
          country: pickupAddress.country || 'US',
          phone: pickupAddress.phone || '',
        },
        toAddress: {
          name: editData.customer_name,
          company: shipment.details?.to_company || '',
          street1: shipment.details?.to_street1 || '',
          street2: shipment.details?.to_street2 || '',
          city: shipment.details?.to_city || '',
          state: shipment.details?.to_state || '',
          zip: shipment.details?.to_zip || '',
          country: editData.to_country,
          phone: editData.phone_number,
        },
        parcel: {
          length: editData.length,
          width: editData.width,
          height: editData.height,
          weight: weight // POUNDS ONLY
        }
      };

      console.log('IndependentEditModal: Fetching new rates with FROM address...', requestData);
      
      // STEP 3: Fetch new rates using normal shipping endpoint
      const newRates = await fetchNormalShippingRates(requestData);
      
      console.log('IndependentEditModal: Received new rates:', newRates);

      // STEP 4: Update local frontend with changes + new rates
      onLocalUpdate(shipment.id, updatedShipment, newRates);

      setOpen(false);
      toast.success('✅ Shipment updated locally and rates refreshed!');
      
      console.log('IndependentEditModal: Successfully completed local save and rate refresh');
      
    } catch (error) {
      console.error('IndependentEditModal: Error during save/refresh:', error);
      toast.error('❌ Failed to update shipment or refresh rates');
    } finally {
      setIsRefreshing(false);
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
            Edit Shipment Details (Independent Mode)
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
              <Label htmlFor="weight" className="font-bold text-lg text-blue-700 bg-blue-100 p-2 rounded">
                📦 WEIGHT - POUNDS ONLY (NO OUNCES!)
              </Label>
              <Input
                id="weight"
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                step="0.1"
                min="0.1"
                placeholder="Enter weight in POUNDS (e.g., 2.5)"
                className="border-blue-400 focus:border-blue-600 text-lg font-bold bg-blue-50"
              />
              <div className="bg-blue-200 p-3 rounded mt-2 border-2 border-blue-500">
                <p className="text-sm text-blue-900 font-bold">
                  ⚠️ POUNDS ONLY - NO OUNCES! ⚠️
                </p>
                <p className="text-xs text-blue-800 font-semibold">
                  • 2.5 lbs = enter "2.5"<br/>
                  • 1 lb = enter "1.0"<br/>
                  • System uses POUNDS exclusively
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isRefreshing}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isRefreshing}
          >
            <Save className="h-4 w-4 mr-1" />
            {isRefreshing ? 'Updating...' : 'Save & Refresh Rates'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndependentEditModal;