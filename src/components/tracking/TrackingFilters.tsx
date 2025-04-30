
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package, Truck, MapPin, CheckCircle } from 'lucide-react';

interface TrackingFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  trackingCount: {
    all: number;
    in_transit: number;
    out_for_delivery: number;
    delivered: number;
  };
}

const TrackingFilters: React.FC<TrackingFiltersProps> = ({
  activeFilter,
  setActiveFilter,
  trackingCount
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button 
        variant={activeFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('all')}
      >
        All ({trackingCount.all})
      </Button>
      <Button 
        variant={activeFilter === 'in_transit' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('in_transit')}
        className={activeFilter === 'in_transit' ? 'bg-blue-500 hover:bg-blue-600' : ''}
      >
        <Truck className="h-4 w-4 mr-1" />
        In Transit ({trackingCount.in_transit})
      </Button>
      <Button 
        variant={activeFilter === 'out_for_delivery' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('out_for_delivery')}
        className={activeFilter === 'out_for_delivery' ? 'bg-purple-500 hover:bg-purple-600' : ''}
      >
        <MapPin className="h-4 w-4 mr-1" />
        Out for Delivery ({trackingCount.out_for_delivery})
      </Button>
      <Button 
        variant={activeFilter === 'delivered' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setActiveFilter('delivered')}
        className={activeFilter === 'delivered' ? 'bg-green-500 hover:bg-green-600' : ''}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Delivered ({trackingCount.delivered})
      </Button>
    </div>
  );
};

export default TrackingFilters;
