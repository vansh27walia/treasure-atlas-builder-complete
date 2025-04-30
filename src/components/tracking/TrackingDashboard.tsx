
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw } from 'lucide-react';
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
}

const TrackingDashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    // Set up refresh interval (every 5 minutes)
    const interval = setInterval(fetchTrackingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
                <div key={item.id} className="p-4 border rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.carrier} - {item.tracking_code}</div>
                    <div className="text-sm text-green-700 font-medium">Status: {item.status}</div>
                    <div className="text-sm text-gray-500">Updated: {new Date(item.last_update).toLocaleString()}</div>
                    {item.eta && (
                      <div className="text-sm text-blue-600">Estimated delivery: {new Date(item.eta).toLocaleDateString()}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                    <a 
                      href={`https://www.easypost.com/trackers/${item.tracking_code}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      Track Package
                    </a>
                  </div>
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
                <div key={item.id} className="p-4 border rounded-md flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{item.carrier} - {item.tracking_code}</div>
                    <div className="text-sm text-green-700 font-medium">Status: {item.status}</div>
                    <div className="text-sm text-gray-500">Delivered: {new Date(item.last_update).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
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
