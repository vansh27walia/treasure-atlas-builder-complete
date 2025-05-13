
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CARRIER_OPTIONS, CarrierOption } from '@/types/shipping';
import { Search, Filter, Check, Truck } from 'lucide-react';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBulkCarrier, setSelectedBulkCarrier] = useState<string>('');
  const [selectedBulkService, setSelectedBulkService] = useState<string>('');
  
  const handleApplyCarrierToAll = () => {
    if (selectedBulkCarrier && selectedBulkService) {
      onApplyCarrierToAll(selectedBulkCarrier, selectedBulkService);
      setIsDialogOpen(false);
    }
  };
  
  const getAvailableServices = () => {
    const carrier = CARRIER_OPTIONS.find(c => c.id === selectedBulkCarrier);
    return carrier ? carrier.services : [];
  };
  
  const handleSortChange = (field: 'recipient' | 'rate' | 'carrier') => {
    const direction = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, direction);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="w-48">
            <Select value={selectedCarrier || 'all'} onValueChange={(value) => onCarrierFilterChange(value === 'all' ? null : value)}>
              <SelectTrigger className="bg-white border-gray-300">
                <SelectValue placeholder="Filter by carrier" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Carriers</SelectItem>
                {CARRIER_OPTIONS.map(carrier => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                <Truck className="h-4 w-4 mr-1" /> Apply to All
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader>
                <DialogTitle>Apply Carrier to All Shipments</DialogTitle>
                <DialogDescription>
                  Select a carrier and service to apply to all shipments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Carrier</label>
                  <Select value={selectedBulkCarrier} onValueChange={setSelectedBulkCarrier}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a carrier" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {CARRIER_OPTIONS.map(carrier => (
                        <SelectItem key={carrier.id} value={carrier.id}>
                          {carrier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedBulkCarrier && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Service</label>
                    <Select value={selectedBulkService} onValueChange={setSelectedBulkService}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {getAvailableServices().map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button 
                  type="submit" 
                  onClick={handleApplyCarrierToAll}
                  disabled={!selectedBulkCarrier || !selectedBulkService}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Apply to All Shipments
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="outline"
            className="gap-1 whitespace-nowrap"
            onClick={() => handleSortChange('recipient')}
          >
            <Filter className="h-4 w-4" />
            Sort: {sortField === 'recipient' ? 'Name' : sortField === 'rate' ? 'Price' : 'Carrier'} 
            {sortDirection === 'asc' ? ' ↑' : ' ↓'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
