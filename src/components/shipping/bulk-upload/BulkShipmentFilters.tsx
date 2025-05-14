
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Search, Filter, Check, CreditCard } from 'lucide-react';

interface BulkShipmentFiltersProps {
  onSearch?: (term: string) => void;
  onFilter?: (filter: string) => void;
  onBulkApplyCarrier?: (carrier: string, service: string) => void;
  onSelectAll?: () => void;
  activeFilter?: string;
  isAllSelected?: boolean;
  totalCost?: number;
  // Props for the updated implementation
  searchTerm?: string;
  onSearchChange?: React.Dispatch<React.SetStateAction<string>>;
  sortField?: 'carrier' | 'rate' | 'recipient';
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: any, direction: any) => void;
  selectedCarrier?: string;
  onCarrierFilterChange?: React.Dispatch<React.SetStateAction<string>>;
  onApplyCarrierToAll?: (carrierId: string, serviceId: string) => void;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  onSearch = () => {},
  onFilter = () => {},
  onBulkApplyCarrier,
  onSelectAll,
  activeFilter = 'all',
  isAllSelected,
  totalCost = 0,
  searchTerm = '',
  onSearchChange,
  selectedCarrier,
  onCarrierFilterChange,
  sortField,
  sortDirection,
  onSortChange,
  onApplyCarrierToAll
}) => {
  // If onSearchChange prop is provided, use it; otherwise use internal state
  const [internalSearchTerm, setInternalSearchTerm] = React.useState('');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
      onSearch(value);
    }
  };
  
  const handleFilter = (filter: string) => {
    onFilter(filter);
  };

  // Use either the prop value or internal state
  const displaySearchTerm = searchTerm !== undefined ? searchTerm : internalSearchTerm;

  return (
    <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-4">
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search shipments..."
            value={displaySearchTerm}
            onChange={handleSearchChange}
            className="pl-9 pr-4 h-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 h-10">
              <Filter className="h-4 w-4" />
              <span>
                {activeFilter === 'all' ? 'All' : 
                 activeFilter === 'pending' ? 'Pending' :
                 activeFilter === 'completed' ? 'Completed' :
                 activeFilter === 'error' ? 'Error' : 'Filter'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleFilter('all')}>
              All Shipments
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter('pending')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter('completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter('error')}>
              Error
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {(onBulkApplyCarrier || onApplyCarrierToAll) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-10">
                <span>Apply Carrier</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => (onApplyCarrierToAll ? onApplyCarrierToAll('usps', 'Priority') : onBulkApplyCarrier && onBulkApplyCarrier('usps', 'Priority'))}>
                USPS Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (onApplyCarrierToAll ? onApplyCarrierToAll('usps', 'Express') : onBulkApplyCarrier && onBulkApplyCarrier('usps', 'Express'))}>
                USPS Express
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (onApplyCarrierToAll ? onApplyCarrierToAll('ups', 'Ground') : onBulkApplyCarrier && onBulkApplyCarrier('ups', 'Ground'))}>
                UPS Ground
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => (onApplyCarrierToAll ? onApplyCarrierToAll('fedex', 'Ground') : onBulkApplyCarrier && onBulkApplyCarrier('fedex', 'Ground'))}>
                FedEx Ground
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3 w-full sm:w-auto">
        {onSelectAll && (
          <Button 
            variant={isAllSelected ? "default" : "outline"}
            className={`flex items-center gap-2 h-10 ${isAllSelected ? "bg-blue-600 text-white" : ""}`}
            onClick={onSelectAll}
            size="sm"
          >
            {isAllSelected && <Check className="h-4 w-4" />}
            Select All
          </Button>
        )}
        
        {totalCost > 0 && (
          <Button className="bg-blue-600 hover:bg-blue-700 h-10 flex items-center gap-2" size="sm">
            <CreditCard className="h-4 w-4" />
            Pay ${totalCost.toFixed(2)}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
