
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Check, ChevronsUpDown, MapPin, Plus, RefreshCw } from 'lucide-react';
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

  // Refresh addresses function with proper state management
  const refreshAddresses = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Refreshing addresses for dropdown...');
      const { data } = await addressService.getSession();
      if (!data?.session?.user) {
        console.log('User not authenticated, skipping address loading');
        setAddresses([]);
        return;
      }
      
      const savedAddresses = await addressService.getSavedAddresses();
      console.log('Refreshed addresses for dropdown:', savedAddresses);
      setAddresses(savedAddresses || []);
      toast.success('Addresses refreshed successfully');
    } catch (error) {
      console.error('Error refreshing addresses:', error);
      toast.error('Failed to refresh addresses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load addresses on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadAddresses = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
      try {
        console.log('Loading addresses for dropdown...');
        const { data } = await addressService.getSession();
        if (!data?.session?.user) {
          console.log('User not authenticated, skipping address loading');
          if (isMounted) {
            setAddresses([]);
            setIsLoading(false);
          }
          return;
        }
        
        const savedAddresses = await addressService.getSavedAddresses();
        console.log('Loaded addresses for dropdown:', savedAddresses);
        
        if (isMounted) {
          setAddresses(savedAddresses || []);

          // Auto-select default if no address is currently selected
          if (!selectedAddress && savedAddresses?.length > 0) {
            const defaultAddr = isPickupAddress 
              ? savedAddresses.find(addr => addr.is_default_from)
              : savedAddresses.find(addr => addr.is_default_to);
            
            if (defaultAddr) {
              console.log('Auto-selecting default address:', defaultAddr);
              setSelectedAddress(defaultAddr);
              onAddressSelected(defaultAddr);
            }
          }
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        if (isMounted) {
          toast.error('Failed to load saved addresses');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAddresses();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

  // Handle external default address changes
  useEffect(() => {
    if (defaultAddress && (!selectedAddress || defaultAddress.id !== selectedAddress.id)) {
      console.log('Setting selected address from default prop:', defaultAddress);
      setSelectedAddress(defaultAddress);
    }
  }, [defaultAddress?.id]);

  const handleSelectAddress = useCallback((address: SavedAddress) => {
    console.log('Address selected from dropdown:', address);
    setSelectedAddress(address);
    onAddressSelected(address);
    setOpen(false);
    toast.success('Address selected successfully');
  }, [onAddressSelected]);

  const handleAddNew = useCallback(() => {
    onAddNew();
    setOpen(false);
  }, [onAddNew]);

  const handleClearSelection = useCallback(() => {
    console.log('Clearing address selection');
    setSelectedAddress(null);
    onAddressSelected(null);
    toast.info('Address selection cleared');
  }, [onAddressSelected]);

  // Memoize the address label to prevent recalculation
  const addressLabel = useMemo(() => {
    if (!selectedAddress) return placeholder;
    return selectedAddress.name || formatAddressForDisplay(selectedAddress).split(',')[0];
  }, [selectedAddress, placeholder]);

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
          <div className="flex items-center justify-between w-full">
            {isLoading ? (
              <span className="text-muted-foreground">Loading addresses...</span>
            ) : (
              <div className="flex items-center flex-1 min-w-0">
                <MapPin className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{addressLabel}</span>
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-white z-50" align="start">
        <Command className="bg-white">
          <CommandInput placeholder="Search address..." className="bg-white" />
          <CommandList className="bg-white max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No addresses found</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={refreshAddresses}
                    disabled={isLoading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddNew}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add new
                  </Button>
                </div>
              </div>
            </CommandEmpty>
            <CommandGroup heading={isPickupAddress ? "Pickup Addresses" : "Recipient Addresses"}>
              {addresses.map((address) => (
                <CommandItem
                  key={address.id}
                  value={`${address.id}-${address.name || address.street1}`}
                  onSelect={() => {
                    console.log('Selecting address:', address);
                    handleSelectAddress(address);
                  }}
                  className="cursor-pointer hover:bg-gray-50"
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
              {selectedAddress && (
                <CommandItem 
                  onSelect={handleClearSelection}
                  className="cursor-pointer hover:bg-gray-50 text-red-600"
                >
                  <span className="font-medium flex items-center">
                    Clear Selection
                  </span>
                </CommandItem>
              )}
              <CommandItem 
                onSelect={refreshAddresses}
                className="cursor-pointer hover:bg-gray-50"
                disabled={isLoading}
              >
                <span className="font-medium text-blue-600 flex items-center">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Addresses
                </span>
              </CommandItem>
              {/* Only show "Add new address" option for pickup addresses */}
              {isPickupAddress && (
                <CommandItem 
                  onSelect={handleAddNew}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <span className="font-medium text-green-600 flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add new address
                  </span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SelectAddressDropdown;
