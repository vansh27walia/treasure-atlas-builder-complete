
import React, { useState, useEffect } from 'react';
import TrackingListItem from './TrackingListItem';
import TrackingEmptyState from './TrackingEmptyState';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Package } from 'lucide-react';
import { useFindTracking } from '@/hooks/useFindTracking';

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
  
  // Use the new enhanced tracking hook
  const { searchTracking, isLoading: isSearching, trackingResult } = useFindTracking();
  
  // Combine manually tracked shipments with system tracking data
  const allTrackingData = [...trackingData, ...manualTrackingData];
  
  // Handle manual tracking number input
  const handleTrackingInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackingInput(e.target.value);
  };
  
  // Track a package using the enhanced search
  const trackPackage = async () => {
    if (!trackingInput.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }
    
    try {
      const result = await searchTracking(trackingInput.trim());
      
      if (result) {
        // Add to manual tracking list if not already present
        setManualTrackingData(prev => {
          const exists = prev.some(item => item.tracking_code === result.tracking_code) ||
                        trackingData.some(item => item.tracking_code === result.tracking_code);
          
          if (exists) {
            toast.info("This tracking number is already being tracked");
            return prev;
          }
          
          // Convert the search result to TrackingInfo format
          const trackingInfo: TrackingInfo = {
            id: result.id || crypto.randomUUID(),
            tracking_code: result.tracking_code,
            carrier: result.carrier,
            carrier_code: result.carrier_code,
            status: result.status,
            eta: result.eta,
            last_update: result.last_update || new Date().toISOString(),
            label_url: result.label_url,
            shipment_id: result.shipment_id || '',
            recipient: result.recipient,
            recipient_address: result.recipient_address,
            package_details: result.package_details,
            estimated_delivery: result.estimated_delivery,
            tracking_events: result.tracking_events
          };
          
          toast.success("Package tracking added successfully");
          return [...prev, trackingInfo];
        });
        
        // Clear input
        setTrackingInput('');
      }
    } catch (error) {
      console.error('Error tracking package:', error);
      toast.error("Error tracking package. Please check the tracking number and try again.");
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
            disabled={isSearching}
          >
            {isSearching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
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
          disabled={isSearching}
        >
          {isSearching ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
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
