
import React, { useState, useEffect } from 'react';
import TrackingListItem from './TrackingListItem';
import TrackingEmptyState from './TrackingEmptyState';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Package } from 'lucide-react';

interface TrackingEvent {
  id: string;
  description: string;
  location: string;
  timestamp: string;
  status: string;
}

interface PackageDetails {
  weight: string;
  dimensions: string;
  service: string;
}

interface EstimatedDelivery {
  date: string;
  time_range: string;
}

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  carrier_code: string;
  status: string;
  eta: string | null;
  last_update: string;
  label_url: string | null;
  shipment_id: string;
  recipient: string;
  recipient_address: string;
  package_details: PackageDetails;
  estimated_delivery: EstimatedDelivery | null;
  tracking_events?: TrackingEvent[];
}

interface TrackingListProps {
  trackingData: TrackingInfo[];
  isLoading: boolean;
  selectedTracking: string | null;
  setSelectedTracking: (trackingCode: string | null) => void;
  setActiveFilter: (filter: string) => void;
}

const TrackingList: React.FC<TrackingListProps> = ({
  trackingData,
  isLoading,
  selectedTracking,
  setSelectedTracking,
  setActiveFilter
}) => {
  const [trackingInput, setTrackingInput] = useState('');
  const [manualTrackingData, setManualTrackingData] = useState<TrackingInfo[]>([]);
  const [isManualTracking, setIsManualTracking] = useState(false);
  
  // Combine manually tracked shipments with system tracking data
  const allTrackingData = [...trackingData, ...manualTrackingData];
  
  // Handle manual tracking number input
  const handleTrackingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingInput(e.target.value);
  };
  
  // Track a package manually
  const trackPackage = async () => {
    if (!trackingInput.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }
    
    setIsManualTracking(true);
    
    try {
      // Call tracking API
      const { data, error } = await supabase.functions.invoke('get-tracking-info', {
        body: { tracking_code: trackingInput.trim() }
      });
      
      if (error) throw new Error(error.message);
      
      if (data) {
        // Add to manual tracking list
        setManualTrackingData(prev => {
          // Check if tracking number already exists
          if (prev.some(item => item.tracking_code === data.tracking_code)) {
            toast.info("This tracking number is already being tracked");
            return prev;
          }
          
          toast.success("Package tracking added successfully");
          return [...prev, data];
        });
        
        // Clear input
        setTrackingInput('');
      } else {
        toast.error("No tracking information found for this number");
      }
    } catch (error) {
      console.error('Error tracking package:', error);
      toast.error("Error tracking package. Please try again.");
    } finally {
      setIsManualTracking(false);
    }
  };
  
  if (allTrackingData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Input 
            placeholder="Enter tracking number" 
            value={trackingInput}
            onChange={handleTrackingInput}
            className="flex-1"
          />
          <Button 
            onClick={trackPackage}
            disabled={isManualTracking}
          >
            {isManualTracking ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
            Track
          </Button>
        </div>
        
        <TrackingEmptyState 
          isLoading={isLoading} 
          onShowAll={() => setActiveFilter('all')} 
        />
      </div>
    );
  }
  
  const handleSelectTracking = (trackingCode: string) => {
    setSelectedTracking(trackingCode === selectedTracking ? null : trackingCode);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Input 
          placeholder="Enter tracking number" 
          value={trackingInput}
          onChange={handleTrackingInput}
          className="flex-1"
        />
        <Button 
          onClick={trackPackage}
          disabled={isManualTracking}
        >
          {isManualTracking ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Track
        </Button>
      </div>
      
      <div className="space-y-4">
        {allTrackingData.map((item) => (
          <TrackingListItem
            key={item.id}
            item={item}
            isSelected={selectedTracking === item.tracking_code}
            onSelect={handleSelectTracking}
          />
        ))}
      </div>
    </div>
  );
};

export default TrackingList;
