import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Check, Plus, Truck, ArrowRight } from 'lucide-react';
import SelectAddressDropdown from './SelectAddressDropdown';
import InstantAddressForm from './InstantAddressForm';
import { SavedAddress } from '@/services/AddressService';

interface PickupAddressOverlayProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (address: SavedAddress) => void;
}

const PickupAddressOverlay: React.FC<PickupAddressOverlayProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleConfirm = () => {
    if (selectedAddress) {
      onConfirm(selectedAddress);
    }
  };

  const handleNewAddressSaved = (address: SavedAddress) => {
    setSelectedAddress(address);
    setShowAddForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-xl backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            Choose Pickup Address
          </DialogTitle>
          <DialogDescription>
            Select the address you want to ship from, or add a new one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Address selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Saved Pickup Addresses</label>
            <SelectAddressDropdown
              onAddressSelected={(addr) => {
                setSelectedAddress(addr);
                setShowAddForm(false);
              }}
              onAddNew={() => setShowAddForm(true)}
              isPickupAddress={true}
              placeholder="Select a pickup address..."
            />
          </div>

          {/* Selected address preview */}
          {selectedAddress && !showAddForm && (
            <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Ship From This Address</span>
              </div>
              <p className="text-sm font-medium text-foreground">{selectedAddress.name || 'Pickup Address'}</p>
              <p className="text-sm text-muted-foreground">{selectedAddress.street1}</p>
              {selectedAddress.street2 && <p className="text-sm text-muted-foreground">{selectedAddress.street2}</p>}
              <p className="text-sm text-muted-foreground">
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zip}
              </p>
              {selectedAddress.phone && (
                <p className="text-xs text-muted-foreground mt-1">📞 {selectedAddress.phone}</p>
              )}
            </div>
          )}

          {/* Add new address button */}
          {!showAddForm && !selectedAddress && (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Pickup Address
            </Button>
          )}

          {/* Inline add address form */}
          {showAddForm && (
            <div className="max-h-[40vh] overflow-y-auto">
              <InstantAddressForm
                onAddressSaved={handleNewAddressSaved}
                isPickupAddress={true}
              />
            </div>
          )}

          {/* Confirm button */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedAddress}
              className="flex-1 gap-2"
            >
              <Truck className="h-4 w-4" />
              Confirm & Fetch Rates
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PickupAddressOverlay;
