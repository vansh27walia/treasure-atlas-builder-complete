
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ShoppingCart, Truck, Loader2, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkShipping, RRow } from '@/hooks/useBulkShipping';
import { useNavigate } from 'react-router-dom';

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
  },
  {
    recipient_name: "Bob Johnson",
    recipient_address1: "789 Pine St",
    recipient_city: "Chicago",
    recipient_state: "IL",
    recipient_zip: "60601",
    recipient_country: "US",
    recipient_phone: "555-456-7890",
    recipient_email: "bob@example.com",
    parcel_weight: 7.2,
    parcel_length: 14,
    parcel_width: 10,
    parcel_height: 8,
    order_reference: "ORD-003"
  }
];

const ShopifyBulkShipping: React.FC = () => {
  const [orders, setOrders] = useState<RRow[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  
  const { isProcessing, processBulkShipping } = useBulkShipping();
  const navigate = useNavigate();

  const handleImportShopifyData = async () => {
    setIsImporting(true);
    setProcessingStep('Importing Shopify data...');
    
    try {
      // Simulate API call to import Shopify data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockShopifyOrders);
      setSelectedOrders(new Set(mockShopifyOrders.map((_, index) => index))); // Auto-select all
      toast.success('Shopify data imported successfully');
    } catch (error) {
      toast.error('Failed to import Shopify data');
    } finally {
      setIsImporting(false);
      setProcessingStep('');
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

  const handleShipNow = async () => {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order to ship');
      return;
    }

    setProcessingStep('Preparing EasyPost headers...');
    
    try {
      const selectedOrdersData = Array.from(selectedOrders).map(index => orders[index]);
      
      // Show progress toast
      const progressToast = toast.loading('Processing Shopify orders for batch shipping...', {
        duration: 0
      });
      
      // Step 1: Generate EasyPost headers automatically
      setProcessingStep('Generating EasyPost CSV headers...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Convert to EasyPost format and fetch rates
      setProcessingStep('Converting to EasyPost format and fetching rates...');
      console.log('Starting batch shipping process for', selectedOrdersData.length, 'orders');
      
      const result = await processBulkShipping(selectedOrdersData, selectedCarrier);
      
      if (result.success && result.csvContent) {
        // Step 3: Prepare for batch label creation
        setProcessingStep('Preparing batch label creation...');
        
        // Store the CSV content and metadata for batch processing
        sessionStorage.setItem('csvContent', result.csvContent);
        sessionStorage.setItem('csvFilename', `shopify-batch-${Date.now()}.csv`);
        sessionStorage.setItem('isFromShopify', 'true');
        sessionStorage.setItem('shopifyOrderCount', selectedOrders.size.toString());
        sessionStorage.setItem('shopifyProcessingMode', 'batch');
        
        // Set default from address for Shopify warehouse
        sessionStorage.setItem('fromAddress', JSON.stringify({
          name: "Shopify Warehouse",
          company: "Your Company",
          street1: "123 Warehouse St",
          street2: "",
          city: "Los Angeles",
          state: "CA",
          zip: "90210",
          country: "US",
          phone: "555-123-4567"
        }));
        
        toast.success(`${selectedOrders.size} orders processed! Redirecting to batch label creation...`, {
          id: progressToast,
          duration: 2000,
          icon: <CheckCircle className="h-4 w-4" />
        });
        
        // Step 4: Navigate to bulk upload for automatic rate fetching and label creation
        setTimeout(() => {
          navigate('/bulk-upload?mode=batch&auto=true');
        }, 1500);
        
      } else {
        throw new Error(result.message || 'Failed to process orders');
      }
      
    } catch (error) {
      console.error('Error in Ship Now process:', error);
      toast.error('Failed to process orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessingStep('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopify Bulk Shipping
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
                    Import Shopify Data
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
                    <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleShipNow}
                    disabled={selectedOrders.size === 0 || isProcessing}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Ship Now
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium text-sm">
                  <div className="col-span-1">Select</div>
                  <div className="col-span-2">Order Ref</div>
                  <div className="col-span-2">Recipient</div>
                  <div className="col-span-3">Address</div>
                  <div className="col-span-2">Dimensions</div>
                  <div className="col-span-1">Weight</div>
                  <div className="col-span-1">Phone</div>
                </div>
                
                {orders.map((order, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 p-4 border-t hover:bg-gray-50">
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
              
              {processingStep && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-medium">Processing Shopify Orders</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">{processingStep}</p>
                  <div className="mt-2 text-xs text-blue-600">
                    This will automatically generate EasyPost headers, fetch rates, and prepare for batch label creation.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Batch Label Creation Process</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatically generates EasyPost CSV headers</li>
                <li>• Fetches rates from multiple carriers simultaneously</li>
                <li>• Creates labels in batch for efficient processing</li>
                <li>• Maintains existing batch and bulk structure</li>
                <li>• Auto-redirects to batch label tracking page</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyBulkShipping;
