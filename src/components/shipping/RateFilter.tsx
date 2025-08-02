
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, Zap, DollarSign, Clock, Shield, Star } from 'lucide-react';

interface RateFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const RateFilter: React.FC<RateFilterProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All Rates', icon: Filter },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign },
    { id: 'fastest', label: 'Fastest', icon: Zap },
    { id: 'balanced', label: 'Most Efficient', icon: Clock },
    { id: 'most-reliable', label: 'Most Reliable', icon: Shield },
    { id: 'ai-recommended', label: 'AI Recommended', icon: Star }
  ];

  const selectedFilter = filters.find(f => f.id === activeFilter);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filter Rates</h3>
      </div>
      
      <div className="flex items-center gap-3">
        <Select value={activeFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-64 bg-white">
            <SelectValue>
              <div className="flex items-center gap-2">
                {selectedFilter && (
                  <>
                    <selectedFilter.icon className="w-4 h-4" />
                    {selectedFilter.label}
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <SelectItem key={filter.id} value={filter.id} className="hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {activeFilter !== 'all' && (
          <Badge className="bg-blue-500 text-white">
            Active Filter
          </Badge>
        )}
      </div>
    </div>
  );
};
/ Extended carrier options with additional carriers
const EXTENDED_CARRIER_OPTIONS = [
  {
    id: 'usps',
    name: 'USPS',
    services: [
      { id: 'first_class', name: 'First Class' },
      { id: 'priority', name: 'Priority Mail' },
      { id: 'priority_express', name: 'Priority Express' },
      { id: 'ground_advantage', name: 'Ground Advantage' },
      { id: 'media_mail', name: 'Media Mail' }
    ]
  },
  {
    id: 'ups',
    name: 'UPS',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: 'next_day_air', name: 'Next Day Air' },
      { id: 'next_day_air_saver', name: 'Next Day Air Saver' },
      { id: '2nd_day_air', name: '2nd Day Air' },
      { id: '3_day_select', name: '3 Day Select' }
    ]
  },
  {
    id: 'fedex',
    name: 'FedEx',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: 'express_saver', name: 'Express Saver' },
      { id: '2day', name: '2Day' },
      { id: 'standard_overnight', name: 'Standard Overnight' },
      { id: 'priority_overnight', name: 'Priority Overnight' }
    ]
  },
  {
    id: 'dhl',
    name: 'DHL',
    services: [
      { id: 'express', name: 'Express' },
      { id: 'express_worldwide', name: 'Express Worldwide' },
      { id: 'economy_select', name: 'Economy Select' }
    ]
  },
  {
    id: 'canada_post',
    name: 'Canada Post',
    services: [
      { id: 'regular_parcel', name: 'Regular Parcel' },
      { id: 'expedited_parcel', name: 'Expedited Parcel' },
      { id: 'xpresspost', name: 'Xpresspost' },
      { id: 'priority', name: 'Priority' }
    ]
  },
  {
    id: 'purolator',
    name: 'Purolator',
    services: [
      { id: 'ground', name: 'Ground' },
      { id: 'express', name: 'Express' },
      { id: 'express_9am', name: 'Express 9AM' },
      { id: 'express_1030am', name: 'Express 10:30AM' }
    ]
  }
];

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
      const carrier = EXTENDED_CARRIER_OPTIONS.find(c => c.id === selectedCarrierService.carrierId);
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

  // Handle apply to all button click - Fixed functionality
  const handleApplyToAll = () => {
    if (selectedCarrierService?.carrierId && selectedCarrierService?.serviceId) {
      const carrier = EXTENDED_CARRIER_OPTIONS.find(c => c.id === selectedCarrierService.carrierId);
      const service = availableServices.find(s => s.id === selectedCarrierService.serviceId);
      
      if (carrier && service) {
        onApplyCarrierToAll(carrier.name, service.name);
      }
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
                
                {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
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
              <SelectValue placeholder="Choose All Carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Carriers</SelectLabel>
                {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply to All
          </Button>
        </div>
      </div>
    </div>
  );
};
export default RateFilter;
