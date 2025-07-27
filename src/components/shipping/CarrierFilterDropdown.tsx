
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Truck, Filter } from 'lucide-react';
import CarrierLogo from './CarrierLogo';

interface CarrierFilterDropdownProps {
  carriers: string[];
  activeFilter: string;
  onFilterChange: (carrier: string) => void;
}

const CarrierFilterDropdown: React.FC<CarrierFilterDropdownProps> = ({ 
  carriers, 
  activeFilter, 
  onFilterChange 
}) => {
  const allCarriers = ['all', ...carriers];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Truck className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Carrier Filter</h3>
      </div>
      
      <div className="flex items-center gap-3">
        <Select value={activeFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue>
              <div className="flex items-center gap-2">
                {activeFilter === 'all' ? (
                  <>
                    <Filter className="w-4 h-4" />
                    All Carriers
                  </>
                ) : (
                  <>
                    <CarrierLogo carrier={activeFilter} className="w-4 h-4" />
                    {activeFilter.toUpperCase()}
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="all" className="hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                All Carriers
              </div>
            </SelectItem>
            {carriers.map((carrier) => (
              <SelectItem key={carrier} value={carrier} className="hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={carrier} className="w-4 h-4" />
                  {carrier.toUpperCase()}
                </div>
              </SelectItem>
            ))}
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

export default CarrierFilterDropdown;
