import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, RefreshCw, Search, Upload, Plus, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TrackingHistoryChart from './TrackingHistoryChart';
import TrackingFilters from './TrackingFilters';
import TrackingList from './TrackingList';
import { useNavigate } from 'react-router-dom';

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
  const [trackingInput, setTrackingInput] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const navigate = useNavigate();

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
      const {
        data: shipmentRecords,
        error
      } = await supabase.from('shipment_records').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching shipment records:', error);
        throw new Error(error.message);
      }
      console.log('Fetched shipment records:', shipmentRecords?.length || 0);
      const transformedData: TrackingInfo[] = (shipmentRecords || []).map(record => {
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
      setTrackingData(transformedData);
      console.log('Successfully loaded tracking data:', transformedData.length, 'items');
      if (transformedData.length > 0) {
        toast.success(`Loaded ${transformedData.length} tracking records`);
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

  // Track a package by entering tracking number
  const handleTrackPackage = async () => {
    if (!trackingInput.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to track packages");
      return;
    }
    
    setIsTracking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: { tracking_number: trackingInput.trim() }
      });
      
      if (error) throw error;
      
      if (data) {
        toast.success("Package tracking added successfully");
        setTrackingInput('');
        await fetchTrackingData();
      } else {
        toast.error("No tracking information found for this number");
      }
    } catch (error) {
      console.error('Error tracking package:', error);
      toast.error("Error tracking package. Please check the tracking number and try again.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTrackPackage();
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
  return (
    <div className="space-y-6 px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Package Tracking
          </h1>
          <p className="text-gray-600 mt-1">Track any shipment by entering its tracking number</p>
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
      </div>

      {/* Add Tracking Options - Two Clear Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Track by Number */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Track by Number</h3>
                <p className="text-sm text-gray-500">Enter any carrier's tracking number</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 1Z999AA1234567890"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 h-12 text-base border-blue-200 focus:border-blue-400"
              />
              <Button 
                onClick={handleTrackPackage}
                disabled={isTracking}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
              >
                {isTracking ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-1" />
                    Track
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Option 2: Bulk Upload */}
        <Card 
          className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate('/bulk-upload')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Bulk Upload CSV</h3>
                <p className="text-sm text-gray-500">Import multiple tracking numbers at once</p>
              </div>
            </div>
            <Button 
              variant="outline"
              className="w-full h-12 border-purple-300 text-purple-700 hover:bg-purple-100"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/bulk-upload');
              }}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload CSV File
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Filters */}
      <TrackingFilters 
        activeFilter={activeFilter} 
        setActiveFilter={setActiveFilter} 
        trackingCount={trackingCount} 
      />

      {/* Tracking Data Views */}
      <Card className="border border-gray-200">
        <Tabs defaultValue="cards" className="w-full">
          <div className="border-b border-gray-200 px-4 pt-4">
            <TabsList className="mb-0">
              <TabsTrigger value="cards">Card View</TabsTrigger>
              <TabsTrigger value="history">Shipping History</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="cards" className="p-4 mt-0">
            <TrackingList 
              trackingData={getFilteredTrackingData()} 
              isLoading={isLoading} 
              selectedTracking={selectedTracking} 
              setSelectedTracking={setSelectedTracking} 
              setActiveFilter={setActiveFilter} 
            />
          </TabsContent>
          
          <TabsContent value="history" className="p-4 mt-0">
            <TrackingHistoryChart data={trackingData} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default TrackingDashboard;