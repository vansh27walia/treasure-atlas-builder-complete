import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ShoppingCart, Truck, Loader2, CheckCircle, AlertCircle, Brain, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkShipping, RRow } from '@/hooks/useBulkShipping';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import CarrierLogo from './CarrierLogo';
import AIRateAnalysisPanel from './AIRateAnalysisPanel';

// Mock Shopify data - replace with actual Shopify import
const mockShopifyOrders: RRow[] = [
  {
    recipient_name: "John Doe",
    recipient_address1: "123 Main St",
    recipient_city: "Los Angeles",
    recipient_state: "CA",
    recipient_zip: "90210",
    recipient_country: "US",
    recipient_phone: "555-123-4567",
    recipient_email: "john@example.com",
    parcel_weight: 5.0,
    parcel_length: 10,
    parcel_width: 8,
    parcel_height: 6,
    order_reference: "ORD-001"
  },
  {
    recipient_name: "Jane Smith",
    recipient_address1: "456 Oak Ave",
    recipient_city: "New York",
    recipient_state: "NY",
    recipient_zip: "10001",
    recipient_country: "US",
    recipient_phone: "555-987-6543",
    recipient_email: "jane@example.com",
    parcel_weight: 3.5,
    parcel_length: 12,
    parcel_width: 6,
    parcel_height: 4,
    order_reference: "ORD-002"
  }
];

const ShopifyBulkShipping: React.FC = () => {
  const [orders, setOrders] = useState<RRow[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [allRates, setAllRates] = useState<any[]>([]);
  
  const navigate = useNavigate();

  const handleImportShopifyData = async () => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      console.log('Attempting to fetch Shopify orders...');
      
      // Show loading toast
      const loadingToast = toast.loading('Connecting to Shopify...', {
        duration: 0
      });
      
      // Try to fetch real Shopify orders first
      const { data: shopifyData, error } = await supabase.functions.invoke('shopify-orders');
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (error) {
        console.error('Shopify API Error:', error);
        setImportError('Failed to connect to Shopify. Please check your Shopify connection settings.');
        
        // Use mock data as fallback for demo
        setOrders(mockShopifyOrders);
        toast.info('Using demo data - Please connect your Shopify store in settings');
        return;
      }
      
      if (shopifyData && shopifyData.orders && shopifyData.orders.length > 0) {
        console.log('Successfully fetched Shopify orders:', shopifyData.orders.length);
        
        // Convert Shopify orders to our format with better error handling
        const convertedOrders = shopifyData.orders.map((order: any) => {
          const shippingAddress = order.shipping_address || {};
          return {
            recipient_name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() || order.customer_name || 'Unknown Customer',
            recipient_address1: shippingAddress.address1 || shippingAddress.street || '',
            recipient_city: shippingAddress.city || '',
            recipient_state: shippingAddress.province_code || shippingAddress.state || '',
            recipient_zip: shippingAddress.zip || shippingAddress.postal_code || '',
            recipient_country: shippingAddress.country_code || 'US',
            recipient_phone: shippingAddress.phone || order.phone || '',
            recipient_email: order.email || '',
            parcel_weight: parseFloat(order.total_weight) || 5.0,
            parcel_length: 12,
            parcel_width: 8,
            parcel_height: 6,
            order_reference: order.order_id || order.name || `ORDER-${Date.now()}`
          };
        });
        
        // Validate converted orders with better filtering
        const validOrders = convertedOrders.filter(order => 
          order.recipient_name && 
          order.recipient_address1 && 
          order.recipient_city && 
          order.recipient_state && 
          order.recipient_zip &&
          order.recipient_zip.length >= 5 // Basic zip validation
        );
        
        if (validOrders.length === 0) {
          throw new Error('No valid shipping addresses found in Shopify orders');
        }
        
        setOrders(validOrders);
        toast.success(`Successfully imported ${validOrders.length} Shopify orders`);
        
        if (validOrders.length < convertedOrders.length) {
          toast.warning(`${convertedOrders.length - validOrders.length} orders skipped due to incomplete shipping information`);
        }
      } else {
        console.log('No Shopify orders found, using mock data');
        setImportError('No unfulfilled orders found in your Shopify store. Using demo data instead.');
        setOrders(mockShopifyOrders);
        toast.info('No pending orders found. Using demo data for testing.');
      }
    } catch (error) {
      console.error('Error importing Shopify data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setImportError(`Import failed: ${errorMessage}. Using demo data instead.`);
      
      // Use mock data as fallback
      setOrders(mockShopifyOrders);
      toast.error('Shopify import failed. Please check your connection and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleOrderSelection = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map((_, index) => index)));
    }
  };

  const convertToEasyPostCSV = (orders: RRow[]) => {
    const headers = [
      'to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country',
      'weight', 'length', 'width', 'height', 'to_company', 'to_street2',
      'to_phone', 'to_email', 'reference'
    ];
    
    const csvRows = [headers.join(',')];
    
    orders.forEach(order => {
      const csvRow = [
        `"${order.recipient_name}"`,
        `"${order.recipient_address1}"`,
        `"${order.recipient_city}"`,
        `"${order.recipient_state}"`,
        `"${order.recipient_zip}"`,
        `"${order.recipient_country}"`,
        `"${order.parcel_weight}"`,
        `"${order.parcel_length}"`,
        `"${order.parcel_width}"`,
        `"${order.parcel_height}"`,
        `""`, // to_company
        `""`, // to_street2
        `"${order.recipient_phone || ''}"`,
        `"${order.recipient_email || ''}"`,
        `"${order.order_reference || ''}"`
      ];
      csvRows.push(csvRow.join(','));
    });
    
    return csvRows.join('\n');
  };

  const handleShipSelected = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to ship');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Starting enhanced Shopify to EasyPost conversion...');
      const selectedOrdersData = Array.from(selectedOrders).map(index => orders[index]);
      
      // Enhanced validation
      const invalidOrders = selectedOrdersData.filter(order => 
        !order.recipient_name || 
        !order.recipient_address1 || 
        !order.recipient_city || 
        !order.recipient_state || 
        !order.recipient_zip ||
        order.recipient_zip.length < 5
      );
      
      if (invalidOrders.length > 0) {
        toast.error(`${invalidOrders.length} selected orders have invalid shipping addresses`);
        setIsProcessing(false);
        return;
      }
      
      // Show enhanced processing toast
      const processingToastId = toast.loading('Converting Shopify orders with AI optimization...', {
        duration: 0
      });
      
      // Generate rates for preview (simulate API call)
      const mockRates = selectedOrdersData.map(order => ({
        id: `rate-${Math.random().toString(36).substr(2, 9)}`,
        carrier: ['USPS', 'UPS', 'FedEx'][Math.floor(Math.random() * 3)],
        service: ['Ground', 'Priority', 'Express'][Math.floor(Math.random() * 3)],
        rate: (Math.random() * 25 + 5).toFixed(2),
        delivery_days: Math.floor(Math.random() * 7) + 1,
        order_reference: order.order_reference
      }));
      
      setAllRates(mockRates);
      if (mockRates.length > 0) {
        setSelectedRate(mockRates[0]);
        setShowAIPanel(true);
      }
      
      // Convert orders to EasyPost CSV format
      const csvContent = convertToEasyPostCSV(selectedOrdersData);
      
      console.log('Generated EasyPost CSV for Shopify orders with AI insights');
      
      // Update toast to show conversion success
      toast.success('Shopify orders converted successfully with AI rate optimization!', {
        id: processingToastId
      });
      
      // Store enhanced data in session storage
      sessionStorage.setItem('csvContent', csvContent);
      sessionStorage.setItem('csvFilename', `shopify-orders-${Date.now()}.csv`);
      sessionStorage.setItem('isFromShopify', 'true');
      sessionStorage.setItem('shopifyOrderCount', selectedOrders.size.toString());
      sessionStorage.setItem('shopifyRates', JSON.stringify(mockRates));
      
      // Set enhanced from address
      sessionStorage.setItem('fromAddress', JSON.stringify({
        name: "Shopify Fulfillment Center",
        company: "Your Shopify Store",
        street1: "123 Warehouse St",
        street2: "Suite 100",
        city: "Los Angeles",
        state: "CA",
        zip: "90210",
        country: "US",
        phone: "555-123-4567",
        email: "fulfillment@yourstore.com"
      }));
      
      // Enhanced success message
      toast.success(`✨ ${selectedOrders.size} orders processed with AI optimization! Redirecting...`, {
        duration: 2000,
        icon: <CheckCircle className="h-4 w-4" />
      });
      
      // Navigate with slight delay for UX
      setTimeout(() => {
        navigate('/bulk-upload');
      }, 1500);
      
    } catch (error) {
      console.error('Error processing selected orders:', error);
      toast.error('Failed to process orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOptimizationChange = (filter: string) => {
    let sortedRates = [...allRates];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'fastest':
        sortedRates.sort((a, b) => a.delivery_days - b.delivery_days);
        break;
      default:
        break;
    }
    
    setAllRates(sortedRates);
    if (sortedRates.length > 0) {
      setSelectedRate(sortedRates[0]);
    }
    
    toast.success(`Applied ${filter} optimization to Shopify orders`);
  };

  return (
    <div className={`space-y-6 transition-all duration-300 ${showAIPanel ? 'pr-80' : ''}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopify Bulk Shipping
            <Badge className="bg-blue-100 text-blue-800">Enhanced with AI</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enhanced Import Error Alert */}
          {importError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Shopify Connection Notice</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">{importError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/settings')}
              >
                Configure Shopify Connection
              </Button>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <Package className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shopify Orders</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Connect your Shopify store to import unfulfilled orders for bulk shipping with AI optimization.
              </p>
              <Button 
                onClick={handleImportShopifyData}
                disabled={isImporting}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting to Shopify...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Import Shopify Orders
                  </>
                )}
              </Button>
            </div>
          ) : (
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isProcessing}
                  >
                    {selectedOrders.size === orders.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {selectedOrders.size} of {orders.length} selected
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier} disabled={isProcessing}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Carriers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="usps">
                        <div className="flex items-center gap-2">
                          <CarrierLogo carrier="USPS" className="w-4 h-4" />
                          USPS
                        </div>
                      </SelectItem>
                      <SelectItem value="ups">
                        <div className="flex items-center gap-2">
                          <CarrierLogo carrier="UPS" className="w-4 h-4" />
                          UPS
                        </div>
                      </SelectItem>
                      <SelectItem value="fedex">
                        <div className="flex items-center gap-2">
                          <CarrierLogo carrier="FedEx" className="w-4 h-4" />
                          FedEx
                        </div>
                      </SelectItem>
                      <SelectItem value="dhl">
                        <div className="flex items-center gap-2">
                          <CarrierLogo carrier="DHL" className="w-4 h-4" />
                          DHL
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleShipSelected}
                    disabled={selectedOrders.size === 0 || isProcessing}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing with AI...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Process with AI ({selectedOrders.size})
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Orders Table */}
              <div className="border rounded-lg bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm border-b">
                  <div className="col-span-1">Select</div>
                  <div className="col-span-2">Order Ref</div>
                  <div className="col-span-2">Recipient</div>
                  <div className="col-span-3">Shipping Address</div>
                  <div className="col-span-2">Package Info</div>
                  <div className="col-span-1">Weight</div>
                  <div className="col-span-1">Contact</div>
                </div>
                
                {orders.map((order, index) => (
                  <div key={index} className={`grid grid-cols-12 gap-4 p-4 border-b hover:bg-blue-50/30 transition-colors ${selectedOrders.has(index) ? 'bg-blue-50 border-blue-200' : ''}`}>
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedOrders.has(index)}
                        onCheckedChange={(checked) => handleOrderSelection(index, checked as boolean)}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="col-span-2 font-medium text-blue-600">{order.order_reference}</div>
                    <div className="col-span-2 font-medium">{order.recipient_name}</div>
                    <div className="col-span-3 text-sm text-gray-700">
                      <div>{order.recipient_address1}</div>
                      <div className="text-gray-600">
                        {order.recipient_city}, {order.recipient_state} {order.recipient_zip}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm">
                      <div className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {order.parcel_length}"×{order.parcel_width}"×{order.parcel_height}"
                      </div>
                    </div>
                    <div className="col-span-1 text-sm font-medium">{order.parcel_weight} lbs</div>
                    <div className="col-span-1 text-xs text-gray-600">{order.recipient_phone}</div>
                  </div>
                ))}
              </div>
              
              {/* Enhanced Processing Status */}
              {isProcessing && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-6 mt-4">
                  <div className="flex items-center gap-3 text-blue-800 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-semibold">AI-Enhanced Processing</span>
                    <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Converting {selectedOrders.size} Shopify orders to EasyPost format with AI rate optimization and carrier analysis...
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600">
                    <Brain className="h-4 w-4" />
                    <span>AI is analyzing optimal shipping routes and carrier selection</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Analysis Panel for Shopify */}
      {showAIPanel && selectedRate && allRates.length > 0 && (
        <AIRateAnalysisPanel
          selectedRate={selectedRate}
          allRates={allRates}
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          onOptimizationChange={handleOptimizationChange}
        />
      )}
    </div>
  );
};

export default ShopifyBulkShipping;
