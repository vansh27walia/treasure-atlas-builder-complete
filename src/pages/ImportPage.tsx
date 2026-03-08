import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, ShoppingBag, Package, Globe, Store, AlertCircle, Loader2, ExternalLink, Lock, RefreshCw, Truck, MapPin, Hash, Box } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ShopifyOrderReviewModal, { ReviewableOrder } from '@/components/shipping/ShopifyOrderReviewModal';
import PickupAddressOverlay from '@/components/shipping/PickupAddressOverlay';
import { useAutoBatch } from '@/hooks/useAutoBatch';
import { ShopifyOrderRaw, mapShopifyOrderToRow } from '@/utils/shopifyHeaderMapping';

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

interface ShippedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  shipping_address_text: string;
  tracking_number: string;
  tracking_url: string;
  carrier: string;
  fulfillment_status: string;
  synced_to_shopify: boolean;
  total_weight: number;
  shop: string;
  line_items: string;
  created_at: string;
  shipment_record_id: number | null;
  est_delivery_date?: string | null;
  parcel_json?: any;
  label_url?: string;
}

const ImportPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedShops, setConnectedShops] = useState<string[]>([]);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const fetchingRef = React.useRef(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewableOrders, setReviewableOrders] = useState<ReviewableOrder[]>([]);
  const [activeTab, setActiveTab] = useState('unfulfilled');
  const [shippedOrders, setShippedOrders] = useState<ShippedOrder[]>([]);
  const [isLoadingShipped, setIsLoadingShipped] = useState(false);
  const [showPickupOverlay, setShowPickupOverlay] = useState(false);
  const [pendingApprovedOrders, setPendingApprovedOrders] = useState<ReviewableOrder[]>([]);

  const autoBatch = useAutoBatch();

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
        fetchShippedOrders();
      } else {
        setIsConnected(false);
        setConnectedShops([]);
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    }
  };

  const handleConnectClick = async () => {
    if (!user) { toast.error('Please sign in first'); return; }
    setIsConnecting(true);
    try {
      if (needsReconnect || isConnected) {
        await supabase.from('shopify_connections').delete().eq('user_id', user.id);
        await supabase.from('oauth_states').delete().eq('user_id', user.id).eq('platform', 'shopify');
        setIsConnected(false); setConnectedShops([]); setOrders([]); setNeedsReconnect(false);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error('Session expired.'); setIsConnecting(false); return; }
      window.location.href = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth?action=start&token=${encodeURIComponent(session.access_token)}`;
    } catch (error) {
      console.error('OAuth start error:', error);
      toast.error('Failed to start connection');
      setIsConnecting(false);
    }
  };

  const fetchShopifyOrders = async () => {
    if (!user || fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoadingOrders(true);
    try {
      const response = await supabase.functions.invoke('shopify-orders');
      if (response.error) throw new Error(response.error.message);
      const { orders: fetchedOrders, needs_reconnect, error: apiError } = response.data;
      if (needs_reconnect) {
        setNeedsReconnect(true);
        toast.error('Shopify access needs re-authorization. Please reconnect your store.');
        return;
      }
      if (apiError && (!fetchedOrders || fetchedOrders.length === 0)) { toast.error(apiError); return; }

      // Filter out orders that are already fulfilled locally (in shipped orders)
      const { data: fulfilledLocal } = await supabase
        .from('shopify_orders')
        .select('shopify_order_id')
        .eq('user_id', user.id)
        .eq('fulfillment_status', 'fulfilled');
      
      const fulfilledIds = new Set((fulfilledLocal || []).map(o => o.shopify_order_id));
      const filtered = (fetchedOrders || []).filter((o: ShopifyOrder) => !fulfilledIds.has(o.shopify_order_id));

      setOrders(filtered);
      if (filtered.length > 0) toast.success(`Loaded ${filtered.length} unfulfilled orders`);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
      fetchingRef.current = false;
    }
  };

  const fetchShippedOrders = async () => {
    if (!user) return;
    setIsLoadingShipped(true);
    try {
      const { data, error } = await supabase
        .from('shopify_orders')
        .select('*, shipment_records:shipment_record_id(est_delivery_date)')
        .eq('user_id', user.id)
        .eq('fulfillment_status', 'fulfilled')
        .not('tracking_number', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped: ShippedOrder[] = (data || []).map((o: any) => ({
        id: o.id,
        order_number: o.order_number || o.shopify_order_id,
        customer_name: o.customer_name || 'Unknown',
        shipping_address_text: o.shipping_address_text || '',
        tracking_number: o.tracking_number || '',
        tracking_url: o.tracking_url || '',
        carrier: o.carrier || '',
        fulfillment_status: o.fulfillment_status || 'fulfilled',
        synced_to_shopify: o.synced_to_shopify || false,
        total_weight: o.total_weight || 0,
        shop: o.shop,
        line_items: o.line_items || '',
        created_at: o.created_at ? new Date(o.created_at).toLocaleDateString() : '',
        shipment_record_id: o.shipment_record_id,
        label_url: o.label_url,
        est_delivery_date: o.shipment_records?.est_delivery_date || null,
      }));
      setShippedOrders(mapped);
    } catch (error) {
      console.error('Error fetching shipped orders:', error);
    } finally {
      setIsLoadingShipped(false);
    }
  };

  const disconnectShopify = async () => {
    if (!user) return;
    try {
      await supabase.from('shopify_connections').delete().eq('user_id', user.id);
      await supabase.from('oauth_states').delete().eq('user_id', user.id).eq('platform', 'shopify');
      setIsConnected(false); setConnectedShops([]); setOrders([]); setSelectedOrders([]); setNeedsReconnect(false);
      toast.success('Disconnected. Authentication has been fully reset.');
    } catch (error) { console.error('Disconnect error:', error); toast.error('Failed to disconnect'); }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedOrders(checked ? orders.map(o => o.order_id) : []);
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => checked ? [...prev, orderId] : prev.filter(id => id !== orderId));
  };

  const prepareReviewOrders = (orderIds: string[]) => {
    const selected = orders.filter(o => orderIds.includes(o.order_id));
    const reviewable: ReviewableOrder[] = selected.map(o => {
      const raw: ShopifyOrderRaw = {
        order_id: o.order_id, customer_name: o.customer_name,
        shipping_address: o.shipping_address, total_weight: o.total_weight,
        line_items: o.line_items, created_at: o.created_at,
        shopify_order_id: o.shopify_order_id, shop: o.shop,
      };
      const mapped = mapShopifyOrderToRow(raw, { length: 12, width: 8, height: 6, weight: o.total_weight || 1 });
      return {
        order_id: o.order_id, customer_name: mapped.to_name,
        to_street1: mapped.to_street1, to_street2: mapped.to_street2,
        to_city: mapped.to_city, to_state: mapped.to_state,
        to_zip: mapped.to_zip, to_country: mapped.to_country,
        phone: mapped.to_phone, email: mapped.to_email,
        weight: mapped.weight, length: mapped.length,
        width: mapped.width, height: mapped.height,
        line_items: o.line_items, approved: false,
        shopify_order_id: o.shopify_order_id, shop: o.shop,
      };
    });
    setReviewableOrders(reviewable);
    setShowReviewModal(true);
  };

  const handleShipSelected = () => {
    if (selectedOrders.length === 0) { toast.error('Please select at least one order'); return; }
    prepareReviewOrders(selectedOrders);
  };

  const handleShipAll = () => {
    const allIds = orders.map(o => o.order_id);
    setSelectedOrders(allIds);
    prepareReviewOrders(allIds);
  };

  const handleReviewConfirm = async (approvedOrders: ReviewableOrder[]) => {
    setShowReviewModal(false);
    setPendingApprovedOrders(approvedOrders);
    setShowPickupOverlay(true);
  };

  const handlePickupConfirm = async (pickupAddress: any) => {
    setShowPickupOverlay(false);
    // Store the pickup address for the batch
    sessionStorage.setItem('fromAddress', JSON.stringify({
      name: pickupAddress.name || '',
      company: pickupAddress.company || '',
      street1: pickupAddress.street1 || '',
      street2: pickupAddress.street2 || '',
      city: pickupAddress.city || '',
      state: pickupAddress.state || '',
      zip: pickupAddress.zip || '',
      country: pickupAddress.country || 'US',
      phone: pickupAddress.phone || '',
    }));
    const csv = await autoBatch.processReviewedOrders(pendingApprovedOrders);
    if (csv) {
      navigate('/bulk-upload');
    }
  };

  const getStoreName = (shop: string) => shop.replace('.myshopify.com', '');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to connect your Shopify store.</p>
          <Button onClick={() => navigate('/auth')} className="w-full">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Orders</h1>
          <p className="text-muted-foreground">Connect your e-commerce platforms to import orders for shipping</p>
          {isConnected && connectedShops.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <Store className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Connected stores:</span>
              {connectedShops.map(shop => (
                <Badge key={shop} variant="secondary" className="bg-green-100 text-green-800 text-sm px-3 py-1">
                  <ShoppingBag className="w-3 h-3 mr-1.5" />{getStoreName(shop)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {needsReconnect && (
          <Card className="p-4 mb-6 border-amber-300 bg-amber-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">Shopify access expired</p>
                <p className="text-sm text-amber-700">Please reconnect your store.</p>
              </div>
              <Button onClick={handleConnectClick} disabled={isConnecting} size="sm">
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                Reconnect
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Shopify</h3>
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
                {isConnecting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting...</> : <><ExternalLink className="w-4 h-4 mr-2" /> Connect Shopify</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" onClick={fetchShopifyOrders} className="w-full" disabled={isLoadingOrders}>
                  {isLoadingOrders ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh Orders
                </Button>
                <Button variant="outline" onClick={disconnectShopify} className="w-full text-destructive hover:text-destructive">
                  Disconnect
                </Button>
              </div>
            )}
          </Card>

          {[{ name: 'Amazon', icon: Package }, { name: 'eBay', icon: Globe }, { name: 'Etsy', icon: Store }].map(platform => (
            <Card key={platform.name} className="p-6 opacity-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <platform.icon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{platform.name}</h3>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <Button disabled className="w-full">Connect</Button>
            </Card>
          ))}
        </div>

        {isConnected && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Shopify Orders
                {connectedShops.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    from {connectedShops.map(getStoreName).join(', ')}
                  </span>
                )}
              </h2>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="unfulfilled" className="gap-2">
                  <Package className="w-4 h-4" />
                  Unfulfilled ({orders.length})
                </TabsTrigger>
                <TabsTrigger value="shipped" className="gap-2">
                  <Truck className="w-4 h-4" />
                  Shipped ({shippedOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="unfulfilled">
                {isLoadingOrders && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading orders...
                  </div>
                )}
                {!isLoadingOrders && orders.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox checked={selectedOrders.length === orders.length && orders.length > 0} onCheckedChange={handleSelectAll} />
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
                            <TableCell>{order.total_weight > 0 ? `${order.total_weight} lbs` : '—'}</TableCell>
                            <TableCell className="max-w-xs truncate">{order.line_items}</TableCell>
                            <TableCell>{order.created_at}</TableCell>
                            {connectedShops.length > 1 && (
                              <TableCell className="text-sm text-muted-foreground">{getStoreName(order.shop || '')}</TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                      <div className="text-sm text-muted-foreground">{selectedOrders.length} of {orders.length} selected</div>
                      <div className="flex space-x-3">
                        <Button variant="outline" onClick={handleShipSelected} disabled={selectedOrders.length === 0 || autoBatch.isProcessing}>
                          {autoBatch.isProcessing ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                          ) : (
                            <><Truck className="w-4 h-4 mr-2" /> Ship Selected ({selectedOrders.length})</>
                          )}
                        </Button>
                        <Button onClick={handleShipAll} disabled={autoBatch.isProcessing}>
                          <Truck className="w-4 h-4 mr-2" /> Ship All ({orders.length})
                        </Button>
                      </div>
                    </div>
                  </>
                ) : !isLoadingOrders ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No unfulfilled orders</h3>
                    <p className="text-muted-foreground">All orders have been fulfilled, or no orders exist yet.</p>
                  </div>
                ) : null}
              </TabsContent>

              <TabsContent value="shipped">
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" onClick={fetchShippedOrders} disabled={isLoadingShipped}>
                    {isLoadingShipped ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Refresh
                  </Button>
                </div>
                {isLoadingShipped && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading shipped orders...
                  </div>
                )}
                {!isLoadingShipped && shippedOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Tracking #</TableHead>
                        <TableHead>Est. Delivery</TableHead>
                        <TableHead>Shopify Sync</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shippedOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell className="max-w-xs truncate">{order.shipping_address_text}</TableCell>
                          <TableCell>{order.total_weight > 0 ? `${order.total_weight} lbs` : '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.carrier || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => navigate(`/tracking?search=${encodeURIComponent(order.tracking_number)}`)}
                              className="text-primary hover:underline font-mono text-sm inline-flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                            >
                              {order.tracking_number}
                              <Truck className="w-3 h-3" />
                            </button>
                          </TableCell>
                          <TableCell>
                            {order.est_delivery_date ? (
                              <span className="text-sm font-medium">{new Date(order.est_delivery_date).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.synced_to_shopify ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <Check className="w-3 h-3 mr-1" /> Synced
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{order.created_at}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : !isLoadingShipped ? (
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No shipped orders yet</h3>
                    <p className="text-muted-foreground">Orders will appear here after labels are created and synced to Shopify.</p>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>

      <ShopifyOrderReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        orders={reviewableOrders}
        onConfirmAll={handleReviewConfirm}
      />

      <PickupAddressOverlay
        open={showPickupOverlay}
        onClose={() => setShowPickupOverlay(false)}
        onConfirm={handlePickupConfirm}
      />
    </div>
  );
};

export default ImportPage;
