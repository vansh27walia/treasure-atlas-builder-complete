
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
  onSearch: (term: string) => void;
  onFilter: (filter: string) => void;
  onBulkApplyCarrier?: (carrier: string, service: string) => void;
  onSelectAll?: () => void;
  activeFilter: string;
  isAllSelected?: boolean;
  totalCost?: number;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  onSearch,
  onFilter,
  onBulkApplyCarrier,
  onSelectAll,
  activeFilter,
  isAllSelected,
  totalCost = 0
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  const handleFilter = (filter: string) => {
    onFilter(filter);
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-4">
      <div className="flex-1 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search shipments..."
            value={searchTerm}
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
        
        {onBulkApplyCarrier && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 h-10">
                <span>Apply Carrier</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onBulkApplyCarrier('usps', 'Priority')}>
                USPS Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkApplyCarrier('usps', 'Express')}>
                USPS Express
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkApplyCarrier('ups', 'Ground')}>
                UPS Ground
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkApplyCarrier('fedex', 'Ground')}>
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
