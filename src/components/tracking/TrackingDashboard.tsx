 import React, { useState, useEffect, useCallback } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Package, RefreshCw, Search, Loader2 } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from '@/components/ui/sonner';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import TrackingHistoryChart from './TrackingHistoryChart';
 import TrackingFilters from './TrackingFilters';
 import TrackingList from './TrackingList';

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
   const [searchQuery, setSearchQuery] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [searchResults, setSearchResults] = useState<TrackingInfo[] | null>(null);

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

 
   // Search shipments - checks internal DB first, then external API
   const handleSearch = useCallback(async () => {
     const query = searchQuery.trim();
     if (!query) {
       setSearchResults(null);
       return;
     }
 
     setIsSearching(true);
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) {
         toast.error("Please log in to search");
         return;
       }
 
       // 1. Search internal database first
       const { data: dbResults, error: dbError } = await supabase
         .from('shipment_records')
         .select('*')
         .or(`tracking_code.ilike.%${query}%,carrier.ilike.%${query}%,status.ilike.%${query}%`)
         .order('created_at', { ascending: false })
         .limit(50);
 
       if (dbError) {
         console.error('DB search error:', dbError);
       }
 
       // Transform DB results
       const internalResults: TrackingInfo[] = (dbResults || []).map(record => {
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
 
       // 2. If no internal results and looks like a tracking number, try external API
       if (internalResults.length === 0 && query.length >= 10) {
         try {
           const { data: externalData, error: externalError } = await supabase.functions.invoke('track-shipment', {
             body: { tracking_number: query }
           });
 
           if (!externalError && externalData) {
             toast.success("Found tracking info from carrier");
             await fetchTrackingData(); // Refresh to include new record
             setSearchResults([externalData]);
             return;
           }
         } catch (e) {
           console.log('External API search failed:', e);
         }
       }
 
       if (internalResults.length > 0) {
         setSearchResults(internalResults);
         toast.success(`Found ${internalResults.length} result(s)`);
       } else {
         setSearchResults([]);
         toast.info("No shipments found matching your search");
       }
     } catch (error) {
       console.error('Search error:', error);
       toast.error("Search failed. Please try again.");
     } finally {
       setIsSearching(false);
     }
   }, [searchQuery, fetchTrackingData]);
 
   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter') {
       handleSearch();
     }
   };
 
   const clearSearch = () => {
     setSearchQuery('');
     setSearchResults(null);
   };

  useEffect(() => {
    fetchTrackingData();
  }, []);

  // Filter tracking data based on active filter
  const getFilteredTrackingData = () => {
    if (activeFilter === 'all') return trackingData;
    return trackingData.filter(item => item.status === activeFilter);
  };

   // Get the data to display - search results or filtered tracking data
   const displayData = searchResults !== null ? searchResults : getFilteredTrackingData();

  const trackingCount = {
    all: trackingData.length,
    in_transit: trackingData.filter(t => t.status === 'in_transit').length,
    out_for_delivery: trackingData.filter(t => t.status === 'out_for_delivery').length,
    delivered: trackingData.filter(t => t.status === 'delivered').length
  };
  return (
    <div className="space-y-6 px-6 py-8">
       {/* Header with Search Bar */}
       <div className="space-y-4">
         <div className="flex items-center justify-between">
           <div>
             <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
               <Package className="h-8 w-8 text-blue-600" />
               Package Tracking
             </h1>
             <p className="text-gray-600 mt-1">Search your shipments or track any package by number</p>
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
         {/* Search Bar */}
         <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
           <CardContent className="p-4">
             <div className="flex items-center gap-3">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                 <Input
                   placeholder="Search by tracking number, carrier, or status..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyPress={handleKeyPress}
                   className="pl-10 h-12 text-base border-blue-200 focus:border-blue-500"
                 />
               </div>
               <Button 
                 onClick={handleSearch}
                 disabled={isSearching}
                 className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
               >
                 {isSearching ? (
                   <Loader2 className="h-5 w-5 animate-spin" />
                 ) : (
                   <>
                     <Search className="h-5 w-5 mr-2" />
                     Search
                   </>
                 )}
               </Button>
               {searchResults !== null && (
                 <Button 
                   variant="outline" 
                   onClick={clearSearch}
                   className="h-12"
                 >
                   Clear
                 </Button>
               )}
             </div>
             <p className="text-xs text-gray-500 mt-2">
               Searches your saved shipments. Enter a new tracking number to fetch from carrier API.
             </p>
           </CardContent>
         </Card>
      </div>

       {/* Tracking Filters - only show when not searching */}
       {searchResults === null && (
         <TrackingFilters 
           activeFilter={activeFilter} 
           setActiveFilter={setActiveFilter} 
           trackingCount={trackingCount} 
         />
       )}
 
       {/* Search Results Info */}
       {searchResults !== null && (
         <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
           <span className="text-sm text-blue-700">
             Showing {searchResults.length} search result(s) for "{searchQuery}"
           </span>
           <Button variant="ghost" size="sm" onClick={clearSearch} className="text-blue-600">
             Show all shipments
           </Button>
         </div>
       )}

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
               trackingData={displayData} 
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