
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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

export const useTrackingData = () => {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserTrackingData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching user tracking data...');
      
      const { data, error } = await supabase.functions.invoke('get-tracking-info');
      
      if (error) {
        console.error('Error fetching tracking data:', error);
        throw new Error(error.message || 'Failed to fetch tracking data');
      }
      
      console.log('Tracking data received:', data);
      
      if (Array.isArray(data)) {
        setTrackingData(data);
        if (data.length === 0) {
          console.log('No tracking data found for user');
        }
      } else {
        console.log('Invalid tracking data format received');
        setTrackingData([]);
      }
      
    } catch (error) {
      console.error('Error in fetchUserTrackingData:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tracking data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTrackingData = () => {
    fetchUserTrackingData();
  };

  useEffect(() => {
    fetchUserTrackingData();
  }, []);

  return {
    trackingData,
    isLoading,
    error,
    refreshTrackingData,
    fetchUserTrackingData
  };
};
