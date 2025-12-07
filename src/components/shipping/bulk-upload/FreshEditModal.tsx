import React, { useState } from "react";
import { Edit, RefreshCw, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeDiscountPercent } from "@/utils/discount";
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import ToggleableCustomsClearance from '@/components/shipping/ToggleableCustomsClearance';
import CustomsDocumentationModal from '@/components/shipping/CustomsDocumentationModal';

const kgToOunces = (kg: number) => Number((kg * 35.27396195).toFixed(2));

interface FreshEditModalProps {
  shipment: any;
  pickupAddress: any;
  onUpdateShipment: (id: string, updated: any) => void;
  buttonLabel?: string;
}

const FreshEditModal = ({ shipment, pickupAddress, onUpdateShipment, buttonLabel = "Edit" }: FreshEditModalProps) => {
  const [open, setOpen] = useState(false);
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [customsEnabled, setCustomsEnabled] = useState(false);
  const [customsData, setCustomsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const initialWeightOz = (shipment?.details?.weight ?? shipment?.details?.parcel_weight ?? shipment?.weight ?? 0) as number;
  const [weightUnit, setWeightUnit] = useState<"lb" | "oz" | "kg">("lb");

  const [localData, setLocalData] = useState({
    recipient: shipment.details?.to_name || shipment.recipient || shipment.customer_name || "",
    phone: shipment.details?.to_phone || shipment.customer_phone || shipment.phone || "",
    country: shipment.details?.to_country || shipment.country || "US",
    street1: shipment.details?.to_street1 || shipment.customer_address?.street1 || "",
    street2: shipment.details?.to_street2 || shipment.customer_address?.street2 || "",
    city: shipment.details?.to_city || shipment.customer_address?.city || "",
    state: shipment.details?.to_state || shipment.customer_address?.state || "",
    zip: shipment.details?.to_zip || shipment.customer_address?.zip || "",
    weight: Math.max(0.1, initialWeightOz / 16),
    length: (shipment.details?.length ?? shipment.details?.parcel_length ?? shipment.length ?? 0) as number,
    width: (shipment.details?.width ?? shipment.details?.parcel_width ?? shipment.width ?? 0) as number,
    height: (shipment.details?.height ?? shipment.details?.parcel_height ?? shipment.height ?? 0) as number,
    declared_value: shipment.declared_value || 0,
    insurance_enabled: shipment.insurance_enabled || false,
  });

  const fetchRatesFromNormalShipping = async () => {
    setIsLoading(true);
    setRates([]);
    setSelectedRate(null);

    try {
      if (!pickupAddress?.street1 || !pickupAddress?.city || !pickupAddress?.state || !pickupAddress?.zip || !pickupAddress?.country) {
        toast.error("Pickup address is missing. Please set your pickup address in Settings.");
        setIsLoading(false);
        return;
      }

      const fromAddress = {
        name: pickupAddress.name || "Sender",
        company: pickupAddress.company || "",
        street1: pickupAddress.street1,
        street2: pickupAddress.street2 || "",
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip: pickupAddress.zip,
        country: pickupAddress.country,
        phone: pickupAddress.phone || "",
      };

      const toAddress = {
        name: localData.recipient,
        street1: localData.street1,
        street2: localData.street2,
        city: localData.city,
        state: localData.state,
        zip: localData.zip,
        country: localData.country,
        phone: localData.phone,
      };

      let weightInOz = localData.weight;
      if (weightUnit === "lb") {
        weightInOz = localData.weight * 16;
      } else if (weightUnit === "kg") {
        weightInOz = kgToOunces(localData.weight);
      }

      const parcel = {
        length: localData.length,
        width: localData.width,
        height: localData.height,
        weight: weightInOz,
      };

      const payload: any = { fromAddress, toAddress, parcel };
      if (localData.insurance_enabled) {
        payload.declared_value = localData.declared_value;
      }

      const { data: shippingData, error: shippingError } = await supabase.functions.invoke("get-shipping-rates", { body: payload });

      if (shippingError) throw shippingError;
      if (!shippingData?.rates || shippingData.rates.length === 0) {
        toast.error("No rates available for this shipment.");
        setIsLoading(false);
        return;
      }

      setRates(shippingData.rates);
      toast.success(`✅ ${shippingData.rates.length} rates fetched successfully.`);
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast.error("Failed to fetch shipping rates. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      let weightInOz = localData.weight;
      if (weightUnit === "lb") {
        weightInOz = localData.weight * 16;
      } else if (weightUnit === "kg") {
        weightInOz = kgToOunces(localData.weight);
      }

      const insuranceCost = localData.insurance_enabled ? Math.ceil(localData.declared_value / 100) * 2 : 0;

      const updatedShipment = {
        ...shipment,
        details: {
          ...shipment.details,
          to_name: localData.recipient,
          to_phone: localData.phone,
          to_country: localData.country,
          to_street1: localData.street1,
          to_street2: localData.street2,
          to_city: localData.city,
          to_state: localData.state,
          to_zip: localData.zip,
          weight: weightInOz,
          parcel_weight: weightInOz,
          length: localData.length,
          parcel_length: localData.length,
          width: localData.width,
          parcel_width: localData.width,
          height: localData.height,
          parcel_height: localData.height,
        },
        customer_address: {
          street1: localData.street1,
          street2: localData.street2,
          city: localData.city,
          state: localData.state,
          zip: localData.zip,
          country: localData.country,
        },
        customer_name: localData.recipient,
        customer_phone: localData.phone,
        recipient: localData.recipient,
        phone: localData.phone,
        country: localData.country,
        weight: weightInOz,
        length: localData.length,
        width: localData.width,
        height: localData.height,
        declared_value: localData.declared_value,
        insurance_enabled: localData.insurance_enabled,
        insurance_cost: insuranceCost,
      };

      if (selectedRate) {
        updatedShipment.selected_rate_id = selectedRate.id;
        updatedShipment.selected_rate = selectedRate;
      }

      if (customsData) {
        updatedShipment.details.customs_info = customsData;
      }

      await onUpdateShipment(shipment.id, updatedShipment);
      setOpen(false);
      toast.success("✅ Shipment saved! Rates will be refreshed automatically.");
    } catch (error) {
      console.error("❌ Error saving shipment:", error);
      toast.error("Failed to save shipment changes");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          {buttonLabel === "Edit" && <Edit className="h-4 w-4 mr-1" />}
          {buttonLabel !== "Edit" && <Plus className="h-4 w-4 mr-1" />}
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipment Details</DialogTitle>
          <DialogDescription>
            Update recipient address, package dimensions and weight. Rates will use your saved pickup address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient">Recipient Name</Label>
              <Input id="recipient" value={localData.recipient} onChange={(e) => setLocalData((prev) => ({ ...prev, recipient: e.target.value }))} placeholder="Enter recipient name" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={localData.phone} onChange={(e) => setLocalData((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Enter phone number" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Address (Google Autocomplete)</Label>
              <AddressAutoComplete
                onChange={(value) => setLocalData(prev => ({ ...prev, street1: value }))}
                onAddressSelected={(address) => {
                  console.log('Address selected:', address);
                }}
                onFullAddressPopulated={(addressData) => {
                  console.log('Full address populated:', addressData);
                  setLocalData(prev => ({
                    ...prev,
                    street1: addressData.street || '',
                    city: addressData.city || '',
                    state: addressData.state || '',
                    zip: addressData.zip || '',
                    country: addressData.country || 'US'
                  }));
                }}
                placeholder="Start typing address..."
              />
            </div>
            <div>
              <Label htmlFor="street2">Street Address 2</Label>
              <Input id="street2" value={localData.street2} onChange={(e) => setLocalData((prev) => ({ ...prev, street2: e.target.value }))} placeholder="Apt, suite, etc. (optional)" />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={localData.city} onChange={(e) => setLocalData((prev) => ({ ...prev, city: e.target.value }))} placeholder="Enter city" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" value={localData.state} onChange={(e) => setLocalData((prev) => ({ ...prev, state: e.target.value }))} placeholder="Enter state code (e.g., CA)" />
            </div>
            <div>
              <Label htmlFor="zip">Zip Code</Label>
              <Input id="zip" value={localData.zip} onChange={(e) => setLocalData((prev) => ({ ...prev, zip: e.target.value }))} placeholder="Enter zip code" />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={localData.country} onValueChange={(value) => setLocalData((prev) => ({ ...prev, country: value }))}>
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
            </div>
            {localData.country !== 'US' && (
              <div className="md:col-span-2">
                <ToggleableCustomsClearance
                  enabled={customsEnabled}
                  onToggle={(enabled) => {
                    setCustomsEnabled(enabled);
                    if (enabled) {
                      setCustomsModalOpen(true);
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Length (in)</Label>
              <Input type="number" step="0.1" min="0.1" value={localData.length} onChange={(e) => setLocalData((prev) => ({ ...prev, length: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Width (in)</Label>
              <Input type="number" step="0.1" min="0.1" value={localData.width} onChange={(e) => setLocalData((prev) => ({ ...prev, width: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Height (in)</Label>
              <Input type="number" step="0.1" min="0.1" value={localData.height} onChange={(e) => setLocalData((prev) => ({ ...prev, height: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Weight</Label>
              <Input type="number" step="0.01" min="0.01" value={localData.weight} onChange={(e) => setLocalData((prev) => ({ ...prev, weight: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={weightUnit} onValueChange={(v) => setWeightUnit(v as any)}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">Pounds (lb)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Declared Value ($)</Label>
              <Input type="number" step="1" min="0" value={localData.declared_value} onChange={(e) => setLocalData((prev) => ({ ...prev, declared_value: Number(e.target.value) }))} />
            </div>
          </div>

          <Button onClick={fetchRatesFromNormalShipping} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Fetching Rates..." : "Refresh Rates"}
          </Button>

          <div className="flex items-center space-x-2">
            <input type="checkbox" id="insurance" checked={localData.insurance_enabled} onChange={(e) => setLocalData((prev) => ({ ...prev, insurance_enabled: e.target.checked }))} className="h-4 w-4" />
            <Label htmlFor="insurance">Enable Insurance</Label>
            {localData.insurance_enabled && <span className="text-sm text-muted-foreground">(Cost: ${Math.ceil(localData.declared_value / 100) * 2})</span>}
          </div>

          {rates.length > 0 && (
            <>
              <h4 className="font-semibold">Available Shipping Rates:</h4>
              <div className="grid gap-2">
                {rates.map((rate) => {
                  const hasDiscount = rate.list_rate || rate.retail_rate;
                  const originalPrice = hasDiscount ? rate.list_rate || rate.retail_rate : null;
                  const discountPercent = originalPrice ? computeDiscountPercent(originalPrice, rate.rate, { clampMin: 60, clampMax: 90 }) : 0;
                  return (
                    <div key={rate.id} className={`p-3 border rounded cursor-pointer transition-colors ${selectedRate?.id === rate.id ? "border-blue-600 bg-blue-600/5" : "hover:border-blue-600/50"}`} onClick={() => setSelectedRate(rate)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{rate.carrier} - {rate.service}</div>
                          {rate.delivery_days && <div className="text-sm text-gray-500">Delivery: {rate.delivery_days} business days</div>}
                        </div>
                        <div className="text-right">
                          {hasDiscount && discountPercent > 0 && (
                            <div className="flex flex-col items-end mb-1">
                              <span className="text-sm text-muted-foreground line-through">${Number(originalPrice).toFixed(2)}</span>
                              <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Save {discountPercent}%</span>
                            </div>
                          )}
                          <div className="text-lg font-bold text-green-600">${Number(rate.rate).toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
      
      <CustomsDocumentationModal
        isOpen={customsModalOpen}
        onClose={() => setCustomsModalOpen(false)}
        onSubmit={(data) => {
          setCustomsData(data);
          setCustomsEnabled(true);
          toast.success('Customs documentation saved');
        }}
        fromCountry="US"
        toCountry={localData.country}
        initialData={customsData}
      />
    </Dialog>
  );
};

export default FreshEditModal;