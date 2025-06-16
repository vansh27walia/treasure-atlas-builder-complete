
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CARRIER_OPTIONS } from '@/types/shipping';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField: 'recipient' | 'rate' | 'carrier';
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: 'recipient' | 'rate' | 'carrier', direction: 'asc' | 'desc') => void;
  selectedCarrier: string | null;
  onCarrierFilterChange: (carrier: string | null) => void;
  onApplyCarrierToAll: (carrier: string, service: string) => void;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  selectedCarrier,
  onCarrierFilterChange,
  onApplyCarrierToAll
}) => {
  const [selectedCarrierService, setSelectedCarrierService] = useState<{carrierId: string, serviceId: string} | null>(null);
  const [availableServices, setAvailableServices] = useState<Array<{id: string, name: string}>>([]);
  
  // Update available services when carrier changes
  useEffect(() => {
    if (selectedCarrierService?.carrierId) {
      const carrier = CARRIER_OPTIONS.find(c => c.id === selectedCarrierService.carrierId);
      if (carrier) {
        setAvailableServices(carrier.services);
        // Auto select first service if current service doesn't exist in this carrier
        if (!carrier.services.some(s => s.id === selectedCarrierService.serviceId)) {
          setSelectedCarrierService({
            carrierId: selectedCarrierService.carrierId,
            serviceId: carrier.services[0]?.id || ''
          });
        }
      }
    } else {
      setAvailableServices([]);
    }
  }, [selectedCarrierService?.carrierId]);

  // Handle apply to all button click
  const handleApplyToAll = () => {
    if (selectedCarrierService?.carrierId && selectedCarrierService?.serviceId) {
      onApplyCarrierToAll(
        CARRIER_OPTIONS.find(c => c.id === selectedCarrierService.carrierId)?.name || '',
        availableServices.find(s => s.id === selectedCarrierService.serviceId)?.name || ''
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="relative flex-grow">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search by recipient, address, carrier..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <div className="flex gap-2">
        <Select
          value={sortField}
          onValueChange={(value) => onSortChange(value as 'recipient' | 'rate' | 'carrier', sortDirection)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort by</SelectLabel>
              <SelectItem value="recipient">Recipient</SelectItem>
              <SelectItem value="rate">Price</SelectItem>
              <SelectItem value="carrier">Carrier</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
          className="border"
        >
          {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter by carrier</h4>
              
              <RadioGroup 
                value={selectedCarrier || ''} 
                onValueChange={(value) => onCarrierFilterChange(value === '' ? null : value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="all" />
                  <Label htmlFor="all">All carriers</Label>
                </div>
                
                {CARRIER_OPTIONS.map((carrier) => (
                  <div className="flex items-center space-x-2" key={carrier.id}>
                    <RadioGroupItem value={carrier.id} id={carrier.id} />
                    <Label htmlFor={carrier.id}>{carrier.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="mt-3 md:mt-0 border-t pt-3 md:border-t-0 md:pt-0">
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={selectedCarrierService?.carrierId || ''}
            onValueChange={(value) => setSelectedCarrierService({
              carrierId: value,
              serviceId: ''
            })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Carriers</SelectLabel>
                {CARRIER_OPTIONS.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>{carrier.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Select
            value={selectedCarrierService?.serviceId || ''}
            onValueChange={(value) => setSelectedCarrierService({
              ...selectedCarrierService!,
              serviceId: value
            })}
            disabled={!selectedCarrierService?.carrierId || availableServices.length === 0}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Services</SelectLabel>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleApplyToAll}
            disabled={!selectedCarrierService?.carrierId || !selectedCarrierService?.serviceId}
            size="sm"
          >
            Apply to All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
