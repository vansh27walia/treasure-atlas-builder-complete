
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Search, RefreshCw, Truck, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';
import { useFindTracking } from '@/hooks/useFindTracking';

const TrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const { searchTracking, isLoading, trackingResult, clearResults } = useFindTracking();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchTracking(trackingNumber);
  };

  return (
    <div className="container mx-auto px-4 py-8 w-full">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Truck className="mr-3 h-8 w-8" />
        Track Your Shipment
      </h1>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-xl text-blue-800">Track a Package</CardTitle>
            <CardDescription>Enter a tracking number to get the latest shipment status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                placeholder="Enter tracking number"
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
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg flex items-center">
                    <Package className="mr-2 h-5 w-5 text-blue-600" />
                    Tracking Result
                  </h3>
                  {trackingResult.source && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {trackingResult.source.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="font-medium">{trackingResult.tracking_code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium capitalize">{trackingResult.status}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Carrier</p>
                      <p className="font-medium">{trackingResult.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Recipient</p>
                      <p className="font-medium">{trackingResult.recipient}</p>
                    </div>
                  </div>
                  
                  {trackingResult.estimated_delivery && (
                    <div>
                      <p className="text-sm text-gray-500">Estimated Delivery</p>
                      <p className="font-medium">
                        {new Date(trackingResult.estimated_delivery.date).toLocaleDateString()}
                        {trackingResult.estimated_delivery.time_range && 
                          ` (${trackingResult.estimated_delivery.time_range})`}
                      </p>
                    </div>
                  )}
                  
                  {trackingResult.tracking_events && trackingResult.tracking_events.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Tracking Events</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {trackingResult.tracking_events.map((event, index) => (
                          <div key={event.id || index} className="border-l-2 border-blue-400 pl-4 py-1">
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
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearResults}
                  >
                    Clear Results
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTrackingNumber('')}
                  >
                    Track Another Package
                  </Button>
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
