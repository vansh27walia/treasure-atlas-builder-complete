import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ShoppingBag, Package, Globe, Store, AlertCircle, Loader2, ExternalLink, Lock } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShopifyOrder {
  order_id: string;
  customer_name: string;
  shipping_address: string;
  total_weight: number;
  line_items: string;
  created_at: string;
  shopify_order_id: string;
  shop?: string;
}

const ImportPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShops, setConnectedShops] = useState<string[]>([]);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [pendingShop, setPendingShop] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkShopifyConnections();
    }
    
    // Check for connection success/error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    const connectedShop = urlParams.get('shop');
    const pendingShopParam = urlParams.get('pending_shop');

    if (pendingShopParam) {
      // User came from direct Shopify install but needs to log in
      setPendingShop(pendingShopParam);
      if (!user) {
        toast.info('Please sign in to complete the Shopify connection');
      }
    }

    if (connected === 'true' && connectedShop) {
      toast.success(`Successfully connected to Shopify store: ${connectedShop}`);
      // Clean up URL
      window.history.pushState({}, document.title, window.location.pathname);
      // Refresh connection status
      setTimeout(() => {
        if (user) checkShopifyConnections();
      }, 1000);
    } else if (connected === 'pending') {
      toast.info('Shopify connection pending - please sign in to complete');
      window.history.pushState({}, document.title, window.location.pathname);
    } else if (error) {
      let errorMessage = 'Failed to connect to Shopify';
      switch (error) {
        case 'missing_parameters':
          errorMessage = 'Missing required parameters from Shopify';
          break;
        case 'invalid_state':
          errorMessage = 'Invalid OAuth state - please try again';
          break;
        case 'state_validation_failed':
          errorMessage = 'State validation failed - please try again';
          break;
        case 'server_configuration':
          errorMessage = 'Server configuration error - please contact support';
          break;
        case 'hmac_validation_failed':
          errorMessage = 'Security validation failed - please try again';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange authorization code';
          break;
        case 'connection_save_failed':
          errorMessage = 'Failed to save connection - please try again';
          break;
        default:
          errorMessage = `Connection failed: ${error}`;
      }
      toast.error(errorMessage);
      // Clean up URL
      window.history.pushState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const checkShopifyConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('shopify_connections')
        .select('shop')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        const shops = data.map(connection => connection.shop);
        setConnectedShops(shops);
        setIsConnected(true);
        fetchShopifyOrders();
      } else {
        setIsConnected(false);
        setConnectedShops([]);
      }
    } catch (error) {
      console.error('Error checking Shopify connections:', error);
    }
  };

  const handleConnectClick = () => {
    if (!user) {
      toast.error('Please sign in to connect your Shopify store');
      return;
    }
    // Direct redirect to Shopify OAuth - no shop URL input needed
    connectShopify();
  };

  const connectShopify = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    setIsConnecting(true);
    
    try {
      console.log('Initiating Shopify OAuth');

      // Get the current user's session to get the access token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User session not found. Please log in again.');
      }

      // For the new flow, we'll show a dialog asking for shop URL since we need it
      // to redirect to the correct Shopify store's OAuth screen
      const shopName = prompt('Enter your Shopify store name (e.g., mystore for mystore.myshopify.com):');
      
      if (!shopName || !shopName.trim()) {
        setIsConnecting(false);
        return;
      }

      const response = await fetch(`https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          action: 'initiate', 
          shop: shopName.trim() 
        })
      });

      console.log('OAuth initiate response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OAuth initiate error:', errorData);
        throw new Error(errorData.error || 'Failed to initiate OAuth');
      }

      const data = await response.json();
      const { authUrl } = data;
      
      if (!authUrl) {
        throw new Error('No auth URL received');
      }

      console.log('Redirecting to Shopify OAuth URL:', authUrl);
      
      // Redirect to Shopify OAuth
      window.location.href = authUrl;
      
    } catch (error: any) {
      console.error('Error connecting to Shopify:', error);
      toast.error(`Failed to connect to Shopify: ${error.message}`);
      setIsConnecting(false);
    }
  };

  const fetchShopifyOrders = async () => {
    if (!user) return;

    setIsLoadingOrders(true);
    
    try {
      const response = await supabase.functions.invoke('shopify-orders');

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch orders');
      }

      const { orders } = response.data;
      setOrders(orders || []);
      toast.success(`Fetched ${orders?.length || 0} unfulfilled orders`);
      
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
    if (!user) return;

    try {
      await supabase
        .from('shopify_connections')
        .delete()
        .eq('user_id', user.id);

      setIsConnected(false);
      setConnectedShops([]);
      setOrders([]);
      setSelectedOrders([]);
      setPendingShop(null);
      toast.success('Disconnected from all Shopify stores');
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error('Failed to disconnect');
    }
  };

  // Show authentication required state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to connect your Shopify store and import orders.</p>
          <Button onClick={() => window.location.href = '/auth'} className="w-full">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

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
                  {isConnected && connectedShops.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {connectedShops.length} store{connectedShops.length > 1 ? 's' : ''} connected
                    </p>
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
                <Button 
                  onClick={handleConnectClick} 
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect Store
                    </>
                  )}
                </Button>
                {pendingShop && (
                  <p className="text-xs text-amber-600">
                    Pending connection to {pendingShop} - click Connect to complete
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" onClick={fetchShopifyOrders} className="w-full">
                  Refresh Orders
                </Button>
                <Button variant="outline" onClick={disconnectShopify} className="w-full text-red-600 hover:text-red-700">
                  Disconnect All
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
                      {connectedShops.length > 1 && <TableHead>Store</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={`${order.shop || 'unknown'}-${order.order_id}`}>
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
                        {connectedShops.length > 1 && (
                          <TableCell className="text-sm text-gray-500">
                            {order.shop?.replace('.myshopify.com', '') || 'Unknown'}
                          </TableCell>
                        )}
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
