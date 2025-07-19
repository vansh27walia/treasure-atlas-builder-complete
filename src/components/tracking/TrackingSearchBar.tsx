
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Package, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface TrackingSearchBarProps {
  onSearch: (trackingNumber: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const TrackingSearchBar: React.FC<TrackingSearchBarProps> = ({ 
  onSearch, 
  onRefresh, 
  isLoading = false 
}) => {
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleSearch = () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    onSearch(trackingNumber.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
      <div className="flex items-center gap-3 mb-4">
        <Package className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-blue-900">Track Your Shipments</h2>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter tracking number (e.g., 1Z999AA1234567890)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-lg h-12 border-blue-300 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
          >
            <Search className="h-5 w-5 mr-2" />
            Track Package
          </Button>
          <Button 
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-12 px-4 border-blue-300 hover:bg-blue-50"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TrackingSearchBar;
