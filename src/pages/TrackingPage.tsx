
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Search, RefreshCw, Truck, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';

const TrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsLoading(true);

    try {
      // Call live EasyPost tracking API through edge function
      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: { tracking_number: trackingNumber.trim() }
      });

      if (error) {
        throw new Error('Error tracking shipment: ' + error.message);
      }

      setTrackingResult(data);
      toast.success('Tracking information retrieved successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Unable to track package. Please check the tracking number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncTrackingData = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-tracking-data', {});

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Successfully updated ${data.updated_count} of ${data.total_shipments} shipments`);
      
      // Refresh the tracking dashboard
      window.location.reload();
    } catch (error) {
      console.error('Error syncing tracking data:', error);
      toast.error('Failed to sync tracking data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-800 flex items-center">
          <Truck className="mr-3 h-8 w-8" />
          Track Your Shipment
        </h1>
        <Button 
          onClick={handleSyncTrackingData}
          disabled={isSyncing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sync All Tracking
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-xl text-blue-800">Universal Package Tracking</CardTitle>
            <CardDescription>Enter any tracking number to get real-time shipment status via EasyPost</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                placeholder="Enter any tracking number (EZ1000000001, 1Z999999999, etc.)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="flex-1"
              />
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Track Package
                  </>
                )}
              </Button>
            </form>
            
            {trackingResult && (
              <div className="mt-6 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  <Package className="mr-2 h-5 w-5 text-blue-600" />
                  Live Tracking Result
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="font-medium">{trackingResult.tracking_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Carrier</p>
                      <p className="font-medium">{trackingResult.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{trackingResult.status}</p>
                    </div>
                    {trackingResult.est_delivery_date && (
                      <div>
                        <p className="text-sm text-gray-500">Est. Delivery</p>
                        <p className="font-medium">{new Date(trackingResult.est_delivery_date).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {trackingResult.signed_by && (
                    <div>
                      <p className="text-sm text-gray-500">Signed By</p>
                      <p className="font-medium">{trackingResult.signed_by}</p>
                    </div>
                  )}
                  
                  {trackingResult.tracking_details && trackingResult.tracking_details.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Tracking History</h4>
                      <div className="space-y-3">
                        {trackingResult.tracking_details.map((event: any, index: number) => (
                          <div key={index} className="border-l-2 border-blue-400 pl-4 py-1">
                            <p className="font-medium">{event.description}</p>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{event.location}</span>
                              <span className="mx-2">•</span>
                              <span>{new Date(event.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {trackingResult.public_url && (
                    <div className="pt-2">
                      <a 
                        href={trackingResult.public_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View on carrier website →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <TrackingDashboard />
      </div>
    </div>
  );
};

export default TrackingPage;
