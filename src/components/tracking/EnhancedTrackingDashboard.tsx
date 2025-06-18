
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, RefreshCw, Truck, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrackingInfo {
  id: string;
  tracking_code: string;
  carrier: string;
  status: string;
  shipment_method: string;
  origin_address: string;
  destination_address: string;
  created_date: string;
  estimated_delivery: string;
  latest_scan_event: string;
  latest_scan_location: string;
  recipient_name: string;
  label_url?: string;
}

interface TrackingDetail {
  message: string;
  description: string;
  status: string;
  datetime: string;
  tracking_location?: {
    city: string;
    state: string;
    country: string;
  };
}

const EnhancedTrackingDashboard: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingInfo[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [trackingDetails, setTrackingDetails] = useState<TrackingDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchInternalTrackingData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipment_records')
        .select(`
          id,
          tracking_code,
          carrier,
          status,
          service,
          from_address_json,
          to_address_json,
          created_at,
          label_url
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipment records:', error);
        setTrackingData(getMockTrackingData());
      } else {
        // Transform the data to match our interface
        const transformedData = data?.map(record => {
          const fromAddress = record.from_address_json as any;
          const toAddress = record.to_address_json as any;
          
          return {
            id: record.id.toString(),
            tracking_code: record.tracking_code || 'N/A',
            carrier: record.carrier || 'Unknown',
            status: record.status || 'pending',
            shipment_method: record.service || 'Standard',
            origin_address: fromAddress ? `${fromAddress.city}, ${fromAddress.state}` : 'N/A',
            destination_address: toAddress ? `${toAddress.city}, ${toAddress.state}` : 'N/A',
            created_date: record.created_at || '',
            estimated_delivery: '',
            latest_scan_event: 'Package created',
            latest_scan_location: fromAddress ? `${fromAddress.city}, ${fromAddress.state}` : 'N/A',
            recipient_name: toAddress?.name || 'N/A',
            label_url: record.label_url || undefined
          };
        }) || [];
        
        setTrackingData(transformedData);
      }
    } catch (error) {
      console.error('Error:', error);
      setTrackingData(getMockTrackingData());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockTrackingData = (): TrackingInfo[] => [
    {
      id: '1',
      tracking_code: '1Z999AA1234567890',
      carrier: 'UPS',
      status: 'in_transit',
      shipment_method: 'Normal Shipping',
      origin_address: 'New York, NY 10001',
      destination_address: 'Los Angeles, CA 90210',
      created_date: '2024-01-15',
      estimated_delivery: '2024-01-18',
      latest_scan_event: 'Package in transit',
      latest_scan_location: 'Chicago, IL',
      recipient_name: 'John Doe'
    },
    {
      id: '2',
      tracking_code: 'EZ7000000002',
      carrier: 'FedEx',
      status: 'delivered',
      shipment_method: 'International Shipping',
      origin_address: 'Boston, MA 02101',
      destination_address: 'Toronto, ON M5V 3A8',
      created_date: '2024-01-10',
      estimated_delivery: '2024-01-14',
      latest_scan_event: 'Delivered',
      latest_scan_location: 'Toronto, ON',
      recipient_name: 'Jane Smith'
    },
    {
      id: '3',
      tracking_code: '9400109699938838383838',
      carrier: 'USPS',
      status: 'out_for_delivery',
      shipment_method: 'Batch Label Creation',
      origin_address: 'Seattle, WA 98101',
      destination_address: 'Portland, OR 97201',
      created_date: '2024-01-16',
      estimated_delivery: '2024-01-17',
      latest_scan_event: 'Out for delivery',
      latest_scan_location: 'Portland, OR',
      recipient_name: 'Mike Johnson'
    }
  ];

  const fetchTrackingDetails = async (trackingCode: string) => {
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('track-shipment-live', {
        body: { tracking_code: trackingCode }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setTrackingDetails(data.tracking_details || []);
    } catch (error) {
      console.error('Error fetching tracking details:', error);
      toast.error('Failed to fetch detailed tracking information');
      // Mock data for demo
      setTrackingDetails([
        {
          message: 'Package delivered',
          description: 'Package was delivered to recipient',
          status: 'delivered',
          datetime: '2024-01-17T14:30:00Z',
          tracking_location: { city: 'Portland', state: 'OR', country: 'US' }
        },
        {
          message: 'Out for delivery',
          description: 'Package is out for delivery',
          status: 'out_for_delivery',
          datetime: '2024-01-17T08:00:00Z',
          tracking_location: { city: 'Portland', state: 'OR', country: 'US' }
        },
        {
          message: 'Package arrived at facility',
          description: 'Package arrived at delivery facility',
          status: 'in_transit',
          datetime: '2024-01-16T22:00:00Z',
          tracking_location: { city: 'Portland', state: 'OR', country: 'US' }
        }
      ]);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchInternalTrackingData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'in_transit':
        return <Package className="h-4 w-4 text-orange-600" />;
      case 'exception':
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'in_transit':
        return 'bg-orange-100 text-orange-800';
      case 'exception':
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleTrackingClick = (trackingCode: string) => {
    if (selectedTracking === trackingCode) {
      setSelectedTracking(null);
      setTrackingDetails([]);
    } else {
      setSelectedTracking(trackingCode);
      fetchTrackingDetails(trackingCode);
    }
  };

  return (
    <Card className="border-2 border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl font-semibold flex items-center">
            <Package className="mr-2" /> Internal Shipment Tracking
          </CardTitle>
          <CardDescription>
            Detailed tracking for all your shipments (Normal, International, Batch)
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchInternalTrackingData} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Shipments</TabsTrigger>
            <TabsTrigger value="normal">Normal Shipping</TabsTrigger>
            <TabsTrigger value="international">International</TabsTrigger>
            <TabsTrigger value="batch">Batch Labels</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-4">
              {trackingData.map((shipment) => (
                <Card 
                  key={shipment.id} 
                  className={`cursor-pointer transition-all ${
                    selectedTracking === shipment.tracking_code 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleTrackingClick(shipment.tracking_code)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(shipment.status)}
                        <div>
                          <p className="font-semibold text-lg">{shipment.tracking_code}</p>
                          <p className="text-sm text-gray-600">{shipment.carrier} • {shipment.shipment_method}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(shipment.status)}>
                        {formatStatus(shipment.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Recipient</p>
                        <p className="font-medium">{shipment.recipient_name}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Route</p>
                        <p className="font-medium">{shipment.origin_address} → {shipment.destination_address}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="font-medium">{new Date(shipment.created_date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Latest: {shipment.latest_scan_event} - {shipment.latest_scan_location}</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedTracking === shipment.tracking_code && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-semibold mb-3 flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Tracking Timeline
                          {isLoadingDetails && <RefreshCw className="h-4 w-4 ml-2 animate-spin" />}
                        </h4>
                        
                        {trackingDetails.length > 0 ? (
                          <div className="space-y-3">
                            {trackingDetails.map((detail, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded border">
                                <div className="flex-shrink-0 mt-1">
                                  {getStatusIcon(detail.status)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{detail.message}</p>
                                  {detail.description && (
                                    <p className="text-sm text-gray-600">{detail.description}</p>
                                  )}
                                  <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{new Date(detail.datetime).toLocaleString()}</span>
                                    {detail.tracking_location && (
                                      <>
                                        <MapPin className="h-3 w-3 ml-3 mr-1" />
                                        <span>
                                          {detail.tracking_location.city}, {detail.tracking_location.state}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !isLoadingDetails && (
                          <p className="text-gray-500 text-sm">No detailed tracking information available</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Add filtered views for other tabs */}
          <TabsContent value="normal">
            <div className="space-y-4">
              {trackingData.filter(s => s.shipment_method.includes('Normal')).map((shipment) => (
                <div key={shipment.id} className="p-4 border rounded">
                  <p className="font-semibold">{shipment.tracking_code}</p>
                  <p className="text-sm text-gray-600">{shipment.carrier}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="international">
            <div className="space-y-4">
              {trackingData.filter(s => s.shipment_method.includes('International')).map((shipment) => (
                <div key={shipment.id} className="p-4 border rounded">
                  <p className="font-semibold">{shipment.tracking_code}</p>
                  <p className="text-sm text-gray-600">{shipment.carrier}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="batch">
            <div className="space-y-4">
              {trackingData.filter(s => s.shipment_method.includes('Batch')).map((shipment) => (
                <div key={shipment.id} className="p-4 border rounded">
                  <p className="font-semibold">{shipment.tracking_code}</p>
                  <p className="text-sm text-gray-600">{shipment.carrier}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedTrackingDashboard;
