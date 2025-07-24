
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ShoppingCart, Truck, Loader2 } from 'lucide-react';
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
  }
];

const ShopifyBulkShipping: React.FC = () => {
  const [orders, setOrders] = useState<RRow[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [isImporting, setIsImporting] = useState(false);
  
  const { isProcessing, processBulkShipping } = useBulkShipping();
  const navigate = useNavigate();

  const handleImportShopifyData = async () => {
    setIsImporting(true);
    
    try {
      // Simulate API call to import Shopify data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrders(mockShopifyOrders);
      toast.success('Shopify data imported successfully');
    } catch (error) {
      toast.error('Failed to import Shopify data');
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

    try {
      console.log('Starting Shopify bulk shipping process...');
      const selectedOrdersData = Array.from(selectedOrders).map(index => orders[index]);
      
      // Call backend to transform Shopify data to EasyPost CSV format
      const result = await processBulkShipping(selectedOrdersData, selectedCarrier);
      
      console.log('Shopify bulk shipping result:', result);
      
      if (result.success) {
        // Store the CSV content in session storage for the bulk upload page
        sessionStorage.setItem('csvContent', result.csvContent);
        sessionStorage.setItem('csvFilename', `shopify-orders-${Date.now()}.csv`);
        
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
        
        toast.success(`${selectedOrders.size} orders processed successfully! Redirecting to rate fetching...`);
        
        // Navigate to the bulk upload page which will automatically start the rate fetching process
        navigate('/bulk-upload');
      } else {
        toast.error('Failed to process Shopify orders');
      }
      
    } catch (error) {
      console.error('Error shipping selected orders:', error);
      toast.error('Failed to process selected orders');
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
                  >
                    {selectedOrders.size === orders.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedOrders.size} of {orders.length} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
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
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Ship Selected
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyBulkShipping;
