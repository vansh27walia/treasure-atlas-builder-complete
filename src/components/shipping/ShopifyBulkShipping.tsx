
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  RefreshCw, 
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Ship,
  ArrowRight
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  financial_status: string;
  fulfillment_status: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
  line_items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: string;
    sku?: string;
    weight?: number;
    grams?: number;
  }>;
}

const ShopifyBulkShipping: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShopifyOrders();
  }, []);

  const fetchShopifyOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-orders', {
        body: { action: 'fetch' }
      });

      if (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch Shopify orders');
        return;
      }

      if (data?.orders) {
        setOrders(data.orders);
        toast.success(`Fetched ${data.orders.length} orders from Shopify`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect to Shopify');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => 
      checked 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? filteredOrders.map(order => order.id) : []);
  };

  const handleShipNow = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders to ship');
      return;
    }

    setIsShipping(true);
    try {
      // Get selected order data
      const selectedOrderData = orders.filter(order => selectedOrders.includes(order.id));
      
      // Convert Shopify orders to EasyPost CSV format
      const csvData = convertToEasyPostCSV(selectedOrderData);
      
      // Store data in session storage for bulk upload page
      sessionStorage.setItem('csvContent', csvData);
      sessionStorage.setItem('csvFilename', `shopify-orders-${new Date().toISOString().split('T')[0]}.csv`);
      sessionStorage.setItem('isFromShopify', 'true');
      sessionStorage.setItem('shopifyOrderCount', selectedOrders.length.toString());
      
      // Navigate to bulk upload page
      navigate('/bulk-upload');
      
      toast.success(`Redirecting to batch label creation with ${selectedOrders.length} orders`);
    } catch (error) {
      console.error('Error processing orders:', error);
      toast.error('Failed to process orders for shipping');
    } finally {
      setIsShipping(false);
    }
  };

  const convertToEasyPostCSV = (orders: ShopifyOrder[]): string => {
    const headers = [
      'name',
      'company',
      'street1',
      'street2',
      'city',
      'state',
      'zip',
      'country',
      'phone',
      'parcel_weight',
      'parcel_length',
      'parcel_width',
      'parcel_height',
      'order_id',
      'total_value'
    ];
    
    const rows = orders.map(order => {
      const addr = order.shipping_address;
      const totalWeight = order.line_items.reduce((sum, item) => 
        sum + (item.grams ? item.grams / 453.592 : 1), 0
      );
      
      return [
        `${addr.first_name} ${addr.last_name}`,
        addr.company || '',
        addr.address1,
        addr.address2 || '',
        addr.city,
        addr.province,
        addr.zip,
        addr.country,
        addr.phone || '',
        Math.max(totalWeight, 1).toFixed(2),
        '12',
        '8',
        '4',
        order.name,
        order.total_price
      ];
    });
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         order.fulfillment_status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'unfulfilled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopify Orders
          </CardTitle>
          <div className="flex items-center justify-between">
            <Button 
              onClick={fetchShopifyOrders}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Orders
            </Button>
            
            {selectedOrders.length > 0 && (
              <Button 
                onClick={handleShipNow}
                disabled={isShipping}
                className="bg-green-600 hover:bg-green-700"
              >
                {isShipping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ship className="w-4 h-4 mr-2" />
                    Ship Now ({selectedOrders.length})
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <Input
                id="search"
                placeholder="Search by order name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Loading Shopify orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedOrders.length === filteredOrders.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All ({filteredOrders.length} orders)
                </Label>
              </div>

              {/* Order Cards */}
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`order-${order.id}`}
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => handleOrderSelection(order.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{order.name}</h3>
                            <Badge className={getStatusColor(order.fulfillment_status)}>
                              {order.fulfillment_status || 'unfulfilled'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Customer: {order.email}</p>
                              <p className="text-gray-600">Total: ${order.total_price}</p>
                              <p className="text-gray-600">Items: {order.line_items.length}</p>
                            </div>
                            
                            <div>
                              <p className="text-gray-600">Ship to:</p>
                              <p className="text-gray-800">
                                {order.shipping_address.first_name} {order.shipping_address.last_name}
                              </p>
                              <p className="text-gray-600">
                                {order.shipping_address.city}, {order.shipping_address.province}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Summary */}
      {selectedOrders.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">
                  {selectedOrders.length} orders selected for shipping
                </span>
              </div>
              <Button 
                onClick={handleShipNow}
                disabled={isShipping}
                className="bg-green-600 hover:bg-green-700"
              >
                {isShipping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Ship className="w-4 h-4 mr-2" />
                    Ship Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShopifyBulkShipping;
