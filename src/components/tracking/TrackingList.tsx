
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
  
  // Track a package manually using live EasyPost API with user authentication
  const trackPackage = async () => {
    if (!trackingInput.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to track packages");
      return;
    }
    
    setIsManualTracking(true);
    
    try {
      console.log('Tracking package:', trackingInput.trim());
      
      // Call the tracking API with user authentication
      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: { tracking_number: trackingInput.trim() }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }
      
      if (data) {
        console.log('Tracking data received:', data);
        
        // Add to manual tracking list
        setManualTrackingData(prev => {
          // Check if tracking number already exists
          const exists = prev.some(item => item.tracking_code === data.tracking_code) ||
                        trackingData.some(item => item.tracking_code === data.tracking_code);
          
          if (exists) {
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
      toast.error("Error tracking package. Please check the tracking number and try again.");
    } finally {
      setIsManualTracking(false);
    }
  };
  
  // Handle Enter key press in input
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      trackPackage();
    }
  };
  
  if (allTrackingData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <Input 
            placeholder="Enter tracking number (e.g., 1Z999AA1234567890)" 
            value={trackingInput}
            onChange={handleTrackingInput}
            onKeyPress={handleKeyPress}
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
          placeholder="Enter tracking number (e.g., 1Z999AA1234567890)" 
          value={trackingInput}
          onChange={handleTrackingInput}
          onKeyPress={handleKeyPress}
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
