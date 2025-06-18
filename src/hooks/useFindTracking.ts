
import { useState, useCallback } from 'react';
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
  id?: string;
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
  source?: string;
}

export const useFindTracking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchTracking = useCallback(async (trackingNumber: string) => {
    if (!trackingNumber?.trim()) {
      toast.error('Please enter a tracking number');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      console.log('Searching for tracking number:', trackingNumber);

      // Call the enhanced tracking search Edge Function
      const { data, error } = await supabase.functions.invoke('enhanced-tracking-search', {
        body: { tracking_number: trackingNumber.trim() }
      });

      if (error) {
        console.error('Tracking search error:', error);
        throw new Error(error.message);
      }

      if (data && data.tracking_code) {
        console.log('Tracking data found:', data);
        setTrackingResult(data);
        toast.success(`Tracking information found (${data.source || 'unknown source'})`);
        return data;
      } else {
        throw new Error('No tracking information found for this number');
      }

    } catch (error) {
      console.error('Error searching tracking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unable to track package';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setTrackingResult(null);
    setError(null);
  }, []);

  return {
    searchTracking,
    clearResults,
    isLoading,
    trackingResult,
    error
  };
};
