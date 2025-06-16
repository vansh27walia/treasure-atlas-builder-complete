
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  selectedCarrier: string;
  onCarrierFilterChange: (carrier: string) => void;
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
  const [bulkCarrier, setBulkCarrier] = React.useState('');
  const [bulkService, setBulkService] = React.useState('');

  const carrierOptions = [
    { value: 'ups', label: 'UPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'usps', label: 'USPS' },
    { value: 'dhl', label: 'DHL Express' }
  ];

  const serviceOptions = {
    ups: [
      { value: 'Ground', label: 'UPS Ground' },
      { value: '3DaySelect', label: 'UPS 3 Day Select' },
      { value: '2ndDayAir', label: 'UPS 2nd Day Air' },
      { value: 'NextDayAir', label: 'UPS Next Day Air' }
    ],
    fedex: [
      { value: 'FEDEX_GROUND', label: 'FedEx Ground' },
      { value: 'FEDEX_EXPRESS_SAVER', label: 'FedEx Express Saver' },
      { value: 'FEDEX_2_DAY', label: 'FedEx 2Day' },
      { value: 'STANDARD_OVERNIGHT', label: 'FedEx Standard Overnight' }
    ],
    usps: [
      { value: 'Ground', label: 'USPS Ground Advantage' },
      { value: 'Priority', label: 'USPS Priority Mail' },
      { value: 'Express', label: 'USPS Priority Mail Express' }
    ],
    dhl: [
      { value: 'Express', label: 'DHL Express Worldwide' },
      { value: 'ExpressEasy', label: 'DHL Express Easy' }
    ]
  };

  const handleApplyToAll = () => {
    if (bulkCarrier) {
      onApplyCarrierToAll(bulkCarrier, bulkService);
      setBulkCarrier('');
      setBulkService('');
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Search Shipments</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, address, or reference..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="lg:w-48">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</Label>
          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-');
              onSortChange(field, direction as 'asc' | 'desc');
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="to_name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="to_name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="to_city-asc">City (A-Z)</SelectItem>
              <SelectItem value="to_city-desc">City (Z-A)</SelectItem>
              <SelectItem value="weight-asc">Weight (Low-High)</SelectItem>
              <SelectItem value="weight-desc">Weight (High-Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter by Carrier */}
        <div className="lg:w-48">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Carrier</Label>
          <Select value={selectedCarrier} onValueChange={onCarrierFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Carriers</SelectItem>
              {carrierOptions.map((carrier) => (
                <SelectItem key={carrier.value} value={carrier.value}>
                  {carrier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Apply Section */}
      <div className="border-t pt-4">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              <Check className="inline h-4 w-4 mr-1" />
              Apply Carrier to All Shipments
            </Label>
            <div className="flex gap-2">
              <Select value={bulkCarrier} onValueChange={(value) => {
                setBulkCarrier(value);
                setBulkService(''); // Reset service when carrier changes
              }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select carrier..." />
                </SelectTrigger>
                <SelectContent>
                  {carrierOptions.map((carrier) => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {bulkCarrier && (
                <Select value={bulkService} onValueChange={setBulkService}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions[bulkCarrier as keyof typeof serviceOptions]?.map((service) => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <Button 
            onClick={handleApplyToAll}
            disabled={!bulkCarrier}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply to All
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          This will update the carrier and service selection for all shipments in your list.
        </p>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
