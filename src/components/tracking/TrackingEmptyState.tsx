
import React from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

interface TrackingEmptyStateProps {
  isLoading: boolean;
  onShowAll: () => void;
}

const TrackingEmptyState: React.FC<TrackingEmptyStateProps> = ({ isLoading, onShowAll }) => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-semibold text-gray-900">No shipments found</h3>
      <p className="mt-1 text-sm text-gray-500">
        {isLoading ? 'Loading tracking data...' : 'No shipments match the current filter'}
      </p>
      {!isLoading && (
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onShowAll}
        >
          Show all shipments
        </Button>
      )}
    </div>
  );
};

export default TrackingEmptyState;
