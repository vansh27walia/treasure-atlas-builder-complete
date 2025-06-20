
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
        console.log('No active session found');
        toast.error('Please log in to view tracking data');
        setTrackingData([]);
        return;
      }

      console.log('Fetching tracking data for user:', session.user.id);

      // Fetch user-scoped tracking data from shipment_records
      const { data: shipmentRecords, error } = await supabase
        .from('shipment_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipment records:', error);
        throw new Error(error.message);
      }

      console.log('Fetched shipment records:', shipmentRecords?.length || 0);

      // Transform shipment records to tracking format
      const transformedData: TrackingInfo[] = (shipmentRecords || []).map((record) => ({
        id: record.id.toString(),
        tracking_code: record.tracking_code || 'N/A',
        carrier: record.carrier || 'Unknown',
        carrier_code: record.carrier?.toLowerCase() || 'unknown',
        status: record.status || 'created',
        eta: record.est_delivery_date,
        last_update: record.updated_at || record.created_at,
        label_url: record.label_url,
        shipment_id: record.shipment_id || '',
        recipient: record.to_address_json?.name || 'Unknown Recipient',
        recipient_address: record.to_address_json ? 
          `${record.to_address_json.street1}, ${record.to_address_json.city}, ${record.to_address_json.state} ${record.to_address_json.zip}` : 
          'Unknown Address',
        package_details: {
          weight: record.parcel_json?.weight ? `${record.parcel_json.weight} oz` : 'N/A',
          dimensions: record.parcel_json ? 
            `${record.parcel_json.length}x${record.parcel_json.width}x${record.parcel_json.height} in` : 
            'N/A',
          service: record.service || 'Standard'
        },
        estimated_delivery: record.est_delivery_date ? {
          date: record.est_delivery_date,
          time_range: 'By end of day'
        } : null,
        tracking_events: record.tracking_details || []
      }));

      setTrackingData(transformedData);
      console.log('Successfully loaded tracking data:', transformedData.length, 'items');
      
      if (transformedData.length > 0) {
        toast.success(`Loaded ${transformedData.length} tracking records`);
      } else {
        toast.info('No tracking data found. Create a shipping label to see tracking information here.');
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
