import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ShoppingCart, Truck, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkShipping, RRow } from '@/hooks/useBulkShipping';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
  
  const { processBulkShipping } = useBulkShipping();
  const navigate = useNavigate();

  const handleImportShopifyData = async () => {
    setIsImporting(true);
    
    try {
      console.log('Importing Shopify data...');
      
      // Call the Shopify orders function to get real data
      const { data, error } = await supabase.functions.invoke('shopify-orders');
      
      if (error) {
        console.error('Error fetching Shopify orders:', error);
        toast.error('Failed to fetch Shopify orders');
        return;
      }
      
      console.log('Shopify orders data:', data);
      
      if (data && data.orders && data.orders.length > 0) {
        // Convert Shopify orders to our format
        const convertedOrders: RRow[] = data.orders.map((order: any) => ({
          recipient_name: order.customer_name || order.shipping_address?.first_name + ' ' + order.shipping_address?.last_name,
          recipient_address1: order.shipping_address?.address1 || '',
          recipient_city: order.shipping_address?.city || '',
          recipient_state: order.shipping_address?.province_code || '',
          recipient_zip: order.shipping_address?.zip || '',
          recipient_country: order.shipping_address?.country_code || 'US',
          recipient_phone: order.shipping_address?.phone || order.customer_phone || '',
          recipient_email: order.customer_email || '',
          parcel_weight: order.total_weight || 1.0,
          parcel_length: 12, // Default dimensions
          parcel_width: 8,
          parcel_height: 4,
          order_reference: order.order_number || order.name
        }));
        
        setOrders(convertedOrders);
        toast.success(`Successfully imported ${convertedOrders.length} Shopify orders`);
      } else {
        // Fallback to mock data if no real orders
        setOrders(mockShopifyOrders);
        toast.success('Shopify demo data imported successfully');
      }
    } catch (error) {
      console.error('Error importing Shopify data:', error);
      toast.error('Failed to import Shopify data');
      // Fallback to mock data
      setOrders(mockShopifyOrders);
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

  const handleShipSelected = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to ship');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Starting enhanced Shopify bulk shipping process...');
      const selectedOrdersData = Array.from(selectedOrders).map(index => orders[index]);
      
      // Show processing toast
      const processingToastId = toast.loading('Converting Shopify orders to EasyPost format and fetching live rates...', {
        duration: 0
      });
      
      // Convert to EasyPost CSV format
      const csvHeaders = [
        'to_name', 'to_company', 'to_street1', 'to_street2', 'to_city', 
        'to_state', 'to_zip', 'to_country', 'to_phone', 'to_email',
        'weight', 'length', 'width', 'height', 'reference'
      ];
      
      const csvRows = selectedOrdersData.map(order => [
        order.recipient_name,
        '', // to_company
        order.recipient_address1,
        '', // to_street2
        order.recipient_city,
        order.recipient_state,
        order.recipient_zip,
        order.recipient_country,
        order.recipient_phone || '',
        order.recipient_email || '',
        order.parcel_weight.toString(),
        order.parcel_length.toString(),
        order.parcel_width.toString(),
        order.parcel_height.toString(),
        order.order_reference || ''
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      console.log('Generated EasyPost CSV:', csvContent);
      
      // Update toast
      toast.success('Successfully converted Shopify orders to EasyPost format!', {
        id: processingToastId
      });
      
      // Store the converted data for bulk upload
      sessionStorage.setItem('csvContent', csvContent);
      sessionStorage.setItem('csvFilename', `shopify-orders-${Date.now()}.csv`);
      sessionStorage.setItem('isFromShopify', 'true');
      sessionStorage.setItem('shopifyOrderCount', selectedOrders.size.toString());
      
      // Set default from address for Shopify
      sessionStorage.setItem('fromAddress', JSON.stringify({
        name: "Shopify Store",
        company: "Your Company",
        street1: "123 Warehouse St",
        street2: "",
        city: "Los Angeles",
        state: "CA",
        zip: "90210",
        country: "US",
        phone: "555-123-4567"
      }));
      
      // Success message
      toast.success(`${selectedOrders.size} Shopify orders converted! Redirecting to bulk processing...`, {
        duration: 2000
      });
      
      // Navigate to bulk upload page for automatic processing
      setTimeout(() => {
        navigate('/bulk-upload');
      }, 1500);
      
    } catch (error) {
      console.error('Error processing Shopify orders:', error);
      toast.error('Failed to process Shopify orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-gray-200">
        <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopify Bulk Shipping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Import your Shopify orders to get started</p>
              <Button 
                onClick={handleImportShopifyData}
                disabled={isImporting}
                className="flex items-center gap-2 border-2 border-blue-600"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing Orders...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
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
                  <span className="text-sm text-gray-600">
                    {selectedOrders.size} of {orders.length} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier} disabled={isProcessing}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleShipSelected}
                    disabled={selectedOrders.size === 0 || isProcessing}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Create Bulk Labels
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Enhanced Orders Table */}
              <div className="border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm border-b">
                  <div className="col-span-1">Select</div>
                  <div className="col-span-2">Order Ref</div>
                  <div className="col-span-2">Recipient</div>
                  <div className="col-span-3">Address</div>
                  <div className="col-span-2">Dimensions</div>
                  <div className="col-span-1">Weight</div>
                  <div className="col-span-1">Phone</div>
                </div>
                
                {orders.map((order, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50 transition-colors">
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedOrders.has(index)}
                        onCheckedChange={(checked) => handleOrderSelection(index, checked as boolean)}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="col-span-2 font-medium text-blue-600">{order.order_reference}</div>
                    <div className="col-span-2 font-medium">{order.recipient_name}</div>
                    <div className="col-span-3 text-sm text-gray-600">
                      {order.recipient_address1}<br />
                      {order.recipient_city}, {order.recipient_state} {order.recipient_zip}
                    </div>
                    <div className="col-span-2 text-sm">
                      {order.parcel_length}"×{order.parcel_width}"×{order.parcel_height}"
                    </div>
                    <div className="col-span-1 text-sm font-medium">{order.parcel_weight} lbs</div>
                    <div className="col-span-1 text-sm">{order.recipient_phone}</div>
                  </div>
                ))}
              </div>
              
              {/* Processing Status */}
              {isProcessing && (
                <Card className="bg-blue-50 border-2 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 text-blue-800">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <div>
                        <div className="font-medium">Processing Shopify Orders</div>
                        <div className="text-sm text-blue-700">
                          Converting {selectedOrders.size} orders to EasyPost format and preparing for bulk label creation...
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyBulkShipping;
