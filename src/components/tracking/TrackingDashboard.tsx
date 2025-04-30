
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, RefreshCw, Truck, CheckCircle, MapPin, Clock, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrackingHistoryChart from './TrackingHistoryChart';

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
      const { data, error } = await supabase.functions.invoke('get-tracking-info', {
        body: {}
      });

      if (error) throw new Error(error.message);
      
      setTrackingData(data || []);
      toast.success('Tracking data updated');
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking information');
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

  // Get status badge color based on tracking status
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'delivered': 
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'in_transit': 
        return <Badge className="bg-blue-500">In Transit</Badge>;
      case 'out_for_delivery': 
        return <Badge className="bg-purple-500">Out for Delivery</Badge>;
      default: 
        return <Badge className="bg-gray-500">Processing</Badge>;
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

  // Get estimated delivery text
  const getEstimatedDeliveryText = (item: TrackingInfo) => {
    if (item.status === 'delivered') {
      return 'Delivered on ' + new Date(item.last_update).toLocaleDateString();
    }
    
    if (item.estimated_delivery) {
      return `Est. delivery: ${new Date(item.estimated_delivery.date).toLocaleDateString()} ${item.estimated_delivery.time_range}`;
    }
    
    if (item.eta) {
      return 'Est. delivery: ' + new Date(item.eta).toLocaleDateString();
    }
    
    return 'No estimated delivery time';
  };

  // Track a specific package and show detailed view
  const viewPackageDetails = (trackingCode: string) => {
    setSelectedTracking(trackingCode === selectedTracking ? null : trackingCode);
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
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All ({trackingData.length})
          </Button>
          <Button 
            variant={activeFilter === 'in_transit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('in_transit')}
            className={activeFilter === 'in_transit' ? 'bg-blue-500 hover:bg-blue-600' : ''}
          >
            <Truck className="h-4 w-4 mr-1" />
            In Transit ({trackingData.filter(t => t.status === 'in_transit').length})
          </Button>
          <Button 
            variant={activeFilter === 'out_for_delivery' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('out_for_delivery')}
            className={activeFilter === 'out_for_delivery' ? 'bg-purple-500 hover:bg-purple-600' : ''}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Out for Delivery ({trackingData.filter(t => t.status === 'out_for_delivery').length})
          </Button>
          <Button 
            variant={activeFilter === 'delivered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('delivered')}
            className={activeFilter === 'delivered' ? 'bg-green-500 hover:bg-green-600' : ''}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Delivered ({trackingData.filter(t => t.status === 'delivered').length})
          </Button>
        </div>

        <Tabs defaultValue="cards">
          <TabsList className="mb-4">
            <TabsTrigger value="cards">Card View</TabsTrigger>
            <TabsTrigger value="history">Shipping History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards">
            {getFilteredTrackingData().length > 0 ? (
              <div className="space-y-4">
                {getFilteredTrackingData().map((item) => (
                  <div key={item.id} className="border rounded-md overflow-hidden bg-white shadow-sm">
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                      onClick={() => viewPackageDetails(item.tracking_code)}
                    >
                      <div className="flex items-center">
                        {getStatusIcon(item.status)}
                        <div className="ml-3">
                          <div className="font-semibold flex items-center">
                            {item.carrier} - {item.tracking_code}
                          </div>
                          <div className="text-sm text-gray-500">
                            To: {item.recipient} • {item.recipient_address}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(item.status)}
                            <span className="text-sm text-gray-500">
                              {getEstimatedDeliveryText(item)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <Badge variant="outline" className="hidden md:flex">
                          {item.package_details.service}
                        </Badge>
                        
                        {item.label_url && (
                          <Button size="sm" variant="ghost" asChild className="rounded-full p-2">
                            <a href={item.label_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {selectedTracking === item.tracking_code && (
                      <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                        <div className="grid gap-4 md:grid-cols-3 mb-4">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Package Details</p>
                            <p className="text-sm">Weight: {item.package_details.weight}</p>
                            <p className="text-sm">Dimensions: {item.package_details.dimensions}</p>
                            <p className="text-sm">Service: {item.package_details.service}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Recipient</p>
                            <p className="text-sm">{item.recipient}</p>
                            <p className="text-sm">{item.recipient_address}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Shipment ID</p>
                            <p className="text-sm">{item.shipment_id}</p>
                            <p className="text-xs font-medium text-gray-500 mt-2">Last Updated</p>
                            <p className="text-sm">{new Date(item.last_update).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <h4 className="text-sm font-semibold mb-3">Tracking History</h4>
                        <div className="relative">
                          <div className="absolute top-0 bottom-0 left-[16px] w-[2px] bg-gray-200"></div>
                          {item.tracking_events?.map((event, index) => (
                            <div key={event.id} className="flex mb-4 relative">
                              <div className={`h-8 w-8 rounded-full ${
                                event.status === 'delivered' ? 'bg-green-500' : 
                                event.status === 'in_transit' ? 'bg-blue-500' : 
                                event.status === 'out_for_delivery' ? 'bg-purple-500' : 
                                'bg-gray-500'
                              } flex items-center justify-center z-10`}>
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
                        
                        <div className="flex justify-end mt-4 gap-2">
                          {item.label_url && (
                            <a 
                              href={item.label_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              <Download className="mr-1 h-4 w-4" /> Download Label
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold text-gray-900">No shipments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isLoading ? 'Loading tracking data...' : 'No shipments match the current filter'}
                </p>
                {!isLoading && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveFilter('all')}
                  >
                    Show all shipments
                  </Button>
                )}
              </div>
            )}
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
