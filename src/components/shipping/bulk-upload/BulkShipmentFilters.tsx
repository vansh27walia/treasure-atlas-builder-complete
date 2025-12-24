
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, SortDesc, Filter, Zap, X, Sparkles } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import CarrierLogo from '../CarrierLogo';

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
  const [selectedBulkCarrier, setSelectedBulkCarrier] = useState<string>('');
  const [selectedBulkService, setSelectedBulkService] = useState<string>('');

  const handleApplyToAll = () => {
    if (selectedBulkCarrier && selectedBulkService) {
      const carrier = EXTENDED_CARRIER_OPTIONS.find(c => c.id === selectedBulkCarrier);
      const service = carrier?.services.find(s => s.id === selectedBulkService);
      
      if (carrier && service) {
        onApplyCarrierToAll(carrier.name, service.name);
      }
    }
  };

  const activeFiltersCount = 
    (searchTerm ? 1 : 0) + 
    (selectedCarrier && selectedCarrier !== 'all' ? 1 : 0);

  return (
    <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl shadow-sm border border-gray-200/60 p-5 space-y-4 transition-all duration-300 hover:shadow-md">
      {/* Enhanced Header with AI Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Filter & Sort Rates</h3>
          {onQuickOptimization && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickOptimization('ai-recommended')}
              className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Quick Change
            </Button>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              onCarrierFilterChange(null);
            }}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Main Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Enhanced Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 h-4 w-4 transition-colors duration-200" />
          <Input
            type="text"
            placeholder="Search carriers or services..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-red-50"
            >
              <X className="h-3 w-3 text-gray-400 hover:text-red-600" />
            </Button>
          )}
        </div>

        {/* Enhanced Carrier Dropdown */}
        <Select 
          value={selectedCarrier || 'all'} 
          onValueChange={(value) => onCarrierFilterChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">All</Badge>
                All Carriers
              </div>
            </SelectItem>
            {EXTENDED_CARRIER_OPTIONS.map(carrier => (
              <SelectItem key={carrier.id} value={carrier.id}>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-8 flex items-center justify-center">
                    <CarrierLogo carrier={carrier.name} className="h-4 w-auto" />
                  </div>
                  {carrier.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Enhanced Sort Controls */}
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(value: any) => onSortChange(value, sortDirection)}>
            <SelectTrigger className="h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recipient">
                <div className="flex items-center gap-2">
                  📋 Sort by Recipient
                </div>
              </SelectItem>
              <SelectItem value="rate">
                <div className="flex items-center gap-2">
                  💰 Sort by Price
                </div>
              </SelectItem>
              <SelectItem value="carrier">
                <div className="flex items-center gap-2">
                  🚚 Sort by Carrier
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
            className="h-10 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Advanced Filters & Quick Optimization Options */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-gray-200">
        {OPTIMIZATION_OPTIONS.slice(0, 10).map(opt => (
          <Button
            key={opt.id}
            variant="outline"
            size="sm"
            onClick={() => onQuickOptimization?.(opt.id)}
            className={`${opt.color} hover:shadow-md transition-all duration-200 text-xs font-medium border-0`}
          >
            <span className="mr-1">{opt.icon}</span>
            {opt.label}
          </Button>
        ))}
      </div>
      
      {/* Bottom Row - Apply to All */}
      <div className="border-t pt-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={selectedBulkCarrier}
            onValueChange={setSelectedBulkCarrier}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Choose Carrier" />
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
            value={selectedBulkService}
            onValueChange={setSelectedBulkService}
            disabled={!selectedBulkCarrier}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Services</SelectLabel>
                {EXTENDED_CARRIER_OPTIONS.find(c => c.id === selectedBulkCarrier)?.services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleApplyToAll}
            disabled={!selectedBulkCarrier || !selectedBulkService}
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
