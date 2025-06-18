
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  status: string;
  eta: string | null;
  last_update: string;
  label_url: string | null;
  shipment_id: string;
  recipient: string;
  recipient_address: string;
  service: string;
  created_at: string;
  tracking_events?: TrackingEvent[];
  est_delivery_date?: string;
}

const TrackingDashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchTrackingData = async () => {
    setIsLoading(true);
    try {
      // Fetch actual shipment records from database
      const { data: shipments, error } = await supabase
        .from('shipment_records')
        .select(`
          id,
          tracking_code,
          carrier,
          service,
          status,
          shipment_id,
          label_url,
          created_at,
          to_address_json,
          tracking_details,
          est_delivery_date,
          updated_at
        `)
        .not('tracking_code', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message);
      }
      
      // Transform shipment data to match tracking interface
      const transformedData: TrackingInfo[] = shipments?.map(shipment => {
        const toAddress = shipment.to_address_json as any;
        const recipient = toAddress?.name || 'Unknown Recipient';
        const recipientAddress = toAddress ? 
          `${toAddress.street1}, ${toAddress.city}, ${toAddress.state} ${toAddress.zip}` : 
          'Unknown Address';
        
        return {
          id: shipment.id.toString(),
          tracking_code: shipment.tracking_code || '',
          carrier: shipment.carrier || 'Unknown',
          status: shipment.status || 'unknown',
          eta: shipment.est_delivery_date,
          last_update: shipment.updated_at || shipment.created_at || '',
          label_url: shipment.label_url,
          shipment_id: shipment.shipment_id || '',
          recipient,
          recipient_address: recipientAddress,
          service: shipment.service || 'Standard',
          created_at: shipment.created_at || '',
          tracking_events: shipment.tracking_details as TrackingEvent[] || [],
          est_delivery_date: shipment.est_delivery_date
        };
      }) || [];
      
      setTrackingData(transformedData);
      toast.success(`Loaded ${transformedData.length} shipments`);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking information');
      setTrackingData([]); // Set empty array on error
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
            <Package className="mr-2" /> Your Shipments Dashboard
          </CardTitle>
          <CardDescription>
            Track shipments from normal shipping, international shipping, and batch labels
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
