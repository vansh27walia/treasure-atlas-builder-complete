import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ShoppingBag, Package, Globe, Store, AlertCircle, Loader2, ExternalLink, Lock, RefreshCw } from 'lucide-react';
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
  const [needsReconnect, setNeedsReconnect] = useState(false);

  useEffect(() => {
    if (user) {
      checkShopifyConnections();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    const connectedShop = urlParams.get('shop');

    if (connected === 'true' && connectedShop) {
      toast.success(`Connected to ${connectedShop.replace('.myshopify.com', '')}`);
      window.history.pushState({}, document.title, window.location.pathname);
      setTimeout(() => { if (user) checkShopifyConnections(); }, 500);
    } else if (error) {
      const messages: Record<string, string> = {
        missing_parameters: 'Missing parameters from Shopify',
        invalid_state: 'Invalid OAuth state — try again',
        state_validation_failed: 'State validation failed — try again',
        server_configuration: 'Server configuration error',
        hmac_validation_failed: 'Security validation failed — try again',
        token_exchange_failed: 'Failed to exchange auth code — try again',
        connection_save_failed: 'Failed to save connection — try again',
      };
      toast.error(messages[error] || `Connection failed: ${error}`);
      window.history.pushState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const checkShopifyConnections = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('shopify_connections')
        .select('shop')
        .eq('user_id', user.id);

      if (data && data.length > 0) {
        setConnectedShops(data.map(c => c.shop));
        setIsConnected(true);
        setNeedsReconnect(false);
        fetchShopifyOrders();
      } else {
        setIsConnected(false);
        setConnectedShops([]);
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const handleConnectClick = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Session expired. Please sign in again.');
        setIsConnecting(false);
        return;
      }
      window.location.href = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth?action=start&token=${encodeURIComponent(session.access_token)}`;
    } catch (error) {
      console.error('OAuth start error:', error);
      toast.error('Failed to start connection');
      setIsConnecting(false);
    }
  };

  const fetchShopifyOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const response = await supabase.functions.invoke('shopify-orders');
      if (response.error) throw new Error(response.error.message);

      const { orders: fetchedOrders, needs_reconnect, error: apiError } = response.data;

      if (needs_reconnect) {
        setNeedsReconnect(true);
        setIsConnected(false);
        setConnectedShops([]);
        toast.error('Shopify access expired. Please reconnect your store.');
        return;
      }

      if (apiError && (!fetchedOrders || fetchedOrders.length === 0)) {
        toast.error(apiError);
        return;
      }

      setOrders(fetchedOrders || []);
      if (fetchedOrders?.length > 0) {
        toast.success(`Loaded ${fetchedOrders.length} unfulfilled orders`);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const disconnectShopify = async () => {
    if (!user) return;
    try {
      // Delete connections
      await supabase.from('shopify_connections').delete().eq('user_id', user.id);
      // Clean up any lingering OAuth states
      await supabase.from('oauth_states').delete().eq('user_id', user.id).eq('platform', 'shopify');

      setIsConnected(false);
      setConnectedShops([]);
      setOrders([]);
      setSelectedOrders([]);
      setNeedsReconnect(false);
      toast.success('Disconnected. Authentication has been fully reset.');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? orders.map(o => o.order_id) : []);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => checked ? [...prev, orderId] : prev.filter(id => id !== orderId));
  };

  const handleShipSelected = () => {
    if (selectedOrders.length > 0) {
      document.dispatchEvent(new CustomEvent('importOrders', { detail: { provider: 'shopify', orderIds: selectedOrders } }));
      toast.success(`Importing ${selectedOrders.length} orders`);
    }
  };

  const handleShipAll = () => {
    const allIds = orders.map(o => o.order_id);
    document.dispatchEvent(new CustomEvent('importOrders', { detail: { provider: 'shopify', orderIds: allIds } }));
    toast.success(`Importing all ${orders.length} orders`);
  };

  // Friendly store name display
  const getStoreName = (shop: string) => shop.replace('.myshopify.com', '');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to connect your Shopify store.</p>
          <Button onClick={() => window.location.href = '/auth'} className="w-full">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with connected store name */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Orders</h1>
          <p className="text-gray-600">Connect your e-commerce platforms to import orders for shipping</p>
          
          {isConnected && connectedShops.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Store className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Connected stores:</span>
              {connectedShops.map(shop => (
                <Badge key={shop} variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
                  <ShoppingBag className="w-3 h-3 mr-1.5" />
                  {getStoreName(shop)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Reconnect Banner */}
        {needsReconnect && (
          <Card className="p-4 mb-6 border-amber-300 bg-amber-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Shopify access expired</p>
                <p className="text-sm text-amber-700">Your store connection needs to be re-authorized. Please reconnect.</p>
              </div>
              <Button onClick={handleConnectClick} disabled={isConnecting} size="sm">
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                Reconnect
              </Button>
            </div>
          </Card>
        )}

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Shopify Card */}
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Shopify</h3>
                  {isConnected && connectedShops.length > 0 && (
                    <p className="text-xs text-green-600 font-medium">{getStoreName(connectedShops[0])}</p>
                  )}
                </div>
              </div>
              {isConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Check className="w-3 h-3 mr-1" /> Connected
                </Badge>
              )}
            </div>

            {!isConnected ? (
              <Button onClick={handleConnectClick} disabled={isConnecting} className="w-full">
                {isConnecting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</>
                ) : (
                  <><ExternalLink className="w-4 h-4 mr-2" /> Connect Shopify</>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" onClick={fetchShopifyOrders} className="w-full" disabled={isLoadingOrders}>
                  {isLoadingOrders ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh Orders
                </Button>
                <Button variant="outline" onClick={disconnectShopify} className="w-full text-red-600 hover:text-red-700">
                  Disconnect
                </Button>
              </div>
            )}
          </Card>

          {/* Other platforms */}
          {[
            { name: 'Amazon', icon: Package },
            { name: 'eBay', icon: Globe },
            { name: 'Etsy', icon: Store },
          ].map(platform => (
            <Card key={platform.name} className="p-6 opacity-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <platform.icon className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">Coming Soon</Badge>
              </div>
              <Button disabled className="w-full">Connect</Button>
            </Card>
          ))}
        </div>

        {/* Orders Table */}
        {isConnected && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Shopify Orders
                {connectedShops.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    from {connectedShops.map(getStoreName).join(', ')}
                  </span>
                )}
              </h2>
              {isLoadingOrders && (
                <div className="flex items-center text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...
                </div>
              )}
            </div>

            {orders.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox checked={selectedOrders.length === orders.length} onCheckedChange={handleSelectAll} />
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
                    {orders.map(order => (
                      <TableRow key={`${order.shop}-${order.order_id}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.order_id)}
                            onCheckedChange={(checked) => handleSelectOrder(order.order_id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{order.order_id}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell className="max-w-xs truncate">{order.shipping_address}</TableCell>
                        <TableCell>{order.total_weight} lbs</TableCell>
                        <TableCell className="max-w-xs truncate">{order.line_items}</TableCell>
                        <TableCell>{order.created_at}</TableCell>
                        {connectedShops.length > 1 && (
                          <TableCell className="text-sm text-gray-500">{getStoreName(order.shop || '')}</TableCell>
                        )}
                      </TableRow>
                    ))}</TableBody>
                </Table>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-500">{selectedOrders.length} of {orders.length} selected</div>
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={handleShipSelected} disabled={selectedOrders.length === 0}>
                      Ship Selected ({selectedOrders.length})
                    </Button>
                    <Button onClick={handleShipAll}>Ship All ({orders.length})</Button>
                  </div>
                </div>
              </>
            ) : !isLoadingOrders ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No unfulfilled orders</h3>
                <p className="text-gray-500">All orders have been fulfilled, or no orders exist yet.</p>
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
};

export default ImportPage;
