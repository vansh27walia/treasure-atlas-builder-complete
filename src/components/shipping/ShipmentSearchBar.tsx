 import React, { useState, useCallback } from 'react';
 import { Card, CardContent } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Search, Loader2, Database, Globe } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from '@/components/ui/sonner';
 
 interface ShipmentResult {
   id: string;
   tracking_code: string;
   carrier: string;
   status: string;
   recipient?: string;
   est_delivery_date?: string;
   created_at?: string;
 }
 
 interface ShipmentSearchBarProps {
   onResults?: (results: ShipmentResult[]) => void;
   onSelect?: (shipment: ShipmentResult) => void;
   compact?: boolean;
   placeholder?: string;
 }
 
 const ShipmentSearchBar: React.FC<ShipmentSearchBarProps> = ({
   onResults,
   onSelect,
   compact = false,
   placeholder = "Search by tracking number, carrier, or status..."
 }) => {
   const [searchQuery, setSearchQuery] = useState('');
   const [isSearching, setIsSearching] = useState(false);
   const [results, setResults] = useState<ShipmentResult[]>([]);
   const [showResults, setShowResults] = useState(false);
   const [searchSource, setSearchSource] = useState<'internal' | 'external' | null>(null);
 
   const handleSearch = useCallback(async () => {
     const query = searchQuery.trim();
     if (!query) {
       setResults([]);
       setShowResults(false);
       return;
     }
 
     setIsSearching(true);
     setSearchSource(null);
     
     try {
       const { data: { session } } = await supabase.auth.getSession();
       if (!session) {
         toast.error("Please log in to search");
         return;
       }
 
       // 1. Search internal database first
       const { data: dbResults, error: dbError } = await supabase
         .from('shipment_records')
         .select('id, tracking_code, carrier, status, est_delivery_date, created_at, to_address_json')
         .or(`tracking_code.ilike.%${query}%,carrier.ilike.%${query}%,status.ilike.%${query}%`)
         .order('created_at', { ascending: false })
         .limit(10);
 
       if (dbError) {
         console.error('DB search error:', dbError);
       }
 
       const internalResults: ShipmentResult[] = (dbResults || []).map(r => ({
         id: r.id.toString(),
         tracking_code: r.tracking_code || 'N/A',
         carrier: r.carrier || 'Unknown',
         status: r.status || 'created',
         recipient: (r.to_address_json as any)?.name || 'Unknown',
         est_delivery_date: r.est_delivery_date,
         created_at: r.created_at
       }));
 
       if (internalResults.length > 0) {
         setResults(internalResults);
         setShowResults(true);
         setSearchSource('internal');
         onResults?.(internalResults);
         return;
       }
 
       // 2. Try external API if looks like a tracking number
       if (query.length >= 10) {
         try {
           const { data: externalData, error: externalError } = await supabase.functions.invoke('track-shipment', {
             body: { tracking_number: query }
           });
 
           if (!externalError && externalData) {
             const externalResult: ShipmentResult = {
               id: externalData.id,
               tracking_code: externalData.tracking_code,
               carrier: externalData.carrier,
               status: externalData.status,
               recipient: externalData.recipient,
               est_delivery_date: externalData.eta
             };
             setResults([externalResult]);
             setShowResults(true);
             setSearchSource('external');
             onResults?.([externalResult]);
             toast.success("Found tracking info from carrier API");
             return;
           }
         } catch (e) {
           console.log('External API search failed:', e);
         }
       }
 
       setResults([]);
       setShowResults(true);
       toast.info("No shipments found matching your search");
     } catch (error) {
       console.error('Search error:', error);
       toast.error("Search failed. Please try again.");
     } finally {
       setIsSearching(false);
     }
   }, [searchQuery, onResults]);
 
   const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === 'Enter') {
       handleSearch();
     }
   };
 
   const handleSelectResult = (result: ShipmentResult) => {
     onSelect?.(result);
     setShowResults(false);
     setSearchQuery(result.tracking_code);
   };
 
   if (compact) {
     return (
       <div className="relative">
         <div className="flex items-center gap-2">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder={placeholder}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyPress={handleKeyPress}
               className="pl-9 h-10"
             />
           </div>
           <Button 
             onClick={handleSearch}
             disabled={isSearching}
             size="sm"
             className="h-10"
           >
             {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
           </Button>
         </div>
         
         {showResults && results.length > 0 && (
           <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
             <div className="p-2 border-b bg-muted/50 flex items-center gap-2 text-xs text-muted-foreground">
               {searchSource === 'internal' ? (
                 <><Database className="h-3 w-3" /> From your shipments</>
               ) : (
                 <><Globe className="h-3 w-3" /> From carrier API</>
               )}
             </div>
             {results.map((result) => (
               <button
                 key={result.id}
                 onClick={() => handleSelectResult(result)}
                 className="w-full p-3 text-left hover:bg-muted border-b last:border-b-0 transition-colors"
               >
                 <div className="flex items-center justify-between">
                   <span className="font-mono text-sm font-medium">{result.tracking_code}</span>
                   <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">{result.status}</span>
                 </div>
                 <div className="text-xs text-muted-foreground mt-1">
                   {result.carrier} • {result.recipient}
                 </div>
               </button>
             ))}
           </div>
         )}
       </div>
     );
   }
 
   return (
     <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-background">
       <CardContent className="p-4">
         <div className="flex items-center gap-3">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input
               placeholder={placeholder}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyPress={handleKeyPress}
               className="pl-10 h-12 text-base"
             />
           </div>
           <Button 
             onClick={handleSearch}
             disabled={isSearching}
             className="h-12 px-6"
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
         </div>
         <p className="text-xs text-muted-foreground mt-2">
           Searches your saved shipments. Enter a new tracking number to fetch from carrier API.
         </p>
         
         {showResults && results.length > 0 && (
           <div className="mt-4 border rounded-lg overflow-hidden">
             <div className="p-2 bg-muted/50 flex items-center gap-2 text-xs text-muted-foreground border-b">
               {searchSource === 'internal' ? (
                 <><Database className="h-3 w-3" /> Results from your shipments</>
               ) : (
                 <><Globe className="h-3 w-3" /> Results from carrier API</>
               )}
             </div>
             {results.map((result) => (
               <button
                 key={result.id}
                 onClick={() => handleSelectResult(result)}
                 className="w-full p-3 text-left hover:bg-muted border-b last:border-b-0 transition-colors"
               >
                 <div className="flex items-center justify-between">
                   <span className="font-mono font-medium">{result.tracking_code}</span>
                   <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{result.status}</span>
                 </div>
                 <div className="text-sm text-muted-foreground mt-1">
                   {result.carrier} • {result.recipient}
                 </div>
               </button>
             ))}
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default ShipmentSearchBar;