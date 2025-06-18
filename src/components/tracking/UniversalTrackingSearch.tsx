
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, Package, Truck, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TrackingDetail {
  message: string;
  description: string;
  status: string;
  status_detail: string;
  datetime: string;
  source: string;
  tracking_location?: {
    city: string;
    state: string;
    country: string;
    zip: string;
  };
}

interface TrackingResult {
  tracking_code: string;
  status: string;
  carrier: string;
  carrier_detail: string;
  public_url?: string;
  signed_by?: string;
  weight?: number;
  est_delivery_date?: string;
  shipment_id?: string;
  tracking_details: TrackingDetail[];
  fees?: any[];
  created_at: string;
  updated_at: string;
}

const UniversalTrackingSearch: React.FC = () => {
  const [trackingInput, setTrackingInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!trackingInput.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setTrackingResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('track-shipment-live', {
        body: { tracking_code: trackingInput.trim() }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        setSearchError(data.error);
        return;
      }

      setTrackingResult(data);
      toast.success('Tracking information retrieved successfully');
    } catch (error) {
      console.error('Error tracking shipment:', error);
      setSearchError('Unable to track package. Please check the tracking number and try again.');
      toast.error('Failed to track shipment');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'in_transit':
        return <Package className="h-5 w-5 text-orange-600" />;
      case 'exception':
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="w-full space-y-6">
      {/* Search Bar */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center mb-4">
          <Search className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-blue-900">Universal Tracking Search</h2>
        </div>
        
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Enter any tracking number (EasyPost, UPS, FedEx, USPS, etc.)"
            value={trackingInput}
            onChange={(e) => setTrackingInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 text-lg"
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 px-8"
            size="lg"
          >
            {isSearching ? (
              <>
                <Search className="mr-2 h-5 w-5 animate-pulse" />
                Tracking...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Track Package
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {searchError && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800">Tracking Error</h3>
              <p className="text-red-600">{searchError}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Tracking Results */}
      {trackingResult && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getStatusIcon(trackingResult.status)}
                <h3 className="text-xl font-semibold ml-3">
                  Tracking: {trackingResult.tracking_code}
                </h3>
              </div>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded">
                {trackingResult.carrier}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current Status</p>
                <p className="font-semibold text-lg">{formatStatus(trackingResult.status)}</p>
              </div>
              
              {trackingResult.est_delivery_date && (
                <div>
                  <p className="text-sm text-gray-500">Estimated Delivery</p>
                  <p className="font-semibold">
                    {new Date(trackingResult.est_delivery_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              {trackingResult.signed_by && (
                <div>
                  <p className="text-sm text-gray-500">Signed By</p>
                  <p className="font-semibold">{trackingResult.signed_by}</p>
                </div>
              )}
            </div>

            {trackingResult.public_url && (
              <div className="mt-4">
                <Button
                  onClick={() => window.open(trackingResult.public_url, '_blank')}
                  variant="outline"
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  View on {trackingResult.carrier} Website
                </Button>
              </div>
            )}
          </Card>

          {/* Tracking Timeline */}
          {trackingResult.tracking_details && trackingResult.tracking_details.length > 0 && (
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Tracking Timeline
              </h4>
              
              <div className="space-y-4">
                {trackingResult.tracking_details
                  .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
                  .map((detail, index) => (
                    <div key={index} className="flex items-start space-x-4 border-l-2 border-blue-200 pl-4 py-2">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(detail.status)}
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium">{detail.message}</p>
                        {detail.description && (
                          <p className="text-sm text-gray-600">{detail.description}</p>
                        )}
                        
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{new Date(detail.datetime).toLocaleString()}</span>
                          
                          {detail.tracking_location && (
                            <>
                              <MapPin className="h-4 w-4 ml-4 mr-1" />
                              <span>
                                {detail.tracking_location.city}, {detail.tracking_location.state} {detail.tracking_location.zip}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversalTrackingSearch;
