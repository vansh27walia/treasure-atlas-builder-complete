
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ShoppingCart, Truck, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
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
  
  const navigate = useNavigate();

  const handleImportShopifyData = async () => {
    setIsImporting(true);
    
    try {
      console.log('Attempting to fetch Shopify orders...');
      
      // Try to fetch real Shopify orders first
      const { data: shopifyData, error } = await supabase.functions.invoke('shopify-orders');
      
      if (shopifyData && shopifyData.orders && shopifyData.orders.length > 0) {
        // Convert Shopify orders to our format
        const convertedOrders = shopifyData.orders.map((order: any) => ({
          recipient_name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
          recipient_address1: order.shipping_address?.address1 || '',
          recipient_city: order.shipping_address?.city || '',
          recipient_state: order.shipping_address?.province_code || '',
          recipient_zip: order.shipping_address?.zip || '',
          recipient_country: order.shipping_address?.country_code || 'US',
          recipient_phone: order.shipping_address?.phone || '',
          recipient_email: order.email || '',
          parcel_weight: parseFloat(order.total_weight) || 5.0,
          parcel_length: 12,
          parcel_width: 8,
          parcel_height: 6,
          order_reference: order.order_number || order.name || `ORDER-${Date.now()}`
        }));
        
        console.log('Successfully converted Shopify orders:', convertedOrders);
        setOrders(convertedOrders);
        toast.success(`Imported ${convertedOrders.length} Shopify orders successfully`);
      } else {
        console.log('No Shopify orders found or error occurred, using demo data');
        if (error) {
          console.error('Shopify API error:', error);
          toast.error('Could not connect to Shopify. Using demo data instead.');
        } else {
          toast.info('No Shopify orders found. Using demo data for testing.');
        }
        setOrders(mockShopifyOrders);
      }
    } catch (error) {
      console.error('Error importing Shopify data:', error);
      toast.error('Shopify connection failed. Using demo data instead.');
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

  const convertToEasyPostCSV = (orders: RRow[]) => {
    const headers = [
      'to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country',
      'weight', 'length', 'width', 'height', 'to_company', 'to_street2',
      'to_phone', 'to_email', 'reference'
    ];
    
    const csvRows = [headers.join(',')];
    
    orders.forEach(order => {
      const csvRow = [
        `"${order.recipient_name || ''}"`,
        `"${order.recipient_address1 || ''}"`,
        `"${order.recipient_city || ''}"`,
        `"${order.recipient_state || ''}"`,
        `"${order.recipient_zip || ''}"`,
        `"${order.recipient_country || 'US'}"`,
        `"${order.parcel_weight || 5.0}"`,
        `"${order.parcel_length || 12}"`,
        `"${order.parcel_width || 8}"`,
        `"${order.parcel_height || 6}"`,
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
      console.log('Starting Shopify to EasyPost conversion...');
      const selectedOrdersData = Array.from(selectedOrders).map(index => orders[index]);
      
      // Validate orders before processing
      const validOrders = selectedOrdersData.filter(order => 
        order.recipient_name && 
        order.recipient_address1 && 
        order.recipient_city && 
        order.recipient_state && 
        order.recipient_zip
      );

      if (validOrders.length !== selectedOrdersData.length) {
        const invalidCount = selectedOrdersData.length - validOrders.length;
        toast.error(`${invalidCount} orders have missing required address information and will be skipped.`);
      }

      if (validOrders.length === 0) {
        toast.error('No valid orders found. Please check the address information.');
        return;
      }

      // Show processing status
      const processingToastId = toast.loading(`Converting ${validOrders.length} Shopify orders to EasyPost format...`, {
        duration: 0
      });
      
      // Convert orders to EasyPost CSV format
      const csvContent = convertToEasyPostCSV(validOrders);
      
      console.log('Generated EasyPost CSV for Shopify orders:', csvContent.substring(0, 200) + '...');
      
      // Store the CSV content and metadata in session storage for bulk upload
      sessionStorage.setItem('csvContent', csvContent);
      sessionStorage.setItem('csvFilename', `shopify-orders-${Date.now()}.csv`);
      sessionStorage.setItem('isFromShopify', 'true');
      sessionStorage.setItem('shopifyOrderCount', validOrders.length.toString());
      
      // Set default from address for Shopify warehouse
      sessionStorage.setItem('fromAddress', JSON.stringify({
        name: "Shopify Store",
        company: "Your Store",
        street1: "123 Warehouse St",
        street2: "",
        city: "Los Angeles",
        state: "CA",
        zip: "90210",
        country: "US",
        phone: "555-123-4567"
      }));
      
      // Success notification
      toast.success(`Successfully converted ${validOrders.length} Shopify orders!`, {
        id: processingToastId,
        duration: 2000,
        icon: <CheckCircle className="h-4 w-4" />
      });
      
      // Add a brief delay to show success, then redirect
      setTimeout(() => {
        toast.success('Redirecting to batch label creation...', {
          duration: 1500
        });
        navigate('/bulk-upload');
      }, 1000);
      
    } catch (error) {
      console.error('Error processing Shopify orders:', error);
      toast.error('Failed to process Shopify orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopify Bulk Shipping Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No Shopify orders imported yet</p>
              <Button 
                onClick={handleImportShopifyData}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Import from Shopify
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
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Convert & Create Labels
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm border-b">
                  <div className="col-span-1">Select</div>
                  <div className="col-span-2">Order Ref</div>
                  <div className="col-span-2">Recipient</div>
                  <div className="col-span-3">Address</div>
                  <div className="col-span-2">Dimensions</div>
                  <div className="col-span-1">Weight</div>
                  <div className="col-span-1">Phone</div>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {orders.map((order, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
                      <div className="col-span-1">
                        <Checkbox
                          checked={selectedOrders.has(index)}
                          onCheckedChange={(checked) => handleOrderSelection(index, checked as boolean)}
                          disabled={isProcessing}
                        />
                      </div>
                      <div className="col-span-2 font-medium">{order.order_reference}</div>
                      <div className="col-span-2">{order.recipient_name}</div>
                      <div className="col-span-3 text-sm text-gray-600">
                        {order.recipient_address1}<br />
                        {order.recipient_city}, {order.recipient_state} {order.recipient_zip}
                      </div>
                      <div className="col-span-2 text-sm">
                        {order.parcel_length}"×{order.parcel_width}"×{order.parcel_height}"
                      </div>
                      <div className="col-span-1 text-sm">{order.parcel_weight} lbs</div>
                      <div className="col-span-1 text-sm">{order.recipient_phone}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {isProcessing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Converting Shopify Orders</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Converting {selectedOrders.size} orders to EasyPost format for bulk label creation...
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">How it works:</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• Orders are converted to EasyPost CSV format</li>
                      <li>• Redirects automatically to bulk label creation</li>
                      <li>• Get rates from multiple carriers instantly</li>
                      <li>• Create labels in batches with one click</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyBulkShipping;
