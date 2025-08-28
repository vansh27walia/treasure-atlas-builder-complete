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
import TrackingSearchBar from './TrackingSearchBar';
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        console.log('No active session found');
        toast.error('Please log in to view tracking data');
        setTrackingData([]);
        return;
      }
      console.log('Fetching tracking data for user:', session.user.id);
      // Fetch from both tracking_records and shipment_records tables
      const [
        { data: trackingRecords, error: trackingError },
        { data: shipmentRecords, error: shipmentError }
      ] = await Promise.all([
        supabase.from('tracking_records').select('*').order('created_at', { ascending: false }),
        supabase.from('shipment_records').select('*').order('created_at', { ascending: false })
      ]);

      if (trackingError) {
        console.error('Error fetching tracking records:', trackingError);
      }
      if (shipmentError) {
        console.error('Error fetching shipment records:', shipmentError);
      }

      console.log('Fetched tracking records:', trackingRecords?.length || 0);
      console.log('Fetched shipment records:', shipmentRecords?.length || 0);

      // Transform tracking_records data
      const trackingData: TrackingInfo[] = (trackingRecords || []).map(record => ({
        id: record.id,
        tracking_code: record.tracking_code || 'N/A',
        carrier: record.carrier || 'Unknown',
        carrier_code: record.carrier?.toLowerCase() || 'unknown',
        status: record.status || 'created',
        eta: record.updated_at, // Use updated_at as fallback for eta
        last_update: record.updated_at || record.created_at,
        label_url: record.label_url,
        shipment_id: record.shipment_id || record.easypost_id || '',
        recipient: record.recipient_name || 'Unknown Recipient',
        recipient_address: record.recipient_address || 'Unknown Address',
        package_details: {
          weight: 'N/A',
          dimensions: 'N/A',
          service: record.service || 'Standard'
        },
        estimated_delivery: null,
        tracking_events: []
      }));

      // Transform shipment_records data
      const shipmentData: TrackingInfo[] = (shipmentRecords || []).map(record => {
        const toAddress = record.to_address_json as any;
        const parcel = record.parcel_json as any;
        const trackingDetails = record.tracking_details as any[];
        return {
          id: record.id.toString(),
          tracking_code: record.tracking_code || 'N/A',
          carrier: record.carrier || 'Unknown',
          carrier_code: record.carrier?.toLowerCase() || 'unknown',
          status: record.status || 'created',
          eta: record.est_delivery_date,
          last_update: record.updated_at || record.created_at,
          label_url: record.label_url,
          shipment_id: record.shipment_id || '',
          recipient: toAddress?.name || 'Unknown Recipient',
          recipient_address: toAddress ? `${toAddress.street1 || ''}, ${toAddress.city || ''}, ${toAddress.state || ''} ${toAddress.zip || ''}`.trim() : 'Unknown Address',
          package_details: {
            weight: parcel?.weight ? `${parcel.weight} oz` : 'N/A',
            dimensions: parcel ? `${parcel.length || 0}x${parcel.width || 0}x${parcel.height || 0} in` : 'N/A',
            service: record.service || 'Standard'
          },
          estimated_delivery: record.est_delivery_date ? {
            date: record.est_delivery_date,
            time_range: 'By end of day'
          } : null,
          tracking_events: Array.isArray(trackingDetails) ? trackingDetails : []
        };
      });

      // Combine and deduplicate data (prefer tracking_records over shipment_records for same tracking codes)
      const combinedData = [...trackingData];
      shipmentData.forEach(shipment => {
        const existsInTracking = trackingData.some(tracking => 
          tracking.tracking_code === shipment.tracking_code
        );
        if (!existsInTracking) {
          combinedData.push(shipment);
        }
      });

      // Sort by creation date (most recent first)
      const sortedData = combinedData.sort((a, b) => 
        new Date(b.last_update).getTime() - new Date(a.last_update).getTime()
      );

      setTrackingData(sortedData);
      console.log('Successfully loaded combined tracking data:', sortedData.length, 'items');
      if (sortedData.length > 0) {
        toast.success(`Loaded ${sortedData.length} tracking records`);
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
  const handleTrackingSearch = async (trackingNumber: string) => {
    setIsLoading(true);
    try {
      // Search in existing data first
      const existingItem = trackingData.find(item => item.tracking_code.toLowerCase() === trackingNumber.toLowerCase());
      if (existingItem) {
        setSelectedTracking(existingItem.id);
        toast.success('Tracking number found in your shipments');
      } else {
        // Try to fetch from external source
        const response = await fetch(`/tracking?search=${encodeURIComponent(trackingNumber)}`);
        if (response.ok) {
          window.location.href = `/tracking?search=${encodeURIComponent(trackingNumber)}`;
        } else {
          toast.error('Tracking number not found');
        }
      }
    } catch (error) {
      console.error('Error searching tracking number:', error);
      toast.error('Failed to search tracking number');
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
  const trackingCount = {
    all: trackingData.length,
    in_transit: trackingData.filter(t => t.status === 'in_transit').length,
    out_for_delivery: trackingData.filter(t => t.status === 'out_for_delivery').length,
    delivered: trackingData.filter(t => t.status === 'delivered').length
  };
  return <div className="space-y-6 px-[22px] my-[34px]">
      {/* Prominent Tracking Search Bar at the Top */}
      <TrackingSearchBar onSearch={handleTrackingSearch} onRefresh={fetchTrackingData} isLoading={isLoading} />

      {/* Main Tracking Dashboard */}
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
          <Button variant="outline" onClick={fetchTrackingData} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        
        <CardContent>
          <TrackingFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} trackingCount={trackingCount} />

          <Tabs defaultValue="cards">
            <TabsList className="mb-4">
              <TabsTrigger value="cards">Card View</TabsTrigger>
              <TabsTrigger value="history">Shipping History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cards">
              <TrackingList trackingData={getFilteredTrackingData()} isLoading={isLoading} selectedTracking={selectedTracking} setSelectedTracking={setSelectedTracking} setActiveFilter={setActiveFilter} />
            </TabsContent>
            
            <TabsContent value="history">
              <TrackingHistoryChart data={trackingData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default TrackingDashboard;