
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, SortDesc, Filter, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

// Extended carrier options with additional carriers
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

// Quick optimization options - same as AI Overview
const OPTIMIZATION_OPTIONS = [
  { id: 'cheapest', label: 'Cheapest', icon: '💰', color: 'bg-green-100 text-green-800' },
  { id: 'fastest', label: 'Fastest', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'balanced', label: 'Most Efficient', icon: '✅', color: 'bg-blue-100 text-blue-800' },
  { id: 'door-delivery', label: 'Door Delivery', icon: '📦', color: 'bg-purple-100 text-purple-800' },
  { id: 'po-box', label: 'PO Box Delivery', icon: '📫', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'eco-friendly', label: 'Eco Friendly', icon: '🌱', color: 'bg-green-100 text-green-800' },
  { id: '2-day', label: '2-Day Delivery', icon: '🕓', color: 'bg-orange-100 text-orange-800' },
  { id: 'express', label: 'Express Delivery', icon: '🚀', color: 'bg-red-100 text-red-800' },
  { id: 'most-reliable', label: 'Most Reliable', icon: '🛡️', color: 'bg-gray-100 text-gray-800' },
  { id: 'ai-recommended', label: 'AI Recommended', icon: '🧠', color: 'bg-pink-100 text-pink-800' }
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
  onQuickOptimization?: (filterId: string) => void;
  onOpenChatbot?: () => void;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  selectedCarrier,
  onCarrierFilterChange,
  onApplyCarrierToAll,
  onQuickOptimization
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

  const handleQuickOptimization = (filterId: string) => {
    if (onQuickOptimization) {
      onQuickOptimization(filterId);
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Top Row - Search, Carrier, Sort, Quick, AI */}
      <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-40 md:w-48">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-8"
            />
          </div>

          {/* Carrier filter moved to top */}
          <Select
            value={selectedCarrier || ''}
            onValueChange={(value) => onCarrierFilterChange(value === '' ? null : value)}
          >
            <SelectTrigger className="w-[150px] h-8">
              <SelectValue placeholder="All carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Carriers</SelectLabel>
                <SelectItem value="">All</SelectItem>
                {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>{carrier.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sortField}
            onValueChange={(value) => onSortChange(value as 'recipient' | 'rate' | 'carrier', sortDirection)}
          >
            <SelectTrigger className="w-[120px] h-8">
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
            className="border h-8 w-8"
            aria-label="Toggle sort direction"
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>

          {/* Quick Optimization */}
          <Select onValueChange={handleQuickOptimization}>
            <SelectTrigger className="w-[160px] h-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <SelectValue placeholder="Quick options" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Quick Optimization</SelectLabel>
                {OPTIMIZATION_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Open Chatbot */}
        <Button size="sm" variant="outline" className="h-8" onClick={() => onOpenChatbot?.()}>
          AI Chat
        </Button>
      </div>

      {/* Bottom Row - Apply to All */}
      <div className="border-t pt-3">
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

export default BulkShipmentFilters;
