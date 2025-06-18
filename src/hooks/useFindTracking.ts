
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface TrackingResult {
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
  package_details: {
    weight: string;
    dimensions: string;
    service: string;
  };
  estimated_delivery: {
    date: string;
    time_range: string;
  } | null;
  tracking_events: any[];
}

export const useFindTracking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);

  const searchTracking = async (trackingNumber: string): Promise<TrackingResult | null> => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return null;
    }

    setIsLoading(true);
    setTrackingResult(null);

    try {
      console.log('Searching for tracking number:', trackingNumber);

      // First, check if we have this tracking number in our database
      const { data: existingTracking } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_code', trackingNumber.trim())
        .single();

      if (existingTracking) {
        console.log('Found existing tracking in database:', existingTracking);
        
        const result: TrackingResult = {
          id: existingTracking.id,
          tracking_code: existingTracking.tracking_code,
          carrier: existingTracking.carrier || 'Unknown',
          carrier_code: existingTracking.carrier?.toLowerCase() || 'unknown',
          status: existingTracking.status || 'unknown',
          eta: existingTracking.eta,
          last_update: existingTracking.updated_at || existingTracking.created_at,
          label_url: existingTracking.label_url,
          shipment_id: existingTracking.shipment_id || '',
          recipient: existingTracking.recipient_name || 'Unknown',
          recipient_address: existingTracking.recipient_address || 'Unknown',
          package_details: existingTracking.package_details || {
            weight: 'Unknown',
            dimensions: 'Unknown',
            service: 'Unknown'
          },
          estimated_delivery: existingTracking.eta ? {
            date: existingTracking.eta,
            time_range: 'End of day'
          } : null,
          tracking_events: existingTracking.tracking_history?.events || []
        };

        setTrackingResult(result);
        return result;
      }

      // If not found in our database, try to search externally
      console.log('Tracking not found in database, searching externally...');
      
      const { data, error } = await supabase.functions.invoke('enhanced-tracking-search', {
        body: { tracking_code: trackingNumber.trim() }
      });

      if (error) {
        console.error('Error searching tracking:', error);
        throw new Error(error.message || 'Failed to search tracking');
      }

      if (data && data.tracking_code) {
        console.log('Found tracking data:', data);
        
        const result: TrackingResult = {
          id: data.id || crypto.randomUUID(),
          tracking_code: data.tracking_code,
          carrier: data.carrier || 'Unknown',
          carrier_code: data.carrier_code || 'unknown',
          status: data.status || 'unknown',
          eta: data.eta,
          last_update: data.last_update || new Date().toISOString(),
          label_url: data.label_url,
          shipment_id: data.shipment_id || '',
          recipient: data.recipient || 'Unknown',
          recipient_address: data.recipient_address || 'Unknown',
          package_details: data.package_details || {
            weight: 'Unknown',
            dimensions: 'Unknown',
            service: 'Unknown'
          },
          estimated_delivery: data.estimated_delivery,
          tracking_events: data.tracking_events || []
        };

        setTrackingResult(result);
        return result;
      } else {
        throw new Error('Tracking number not found');
      }

    } catch (error) {
      console.error('Error searching tracking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to search tracking';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchTracking,
    isLoading,
    trackingResult
  };
};
