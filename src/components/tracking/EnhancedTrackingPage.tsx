
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Search, RefreshCw, Truck, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useFindTracking } from '@/hooks/useFindTracking';

const EnhancedTrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const { searchTracking, isLoading, trackingResult, clearResults } = useFindTracking();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }
    await searchTracking(trackingNumber.trim());
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'in_transit':
        return <Truck className="h-6 w-6 text-blue-500" />;
      case 'out_for_delivery':
        return <MapPin className="h-6 w-6 text-purple-500" />;
      case 'created':
        return <Package className="h-6 w-6 text-gray-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'created':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Track Your Package
        </h1>
        <p className="text-gray-600 text-lg">
          Enter your tracking number below to get real-time updates on your shipment
        </p>
      </div>

      {/* Enhanced Search Form */}
      <Card className="mb-8 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter tracking number (e.g., 1Z999AA1234567890, 9400100000000000000000)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="text-lg py-6 pl-12 pr-4 border-2 border-gray-200 focus:border-blue-500 transition-colors"
              />
              <Package className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-3 h-5 w-5" />
                  Track Package
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Enhanced Results Display */}
      {trackingResult && (
        <div className="space-y-6">
          {/* Status Overview */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-3">
                  {getStatusIcon(trackingResult.status)}
                  Package Status
                </CardTitle>
                <Badge className={`px-4 py-2 text-lg font-medium border ${getStatusColor(trackingResult.status)}`}>
                  {formatStatus(trackingResult.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Tracking Number</p>
                  <p className="text-lg font-mono font-bold">{trackingResult.tracking_code}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Carrier</p>
                  <p className="text-lg font-semibold">{trackingResult.carrier}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Recipient</p>
                  <p className="text-lg">{trackingResult.recipient}</p>
                </div>
              </div>

              {trackingResult.estimated_delivery && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-blue-800">Estimated Delivery</p>
                  </div>
                  <p className="text-lg text-blue-700">
                    {new Date(trackingResult.estimated_delivery.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    {trackingResult.estimated_delivery.time_range && 
                      ` (${trackingResult.estimated_delivery.time_range})`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-green-600" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Delivery Address</p>
                <p className="text-lg">{trackingResult.recipient_address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          {trackingResult.tracking_events && trackingResult.tracking_events.length > 0 && (
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                  Tracking Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  <div className="space-y-6">
                    {trackingResult.tracking_events.map((event, index) => (
                      <div key={event.id || index} className="relative flex items-start gap-4">
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                          event.status === 'delivered' ? 'bg-green-500' :
                          event.status === 'in_transit' ? 'bg-blue-500' :
                          event.status === 'out_for_delivery' ? 'bg-purple-500' :
                          'bg-gray-400'
                        }`}>
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.description}</h3>
                            <div className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              onClick={clearResults}
              className="flex-1 py-3"
            >
              Clear Results
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setTrackingNumber('')}
              className="flex-1 py-3"
            >
              Track Another Package
            </Button>
            {trackingResult.source && (
              <Badge variant="outline" className="self-center px-4 py-2">
                Source: {trackingResult.source.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Help Section */}
      <Card className="mt-8 bg-gray-50 border-0">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Tracking Number Format</h4>
              <p className="text-gray-600">
                Enter your tracking number exactly as shown on your shipping receipt or email confirmation.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Update Frequency</h4>
              <p className="text-gray-600">
                Tracking information is updated in real-time. Check back for the latest status updates.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Multiple Carriers</h4>
              <p className="text-gray-600">
                We support tracking for USPS, UPS, FedEx, DHL, and many other carriers automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTrackingPage;
