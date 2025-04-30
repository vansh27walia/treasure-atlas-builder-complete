
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw, Truck, CheckCircle, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrackingHistoryChart from './TrackingHistoryChart';

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  status: string;
  eta: string | null;
  last_update: string;
  label_url: string | null;
  tracking_events?: TrackingEvent[];
}

interface TrackingEvent {
  description: string;
  location: string;
  timestamp: string;
  status: string;
}

const TrackingDashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);

  const fetchTrackingData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-tracking-info', {
        body: {}
      });

      if (error) throw new Error(error.message);
      
      // Add mock tracking events for demonstration
      const enhancedData = data.map((item: TrackingInfo) => ({
        ...item,
        tracking_events: generateTrackingEvents(item.status)
      }));
      
      setTrackingData(enhancedData || []);
      toast.success('Tracking data updated');
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking information');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock tracking events based on status
  const generateTrackingEvents = (status: string): TrackingEvent[] => {
    const events = [
      {
        description: "Shipment information received",
        location: "Shipping Partner Facility",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "info"
      },
      {
        description: "Picked up by carrier",
        location: "Shipping Partner Facility",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: "picked_up"
      },
      {
        description: "Departed shipping partner facility",
        location: "Shipping Partner Facility",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_transit"
      }
    ];
    
    if (status === "in_transit") {
      events.push({
        description: "In transit to next facility",
        location: "Distribution Center",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_transit"
      });
      events.push({
        description: "Arrived at distribution center",
        location: "Regional Distribution Center",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_transit"
      });
      events.push({
        description: "Out for delivery",
        location: "Local Delivery Facility",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "out_for_delivery"
      });
    }
    
    if (status === "delivered") {
      events.push({
        description: "In transit to next facility",
        location: "Distribution Center",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_transit"
      });
      events.push({
        description: "Arrived at distribution center",
        location: "Regional Distribution Center",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_transit"
      });
      events.push({
        description: "Out for delivery",
        location: "Local Delivery Facility",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "out_for_delivery"
      });
      events.push({
        description: "Delivered",
        location: "Destination",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: "delivered"
      });
    }
    
    return events;
  };

  useEffect(() => {
    fetchTrackingData();
    // Set up refresh interval (every 5 minutes)
    const interval = setInterval(fetchTrackingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get the status color based on tracking status
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': 
        return 'bg-green-500';
      case 'in_transit': 
        return 'bg-blue-500';
      case 'out_for_delivery': 
        return 'bg-purple-500';
      default: 
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': 
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_transit': 
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'out_for_delivery': 
        return <MapPin className="h-5 w-5 text-purple-500" />;
      default: 
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Track a specific package and show detailed view
  const viewPackageDetails = (trackingCode: string) => {
    setSelectedTracking(trackingCode === selectedTracking ? null : trackingCode);
  };

  return (
    <Card className="border-2 border-gray-200 p-6 mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center">
          <Package className="mr-2" /> Tracking Dashboard
        </h2>
        <Button 
          variant="outline" 
          onClick={fetchTrackingData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Active Shipments</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="history">Shipping History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {trackingData.filter(t => t.status !== 'delivered').length > 0 ? (
            <div className="space-y-4">
              {trackingData.filter(t => t.status !== 'delivered').map((item) => (
                <div key={item.id} className="border rounded-md overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => viewPackageDetails(item.tracking_code)}
                  >
                    <div className="flex items-center">
                      {getStatusIcon(item.status)}
                      <div className="ml-3">
                        <div className="font-semibold">{item.carrier} - {item.tracking_code}</div>
                        <div className="text-sm text-green-700 font-medium">Status: {item.status.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">Updated: {new Date(item.last_update).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.eta && (
                        <div className="text-sm text-blue-600">
                          Estimated delivery: {new Date(item.eta).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedTracking === item.tracking_code && (
                    <div className="px-4 pb-4 pt-2 border-t">
                      <h4 className="text-sm font-semibold mb-3">Tracking History</h4>
                      <div className="relative">
                        <div className="absolute top-0 bottom-0 left-[16px] w-[2px] bg-gray-200"></div>
                        {item.tracking_events?.map((event, index) => (
                          <div key={index} className="flex mb-4 relative">
                            <div className={`h-8 w-8 rounded-full ${getStatusColor(event.status)} flex items-center justify-center z-10`}>
                              {getStatusIcon(event.status)}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{event.description}</div>
                              <div className="text-sm text-gray-600">{event.location}</div>
                              <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        {item.label_url && (
                          <a 
                            href={item.label_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            View Label
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No active shipments found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="delivered">
          {trackingData.filter(t => t.status === 'delivered').length > 0 ? (
            <div className="space-y-4">
              {trackingData.filter(t => t.status === 'delivered').map((item) => (
                <div key={item.id} className="border rounded-md overflow-hidden">
                  <div 
                    className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => viewPackageDetails(item.tracking_code)}
                  >
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="ml-3">
                        <div className="font-semibold">{item.carrier} - {item.tracking_code}</div>
                        <div className="text-sm text-green-700 font-medium">Status: Delivered</div>
                        <div className="text-sm text-gray-500">Delivered: {new Date(item.last_update).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTracking === item.tracking_code && (
                    <div className="px-4 pb-4 pt-2 border-t">
                      <h4 className="text-sm font-semibold mb-3">Tracking History</h4>
                      <div className="relative">
                        <div className="absolute top-0 bottom-0 left-[16px] w-[2px] bg-gray-200"></div>
                        {item.tracking_events?.map((event, index) => (
                          <div key={index} className="flex mb-4 relative">
                            <div className={`h-8 w-8 rounded-full ${getStatusColor(event.status)} flex items-center justify-center z-10`}>
                              {getStatusIcon(event.status)}
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{event.description}</div>
                              <div className="text-sm text-gray-600">{event.location}</div>
                              <div className="text-xs text-gray-500">{new Date(event.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        {item.label_url && (
                          <a 
                            href={item.label_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            View Label
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No delivered shipments found
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <TrackingHistoryChart data={trackingData} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TrackingDashboard;
