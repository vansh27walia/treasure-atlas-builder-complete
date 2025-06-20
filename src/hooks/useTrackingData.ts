
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
      console.log('Fetching user-specific tracking data...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        throw new Error('User not authenticated');
      }

      // Fetch shipments for the current user only
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (shipmentsError) {
        console.error('Error fetching shipments:', shipmentsError);
        throw new Error(shipmentsError.message);
      }

      console.log('User shipments found:', shipments?.length || 0);

      if (shipments && shipments.length > 0) {
        // Transform shipments to tracking info format
        const trackingInfo: TrackingInfo[] = shipments.map(shipment => {
          // Safe type checking for package_details
          let packageDetails = {
            weight: 'Unknown',
            dimensions: 'Unknown',
            service: 'Unknown'
          };
          
          if (shipment.package_details && typeof shipment.package_details === 'object') {
            const details = shipment.package_details as any;
            packageDetails = {
              weight: details.weight || 'Unknown',
              dimensions: details.dimensions || 'Unknown',
              service: details.service || 'Unknown'
            };
          }

          // Safe type checking for tracking_events
          let trackingEvents: TrackingEvent[] = [];
          if (shipment.tracking_history && typeof shipment.tracking_history === 'object') {
            const history = shipment.tracking_history as any;
            if (Array.isArray(history.events)) {
              trackingEvents = history.events;
            }
          }

          return {
            id: shipment.id,
            tracking_code: shipment.tracking_code,
            carrier: shipment.carrier || 'Unknown',
            carrier_code: shipment.carrier?.toLowerCase() || 'unknown',
            status: shipment.status || 'unknown',
            eta: shipment.eta,
            last_update: shipment.updated_at || shipment.created_at,
            label_url: shipment.label_url,
            shipment_id: shipment.shipment_id || '',
            recipient: shipment.recipient_name || 'Unknown',
            recipient_address: shipment.recipient_address || 'Unknown',
            package_details: packageDetails,
            estimated_delivery: shipment.eta ? {
              date: shipment.eta,
              time_range: 'End of day'
            } : null,
            tracking_events: trackingEvents
          };
        });

        setTrackingData(trackingInfo);
        console.log('Tracking data loaded:', trackingInfo.length, 'items');
      } else {
        setTrackingData([]);
        console.log('No tracking data found for user');
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
    console.log('Refreshing tracking data...');
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
