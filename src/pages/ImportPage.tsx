import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ShoppingBag, Package, Globe, Store, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyOrder {
  order_id: string;
  customer_name: string;
  shipping_address: string;
  total_weight: number;
  line_items: string;
  created_at: string;
}

const ImportPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [shopName, setShopName] = useState('');
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    checkShopifyConnection();
  }, []);

  const checkShopifyConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('shopify_store_url, shopify_access_token')
        .single();

      if (data?.shopify_access_token && data?.shopify_store_url) {
        setIsConnected(true);
        setShopName(data.shopify_store_url.replace('.myshopify.com', ''));
        fetchShopifyOrders();
      }
    } catch (error) {
      console.error('Error checking Shopify connection:', error);
    }
  };

  const connectShopify = async () => {
    setIsConnecting(true);
    
    try {
      // For demo purposes, we'll simulate the OAuth flow
      // In production, this would redirect to Shopify OAuth
      const shopifyUrl = prompt('Enter your Shopify store URL (e.g., mystore.myshopify.com):');
      const accessToken = prompt('Enter your Shopify access token:');
      
      if (shopifyUrl && accessToken) {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            id: (await supabase.auth.getUser()).data.user?.id,
            shopify_store_url: shopifyUrl,
            shopify_access_token: accessToken
          });

        if (error) throw error;

        setIsConnected(true);
        setShopName(shopifyUrl.replace('.myshopify.com', ''));
        toast.success('Successfully connected to Shopify!');
        fetchShopifyOrders();
      }
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      toast.error('Failed to connect to Shopify');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchShopifyOrders = async () => {
    setIsLoadingOrders(true);
    
    try {
      // Mock data for demonstration
      // In production, this would call your backend API
      const mockOrders: ShopifyOrder[] = [
        {
          order_id: '#1001',
          customer_name: 'John Doe',
          shipping_address: '123 Main St, New York, NY 10001',
          total_weight: 2.5,
          line_items: '2x Product A, 1x Product B',
          created_at: '2025-01-15'
        },
        {
          order_id: '#1002',
          customer_name: 'Jane Smith',
          shipping_address: '456 Oak Ave, Los Angeles, CA 90210',
          total_weight: 1.8,
          line_items: '1x Product C, 3x Product D',
          created_at: '2025-01-16'
        },
        {
          order_id: '#1003',
          customer_name: 'Bob Johnson',
          shipping_address: '789 Pine St, Chicago, IL 60601',
          total_weight: 3.2,
          line_items: '1x Product E, 2x Product F',
          created_at: '2025-01-17'
        }
      ];

      setOrders(mockOrders);
      toast.success(`Fetched ${mockOrders.length} unfulfilled orders`);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(orders.map(order => order.order_id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const handleShipSelected = () => {
    if (selectedOrders.length > 0) {
      // Emit event for selected orders
      const event = new CustomEvent('importOrders', {
        detail: { provider: 'shopify', orderIds: selectedOrders }
      });
      document.dispatchEvent(event);
      toast.success(`Importing ${selectedOrders.length} selected orders`);
    }
  };

  const handleShipAll = () => {
    const allOrderIds = orders.map(order => order.order_id);
    const event = new CustomEvent('importOrders', {
      detail: { provider: 'shopify', orderIds: allOrderIds }
    });
    document.dispatchEvent(event);
    toast.success(`Importing all ${orders.length} orders`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Orders</h1>
          <p className="text-gray-600">Connect your e-commerce platforms to import orders for shipping</p>
        </div>

        {/* Integration Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Shopify */}
          <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Shopify</h3>
                  {isConnected && (
                    <p className="text-sm text-gray-500">{shopName}</p>
                  )}
                </div>
              </div>
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            
            {!isConnected ? (
              <Button 
                onClick={connectShopify} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            ) : (
              <Button variant="outline" onClick={fetchShopifyOrders} className="w-full">
                Refresh Orders
              </Button>
            )}
          </Card>

          {/* Other platforms (disabled) */}
          {[
            { name: 'Amazon', icon: Package },
            { name: 'eBay', icon: Globe },
            { name: 'Etsy', icon: Store }
          ].map((platform) => (
            <Card key={platform.name} className="p-6 opacity-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <platform.icon className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  Coming Soon
                </Badge>
              </div>
              <Button disabled className="w-full">
                Connect
              </Button>
            </Card>
          ))}
        </div>

        {/* Orders Table */}
        {isConnected && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Shopify Orders</h2>
              {isLoadingOrders && (
                <div className="flex items-center text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading orders...
                </div>
              )}
            </div>

            {orders.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === orders.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.order_id)}
                            onCheckedChange={(checked) => 
                              handleSelectOrder(order.order_id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.order_id}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{order.shipping_address}</TableCell>
                        <TableCell>{order.total_weight} lbs</TableCell>
                        <TableCell className="max-w-xs truncate">{order.line_items}</TableCell>
                        <TableCell>{order.created_at}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-500">
                    {selectedOrders.length} of {orders.length} orders selected
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleShipSelected}
                      disabled={selectedOrders.length === 0}
                    >
                      Ship Selected ({selectedOrders.length})
                    </Button>
                    <Button onClick={handleShipAll}>
                      Ship All ({orders.length})
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-500">No unfulfilled orders available for shipping</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
