
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CARRIER_OPTIONS } from '@/types/shipping';
import { Search, SortAsc, SortDesc, Filter, Package } from 'lucide-react';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: any, direction: 'asc' | 'desc') => void;
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
  const [bulkCarrier, setBulkCarrier] = useState('');
  const [bulkService, setBulkService] = useState('');
  
  const handleSortToggle = (field: string) => {
    if (field === sortField) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  // Group carriers for organized display
  const getServicesForCarrier = (carrierId: string) => {
    const carrier = CARRIER_OPTIONS.find(c => c.id.toLowerCase() === carrierId.toLowerCase());
    return carrier?.services || [];
  };
  
  // Available carriers for bulk application
  const availableCarriers = CARRIER_OPTIONS.map(c => ({
    id: c.id,
    name: c.name
  }));
  
  // Available services based on selected carrier
  const availableServices = bulkCarrier 
    ? getServicesForCarrier(bulkCarrier) 
    : [];

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input 
            placeholder="Search shipments..." 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSortToggle('recipient')}
            className={`h-10 ${sortField === 'recipient' ? 'bg-gray-100' : ''}`}
          >
            Name
            {sortField === 'recipient' && (
              sortDirection === 'asc' 
                ? <SortAsc className="ml-2 h-4 w-4" /> 
                : <SortDesc className="ml-2 h-4 w-4" />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSortToggle('carrier')}
            className={`h-10 ${sortField === 'carrier' ? 'bg-gray-100' : ''}`}
          >
            Carrier
            {sortField === 'carrier' && (
              sortDirection === 'asc' 
                ? <SortAsc className="ml-2 h-4 w-4" /> 
                : <SortDesc className="ml-2 h-4 w-4" />
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleSortToggle('rate')}
            className={`h-10 ${sortField === 'rate' ? 'bg-gray-100' : ''}`}
          >
            Price
            {sortField === 'rate' && (
              sortDirection === 'asc' 
                ? <SortAsc className="ml-2 h-4 w-4" /> 
                : <SortDesc className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50 p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by carrier:</span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={selectedCarrier === null ? "secondary" : "outline"} 
              size="sm"
              onClick={() => onCarrierFilterChange(null)}
            >
              All
            </Button>
            
            {CARRIER_OPTIONS.map(carrier => (
              <Button 
                key={carrier.id}
                variant={selectedCarrier === carrier.id ? "secondary" : "outline"} 
                size="sm"
                onClick={() => onCarrierFilterChange(carrier.id)}
                className="flex gap-2 items-center"
              >
                <img 
                  src={`/images/carriers/${carrier.id.toLowerCase()}.svg`} 
                  alt={carrier.name}
                  className="h-4 w-4"
                  onError={(e) => {
                    // Hide broken images
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {carrier.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="w-full lg:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full lg:w-auto">
                <Package className="mr-2 h-4 w-4" />
                Apply Carrier to All
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Apply Carrier to All Shipments</h4>
                <p className="text-sm text-gray-500">This will apply the selected carrier and service to all shipments in your list where available.</p>
                
                <div className="space-y-3">
                  <Select value={bulkCarrier} onValueChange={setBulkCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCarriers.map(carrier => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={`/images/carriers/${carrier.id.toLowerCase()}.svg`} 
                              alt={carrier.name}
                              className="h-4 w-4"
                              onError={(e) => {
                                // Hide broken images
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            {carrier.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {bulkCarrier && (
                    <Select value={bulkService} onValueChange={setBulkService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (bulkCarrier && bulkService) {
                        onApplyCarrierToAll(bulkCarrier, bulkService);
                      }
                    }}
                    disabled={!bulkCarrier || !bulkService}
                  >
                    Apply to All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
