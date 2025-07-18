
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ShoppingBag, Package, Globe, Store, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyOrder {
  order_id: string;
  customer_name: string;
  shipping_address: string;
  total_weight: number;
  line_items: string;
  created_at: string;
  shopify_order_id: string;
}

const ImportPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [shopName, setShopName] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showShopInput, setShowShopInput] = useState(false);

  useEffect(() => {
    checkShopifyConnection();
    
    // Check for connection success from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      toast.success('Successfully connected to Shopify!');
      // Clean up URL
      window.history.pushState({}, document.title, window.location.pathname);
      // Refresh connection status
      setTimeout(() => {
        checkShopifyConnection();
      }, 1000);
    }
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

  const handleConnectClick = () => {
    if (!isConnected) {
      setShowShopInput(true);
    }
  };

  const connectShopify = async () => {
    if (!shopUrl.trim()) {
      toast.error('Please enter your shop URL');
      return;
    }

    setIsConnecting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to connect Shopify');
        return;
      }

      console.log('Initiating Shopify OAuth for shop:', shopUrl);

      const response = await supabase.functions.invoke('shopify-oauth', {
        body: { action: 'initiate', shop: shopUrl.trim() }
      });

      console.log('OAuth initiate response:', response);

      if (response.error) {
        console.error('OAuth initiate error:', response.error);
        throw new Error(response.error.message || 'Failed to initiate OAuth');
      }

      const { authUrl } = response.data;
      
      if (!authUrl) {
        throw new Error('No auth URL received');
      }

      console.log('Redirecting to:', authUrl);
      
      // Redirect to Shopify OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      toast.error(`Failed to connect to Shopify: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchShopifyOrders = async () => {
    setIsLoadingOrders(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const response = await supabase.functions.invoke('shopify-orders');

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch orders');
      }

      const { orders } = response.data;
      setOrders(orders);
      toast.success(`Fetched ${orders.length} unfulfilled orders`);
      
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

  const disconnectShopify = async () => {
    try {
      await supabase
        .from('user_profiles')
        .update({
          shopify_store_url: null,
          shopify_access_token: null
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      setIsConnected(false);
      setShopName('');
      setOrders([]);
      setSelectedOrders([]);
      setShowShopInput(false);
      setShopUrl('');
      toast.success('Disconnected from Shopify');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
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
              <div className="space-y-3">
                {!showShopInput ? (
                  <Button onClick={handleConnectClick} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect Store
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="shop-url">Shop URL</Label>
                      <Input
                        id="shop-url"
                        placeholder="mystore.myshopify.com"
                        value={shopUrl}
                        onChange={(e) => setShopUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your shop's .myshopify.com URL
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={connectShopify} 
                        disabled={isConnecting}
                        className="flex-1"
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
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowShopInput(false);
                          setShopUrl('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" onClick={fetchShopifyOrders} className="w-full">
                  Refresh Orders
                </Button>
                <Button variant="outline" onClick={disconnectShopify} className="w-full text-red-600 hover:text-red-700">
                  Disconnect
                </Button>
              </div>
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
