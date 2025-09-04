
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Truck, MapPin, Clock, ExternalLink, RefreshCw, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';

interface TrackingInfo {
  tracking_code: string;
  carrier: string;
  status: string;
  estimated_delivery: string;
  current_location: string;
  label_url?: string;
  tracking_events: Array<{
    date: string;
    time: string;
    status: string;
    location: string;
    description: string;
  }>;
}

const TrackingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFullDashboard, setShowFullDashboard] = useState(true);

  useEffect(() => {
    // Check for tracking number in URL params
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setTrackingNumber(searchParam);
      setShowFullDashboard(false);
      handleTrackingSearch(searchParam);
    }

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentTrackingSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, [location]);

  const handleTrackingSearch = async (trackingCode?: string) => {
    const searchTerm = trackingCode || trackingNumber.trim();
    
    if (!searchTerm) {
      toast.error('Please enter a tracking number');
      return;
    }

    setIsLoading(true);
    setShowFullDashboard(false);
    
    try {
      // First try to get tracking info from our database
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipment_records')
        .select('*')
        .eq('tracking_code', searchTerm)
        .single();

      if (shipmentData && !shipmentError) {
        // Convert our data to the expected format
        const trackingData: TrackingInfo = {
          tracking_code: shipmentData.tracking_code,
          carrier: shipmentData.carrier || 'Unknown',
          status: shipmentData.status || 'In Transit',
          estimated_delivery: shipmentData.est_delivery_date || 'Unknown',
          current_location: 'In Transit',
          label_url: shipmentData.label_url || undefined,
          tracking_events: shipmentData.tracking_details ? 
            (shipmentData.tracking_details as any).events || [] : 
            [
              {
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                status: 'Label Created',
                location: 'Origin Facility',
                description: 'Shipping label has been created'
              }
            ]
        };
        
        setTrackingInfo(trackingData);
        
        // Add to recent searches
        const updatedSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentTrackingSearches', JSON.stringify(updatedSearches));
        
        toast.success('Tracking information found');
      } else {
        // If not found in our database, try external tracking
        const { data, error } = await supabase.functions.invoke('get-tracking-info', {
          body: { trackingCode: searchTerm }
        });

        if (error) throw error;

        if (data && data.tracking_info) {
          setTrackingInfo(data.tracking_info);
          toast.success('Tracking information retrieved');
        } else {
          toast.error('Tracking number not found');
          setTrackingInfo(null);
        }
      }
    } catch (error) {
      console.error('Error fetching tracking info:', error);
      toast.error('Unable to fetch tracking information');
      setTrackingInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in transit':
      case 'out for delivery':
        return 'bg-blue-100 text-blue-800';
      case 'exception':
      case 'delivery failed':
        return 'bg-red-100 text-red-800';
      case 'label created':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBackToDashboard = () => {
    setShowFullDashboard(true);
    setTrackingInfo(null);
    setTrackingNumber('');
    // Clear URL params
    window.history.pushState({}, document.title, window.location.pathname);
  };

  if (showFullDashboard && !trackingInfo) {
    return <TrackingDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Shipment</h1>
              <p className="text-gray-600">Enter your tracking number to get real-time updates</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleBackToDashboard}
              className="flex items-center"
            >
              <Package className="w-4 h-4 mr-2" />
              View All Tracking
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter tracking number (e.g., 1Z999AA1234567890)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrackingSearch()}
                className="text-lg h-12"
              />
            </div>
            <Button 
              onClick={() => handleTrackingSearch()} 
              disabled={isLoading}
              className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Track Package
                </>
              )}
            </Button>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTrackingNumber(search);
                      handleTrackingSearch(search);
                    }}
                    className="text-xs"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Tracking Results */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {trackingInfo.tracking_code}
                  </h2>
                  <p className="text-gray-600">{trackingInfo.carrier}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(trackingInfo.status)}>
                    {trackingInfo.status}
                  </Badge>
                  {trackingInfo.label_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a 
                        href={trackingInfo.label_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View Label
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Current Location</p>
                    <p className="font-medium">{trackingInfo.current_location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium">{trackingInfo.estimated_delivery}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Carrier</p>
                    <p className="font-medium">{trackingInfo.carrier}</p>
                  </div>
                </div>
              </div>

              {/* Display Tracking URL if available */}
              {trackingInfo.label_url && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Shipping Label</p>
                      <p className="text-sm text-blue-700">Click to view or download the shipping label</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a 
                        href={trackingInfo.label_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Label
                      </a>
                    </Button>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-blue-600 break-all">{trackingInfo.label_url}</p>
                  </div>
                </div>
              )}
            </Card>

            {/* Tracking Timeline */}
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Tracking History</h3>
              <div className="space-y-4">
                {trackingInfo.tracking_events.map((event, index) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{event.status}</h4>
                        <span className="text-sm text-gray-500">
                          {event.date} {event.time}
                        </span>
                      </div>
                      <p className="text-gray-600">{event.description}</p>
                      <p className="text-sm text-gray-500">{event.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">More Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => handleTrackingSearch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                <Button variant="outline" onClick={() => navigate('/create-label')}>
                  <Package className="h-4 w-4 mr-2" />
                  Create New Label
                </Button>
                <Button variant="outline" onClick={handleBackToDashboard}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View All Tracking
                </Button>
                {trackingInfo.label_url && (
                  <Button variant="outline" asChild>
                    <a 
                      href={trackingInfo.label_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Label
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
