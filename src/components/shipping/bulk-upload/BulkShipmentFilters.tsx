
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CarrierOption, CARRIER_OPTIONS } from '@/types/shipping';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField: 'recipient' | 'rate' | 'carrier';
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: 'recipient' | 'rate' | 'carrier', direction: 'asc' | 'desc') => void;
  selectedCarrier: string | null;
  onCarrierFilterChange: (carrier: string | null) => void;
  onApplyCarrierToAll: (carrierId: string, serviceId: string) => void;
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
  const [selectedCarrierForAll, setSelectedCarrierForAll] = useState<string>('');
  const [selectedServiceForAll, setSelectedServiceForAll] = useState<string>('');
  
  const handleApplyToAll = () => {
    if (selectedCarrierForAll && selectedServiceForAll) {
      onApplyCarrierToAll(selectedCarrierForAll, selectedServiceForAll);
    }
  };
  
  const toggleSort = (field: 'recipient' | 'rate' | 'carrier') => {
    if (sortField === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };
  
  // Filter CARRIER_OPTIONS to just get carrier names for the dropdown
  const uniqueCarriers = CARRIER_OPTIONS.map(carrier => ({
    id: carrier.id,
    name: carrier.name
  }));
  
  // Get services for the selected carrier
  const servicesForSelectedCarrier = CARRIER_OPTIONS.find(
    c => c.id === selectedCarrierForAll
  )?.services || [];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex flex-row gap-2">
          <Button 
            variant={sortField === 'recipient' ? 'default' : 'outline'} 
            onClick={() => toggleSort('recipient')}
            className="flex items-center gap-1"
          >
            Name
            {sortField === 'recipient' && (
              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
            )}
          </Button>
          
          <Button 
            variant={sortField === 'rate' ? 'default' : 'outline'}
            onClick={() => toggleSort('rate')}
            className="flex items-center gap-1"
          >
            Rate
            {sortField === 'rate' && (
              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
            )}
          </Button>
          
          <Button 
            variant={sortField === 'carrier' ? 'default' : 'outline'}
            onClick={() => toggleSort('carrier')}
            className="flex items-center gap-1"
          >
            Carrier
            {sortField === 'carrier' && (
              sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div>
          <Select
            value={selectedCarrier || ''}
            onValueChange={(value) => onCarrierFilterChange(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  {selectedCarrier ? 
                    CARRIER_OPTIONS.find(c => c.id === selectedCarrier)?.name || selectedCarrier : 
                    'All Carriers'}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {uniqueCarriers.map((carrier) => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-sm font-semibold mb-3">Apply Carrier to All Shipments</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Carrier</label>
            <Select
              value={selectedCarrierForAll}
              onValueChange={setSelectedCarrierForAll}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent>
                {CARRIER_OPTIONS.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Service</label>
            <Select
              value={selectedServiceForAll}
              onValueChange={setSelectedServiceForAll}
              disabled={!selectedCarrierForAll}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {servicesForSelectedCarrier.map((service) => (
                  <SelectItem key={service.id} value={service.name}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleApplyToAll}
            disabled={!selectedCarrierForAll || !selectedServiceForAll}
          >
            Apply to All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
