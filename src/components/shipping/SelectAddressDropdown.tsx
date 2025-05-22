
import React, { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { formatAddressForDisplay } from '@/utils/addressUtils';

interface SelectAddressDropdownProps {
  onAddressSelected: (address: SavedAddress | null) => void;
  onAddNew: () => void;
  defaultAddress?: SavedAddress | null;
  placeholder?: string;
  isPickupAddress?: boolean;
  className?: string;
}

const SelectAddressDropdown: React.FC<SelectAddressDropdownProps> = ({
  onAddressSelected,
  onAddNew,
  defaultAddress = null,
  placeholder = 'Select an address',
  isPickupAddress = true,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(defaultAddress);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadAddresses = async () => {
      setIsLoading(true);
      try {
        const savedAddresses = await addressService.getSavedAddresses();
        setAddresses(savedAddresses);

        // If no address is selected but there's a default, select it
        if (!selectedAddress) {
          const defaultAddr = isPickupAddress 
            ? savedAddresses.find(addr => addr.is_default_from)
            : savedAddresses.find(addr => addr.is_default_to);
          
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
            onAddressSelected(defaultAddr);
          }
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Failed to load saved addresses');
      } finally {
        setIsLoading(false);
      }
    };

    loadAddresses();
  }, [isPickupAddress]);

  useEffect(() => {
    // When defaultAddress changes from outside, update selection
    if (defaultAddress && (!selectedAddress || defaultAddress.id !== selectedAddress.id)) {
      setSelectedAddress(defaultAddress);
    }
  }, [defaultAddress]);

  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddress(address);
    onAddressSelected(address);
    setOpen(false);
  };

  const getAddressLabel = () => {
    if (!selectedAddress) return placeholder;
    return selectedAddress.name || formatAddressForDisplay(selectedAddress).split(',')[0];
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading}
          className={`w-full justify-between ${className}`}
        >
          {isLoading ? (
            <span className="text-muted-foreground">Loading addresses...</span>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">{getAddressLabel()}</span>
            </>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search address..." />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No addresses found</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onAddNew();
                    setOpen(false);
                  }}
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new address
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup heading={isPickupAddress ? "Pickup Addresses" : "Recipient Addresses"}>
              {addresses.map((address) => (
                <CommandItem
                  key={address.id}
                  value={`${address.id}-${address.name || address.street1}`}
                  onSelect={() => handleSelectAddress(address)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start mr-2">
                    <Check
                      className={cn(
                        "h-4 w-4 mt-0.5",
                        selectedAddress?.id === address.id 
                          ? "opacity-100" 
                          : "opacity-0"
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {address.name || 'Unnamed Address'}
                      {isPickupAddress && address.is_default_from && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                      {!isPickupAddress && address.is_default_to && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatAddressForDisplay(address)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem 
                onSelect={() => {
                  onAddNew();
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="font-medium text-blue-600 flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Add new address
                </span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SelectAddressDropdown;
