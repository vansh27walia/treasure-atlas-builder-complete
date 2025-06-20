
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrackingHistoryChart from './TrackingHistoryChart';
import TrackingFilters from './TrackingFilters';
import TrackingList from './TrackingList';

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

const TrackingDashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchTrackingData = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('User not authenticated, clearing tracking data');
        toast.error('Please log in to view tracking data');
        setTrackingData([]);
        return;
      }

      console.log('Fetching tracking data for user:', session.user.id);

      // This will now only return user-specific tracking data
      const { data, error } = await supabase.functions.invoke('get-tracking-info', {
        body: {}
      });

      if (error) {
        console.error('Error from get-tracking-info function:', error);
        throw new Error(error.message);
      }
      
      console.log('Tracking data received:', data);
      
      if (data && Array.isArray(data)) {
        setTrackingData(data);
        if (data.length > 0) {
          toast.success(`Loaded ${data.length} tracking records`);
        } else {
          toast.info('No tracking data found for your account');
        }
      } else {
        console.log('No tracking data returned');
        setTrackingData([]);
        toast.info('No tracking data found for your account');
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking information');
      setTrackingData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
    // Set up refresh interval (every 30 seconds for demo purposes)
    const interval = setInterval(fetchTrackingData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter tracking data based on active filter
  const getFilteredTrackingData = () => {
    if (activeFilter === 'all') return trackingData;
    return trackingData.filter(item => item.status === activeFilter);
  };

  // Calculate counts for each tracking status
  const trackingCount = {
    all: trackingData.length,
    in_transit: trackingData.filter(t => t.status === 'in_transit').length,
    out_for_delivery: trackingData.filter(t => t.status === 'out_for_delivery').length,
    delivered: trackingData.filter(t => t.status === 'delivered').length,
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Package className="mr-2" /> Tracking Dashboard
          </CardTitle>
          <CardDescription>
            Track and manage all your shipments in one place
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchTrackingData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        <TrackingFilters 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
          trackingCount={trackingCount}
        />

        <Tabs defaultValue="cards">
          <TabsList className="mb-4">
            <TabsTrigger value="cards">Card View</TabsTrigger>
            <TabsTrigger value="history">Shipping History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards">
            <TrackingList 
              trackingData={getFilteredTrackingData()} 
              isLoading={isLoading} 
              selectedTracking={selectedTracking}
              setSelectedTracking={setSelectedTracking}
              setActiveFilter={setActiveFilter}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <TrackingHistoryChart data={trackingData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrackingDashboard;
