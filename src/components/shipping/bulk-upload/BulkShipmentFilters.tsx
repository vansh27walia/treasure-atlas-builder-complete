
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, SortDesc, Filter, Sparkles, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

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

// Smart optimization presets for bulk operations
const OPTIMIZATION_PRESETS = [
  { 
    id: 'cheapest', 
    name: 'Cheapest', 
    icon: '💰', 
    description: 'Minimize cost across all shipments',
    color: 'bg-green-50 border-green-200 text-green-800'
  },
  { 
    id: 'fastest', 
    name: 'Fastest', 
    icon: '⚡', 
    description: 'Prioritize delivery speed',
    color: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  { 
    id: 'balanced', 
    name: 'Balanced', 
    icon: '⚖️', 
    description: 'Optimize for cost and speed',
    color: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  { 
    id: 'reliable', 
    name: 'Most Reliable', 
    icon: '🛡️', 
    description: 'Choose most dependable carriers',
    color: 'bg-orange-50 border-orange-200 text-orange-800'
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
  onApplyCarrierToAll: (carrier: string, service?: string) => void;
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
  
  useEffect(() => {
    if (selectedCarrierService?.carrierId) {
      const carrier = EXTENDED_CARRIER_OPTIONS.find(c => c.id === selectedCarrierService.carrierId);
      if (carrier) {
        setAvailableServices(carrier.services);
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

  const handleApplyToAll = () => {
    if (selectedCarrierService?.carrierId && selectedCarrierService?.serviceId) {
      const carrier = EXTENDED_CARRIER_OPTIONS.find(c => c.id === selectedCarrierService.carrierId);
      const service = availableServices.find(s => s.id === selectedCarrierService.serviceId);
      
      if (carrier && service) {
        onApplyCarrierToAll(carrier.name, service.name);
      }
    }
  };

  const handleOptimizationPreset = (presetId: string) => {
    onApplyCarrierToAll(presetId);
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50">
      {/* Search and Sort Controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search recipients, addresses, carriers..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 bg-white/80 border-white/50 focus:bg-white transition-all"
          />
        </div>
        
        <div className="flex gap-2">
          <Select
            value={sortField}
            onValueChange={(value) => onSortChange(value as 'recipient' | 'rate' | 'carrier', sortDirection)}
          >
            <SelectTrigger className="w-[140px] h-10 bg-white/80 border-white/50">
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
            variant="outline"
            size="icon"
            onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
            className="h-10 w-10 bg-white/80 border-white/50 hover:bg-white"
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-10 bg-white/80 border-white/50 hover:bg-white">
                <Filter className="h-4 w-4" />
                Filter
                {selectedCarrier && <Badge variant="secondary" className="ml-1 text-xs">Active</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Filter by Carrier</h4>
                
                <RadioGroup 
                  value={selectedCarrier || ''} 
                  onValueChange={(value) => onCarrierFilterChange(value === '' ? null : value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="" id="all" />
                    <Label htmlFor="all" className="font-medium">All carriers</Label>
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
      </div>

      {/* Smart Optimization Presets - 4 criteria for bulk creation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Smart Optimization</h4>
          <Badge className="bg-purple-100 text-purple-800 text-xs">AI Powered</Badge>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {OPTIMIZATION_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className={`h-auto p-3 flex flex-col items-center gap-2 border-2 hover:scale-105 transition-all ${preset.color}`}
              onClick={() => handleOptimizationPreset(preset.id)}
            >
              <span className="text-lg">{preset.icon}</span>
              <div className="text-center">
                <div className="font-semibold text-sm">{preset.name}</div>
                <div className="text-xs opacity-80">{preset.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Manual Carrier/Service Selection */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Manual Selection</h4>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            value={selectedCarrierService?.carrierId || ''}
            onValueChange={(value) => setSelectedCarrierService({
              carrierId: value,
              serviceId: ''
            })}
          >
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Choose Carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Available Carriers</SelectLabel>
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
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Select Service" />
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
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Zap className="mr-2 h-4 w-4" />
            Apply to All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
