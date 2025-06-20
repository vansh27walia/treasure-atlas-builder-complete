
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Package } from 'lucide-react';
import { useFindTracking } from '@/hooks/useFindTracking';
import { toast } from '@/components/ui/sonner';

interface TrackingHeaderProps {
  onTrackingFound?: (trackingData: any) => void;
  onRefresh?: () => void;
}

const TrackingHeader: React.FC<TrackingHeaderProps> = ({ 
  onTrackingFound, 
  onRefresh 
}) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const { searchTracking, isLoading } = useFindTracking();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    try {
      const result = await searchTracking(trackingNumber.trim());
      if (result && onTrackingFound) {
        onTrackingFound(result);
        toast.success('Tracking information found!');
      }
      setTrackingNumber('');
    } catch (error) {
      console.error('Error tracking package:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Package className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Track Your Package</h2>
      </div>
      
      <form onSubmit={handleTrack} className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Enter tracking number (e.g., 1Z999AA1234567890)"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Tracking...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Track
            </>
          )}
        </Button>
        
        {onRefresh && (
          <Button 
            type="button" 
            variant="outline"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </form>
    </div>
  );
};

export default TrackingHeader;
