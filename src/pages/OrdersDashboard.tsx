import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package, Search, RefreshCw, Loader2, ExternalLink, AlertCircle,
  CheckCircle, XCircle, RotateCcw, Truck, Eye, ArrowLeft, ShoppingBag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

interface ShopifyOrder {
  id: string;
  shopify_order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address_text: string;
  total_price: number;
  financial_status: string;
  fulfillment_status: string;
  order_status: string;
  sync_status: string;
  line_items: string;
  total_weight: number;
  shop: string;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  label_url: string | null;
  synced_to_shopify: boolean;
  shopify_fulfillment_id: string | null;
  created_at: string;
}

interface ReturnRecord {
  id: string;
  order_id: string;
  shopify_order_id: string;
  return_label_url: string | null;
  return_tracking_number: string | null;
  return_carrier: string | null;
  return_status: string;
  reason: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  imported: 'bg-blue-100 text-blue-800',
  label_created: 'bg-yellow-100 text-yellow-800',
  fulfillment_pending: 'bg-orange-100 text-orange-800',
  fulfilled: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  return_requested: 'bg-purple-100 text-purple-800',
  returned: 'bg-indigo-100 text-indigo-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const CARRIER_TRACKING_URLS: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=',
  FedEx: 'https://www.fedex.com/fedextrack/?trknbr=',
  DHL: 'https://www.dhl.com/us-en/home/tracking.html?tracking-id=',
};

const OrdersDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [retrySyncingId, setRetrySyncingId] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<ShopifyOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopify_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as ShopifyOrder[]) || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchReturns = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns((data as unknown as ReturnRecord[]) || []);
    } catch (err) {
      console.error('Error fetching returns:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    fetchReturns();
  }, [fetchOrders, fetchReturns]);

  const handleSyncOrders = async () => {
    setIsSyncing(true);
    try {
      const response = await supabase.functions.invoke('shopify-orders');
      if (response.error) throw new Error(response.error.message);
      toast.success(`Orders synced from Shopify`);
      await fetchOrders();
    } catch (err) {
      console.error('Sync error:', err);
      toast.error('Failed to sync orders');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetrySync = async (order: ShopifyOrder) => {
    if (!order.tracking_number || !order.shopify_order_id) {
      toast.error('Missing tracking number or Shopify order ID');
      return;
    }
    setRetrySyncingId(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-fulfill-order', {
        body: {
          shopify_order_id: order.shopify_order_id,
          shopify_shop: order.shop,
          tracking_number: order.tracking_number,
          carrier_name: order.carrier || 'Unknown',
          tracking_url: order.tracking_url || `https://track.easypost.com/${order.tracking_number}`,
          notify_customer: true,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Successfully synced to Shopify');
        await supabase
          .from('shopify_orders')
          .update({
            order_status: 'fulfilled',
            synced_to_shopify: true,
            sync_status: 'synced',
            shopify_fulfillment_id: data.fulfillment_id?.toString(),
          } as any)
          .eq('id', order.id);
        await fetchOrders();
      } else {
        throw new Error(data?.error || 'Sync failed');
      }
    } catch (err: any) {
      console.error('Retry sync error:', err);
      toast.error(err.message || 'Failed to retry sync');
      // Log error
      await supabase.from('sync_error_logs').insert({
        user_id: user!.id,
        order_id: order.id,
        shopify_order_id: order.shopify_order_id,
        error_type: 'fulfillment_sync_failed',
        error_message: err.message,
      } as any);
    } finally {
      setRetrySyncingId(null);
    }
  };

  const handleCreateReturn = async () => {
    if (!returnOrderId || !user) return;
    try {
      const { error } = await supabase.from('returns').insert({
        user_id: user.id,
        order_id: returnOrderId,
        reason: returnReason,
        return_status: 'requested',
      } as any);

      if (error) throw error;

      // Update order status
      await supabase
        .from('shopify_orders')
        .update({ order_status: 'return_requested' } as any)
        .eq('id', returnOrderId);

      toast.success('Return request created');
      setShowReturnModal(false);
      setReturnReason('');
      setReturnOrderId(null);
      await fetchOrders();
      await fetchReturns();
    } catch (err) {
      console.error('Create return error:', err);
      toast.error('Failed to create return');
    }
  };

  const getTrackingUrl = (order: ShopifyOrder) => {
    if (order.tracking_url) return order.tracking_url;
    if (!order.tracking_number || !order.carrier) return null;
    const baseUrl = CARRIER_TRACKING_URLS[order.carrier] || CARRIER_TRACKING_URLS['USPS'];
    return `${baseUrl}${order.tracking_number}`;
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = !searchQuery ||
      o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());

    switch (activeTab) {
      case 'unfulfilled': return matchesSearch && (o.fulfillment_status === 'unfulfilled' || o.fulfillment_status === null) && o.order_status === 'imported';
      case 'label_created': return matchesSearch && o.order_status === 'label_created';
      case 'completed': return matchesSearch && o.synced_to_shopify && (o.order_status === 'fulfilled' || o.order_status === 'delivered');
      case 'failed': return matchesSearch && o.sync_status === 'failed';
      case 'returns': return false; // handled separately
      default: return matchesSearch;
    }
  });

  const counts = {
    all: orders.length,
    unfulfilled: orders.filter(o => (o.fulfillment_status === 'unfulfilled' || o.fulfillment_status === null) && o.order_status === 'imported').length,
    label_created: orders.filter(o => o.order_status === 'label_created').length,
    completed: orders.filter(o => o.synced_to_shopify && (o.order_status === 'fulfilled' || o.order_status === 'delivered')).length,
    failed: orders.filter(o => o.sync_status === 'failed').length,
    returns: returns.length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Orders Dashboard</h1>
            <p className="text-muted-foreground">Manage Shopify orders, labels, tracking, and returns</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/import')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Import Page
            </Button>
            <Button onClick={handleSyncOrders} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync Orders
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers, tracking..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="all">All Orders ({counts.all})</TabsTrigger>
            <TabsTrigger value="unfulfilled">Unfulfilled ({counts.unfulfilled})</TabsTrigger>
            <TabsTrigger value="label_created">Label Created ({counts.label_created})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
            <TabsTrigger value="failed">
              Failed Sync ({counts.failed})
              {counts.failed > 0 && <AlertCircle className="w-3 h-3 ml-1 text-destructive" />}
            </TabsTrigger>
            <TabsTrigger value="returns">Returns ({counts.returns})</TabsTrigger>
          </TabsList>

          {/* Orders Table for non-returns tabs */}
          {['all', 'unfulfilled', 'label_created', 'completed', 'failed'].map(tab => (
            <TabsContent key={tab} value={tab}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders found</h3>
                  <p className="text-muted-foreground">
                    {tab === 'all' ? 'Sync your Shopify store to see orders.' : `No ${tab.replace('_', ' ')} orders.`}
                  </p>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Shopify Sync</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>
                            <div>{order.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{order.shipping_address_text}</TableCell>
                          <TableCell>
                            {order.label_url ? (
                              <a href={order.label_url} target="_blank" rel="noopener noreferrer">
                                <Badge className="bg-green-100 text-green-800 cursor-pointer">
                                  <ExternalLink className="w-3 h-3 mr-1" /> View
                                </Badge>
                              </a>
                            ) : (
                              <Badge variant="secondary">None</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.tracking_number ? (
                              <button
                                onClick={() => { setTrackingOrder(order); setShowTrackingModal(true); }}
                                className="text-primary hover:underline text-sm font-mono"
                              >
                                {order.tracking_number}
                              </button>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.synced_to_shopify ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" /> Synced
                              </Badge>
                            ) : order.sync_status === 'failed' ? (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" /> Failed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[order.order_status] || 'bg-gray-100 text-gray-800'}>
                              {order.order_status?.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!order.label_url && order.order_status === 'imported' && (
                                <Button size="sm" variant="outline" onClick={() => navigate('/create-label')}>
                                  <Truck className="w-3 h-3 mr-1" /> Label
                                </Button>
                              )}
                              {order.tracking_number && !order.synced_to_shopify && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRetrySync(order)}
                                  disabled={retrySyncingId === order.id}
                                >
                                  {retrySyncingId === order.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <><RotateCcw className="w-3 h-3 mr-1" /> Sync</>
                                  )}
                                </Button>
                              )}
                              {order.synced_to_shopify && order.order_status !== 'return_requested' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setReturnOrderId(order.id); setShowReturnModal(true); }}
                                >
                                  <ArrowLeft className="w-3 h-3 mr-1" /> Return
                                </Button>
                              )}
                              {order.tracking_number && (
                                <Button size="sm" variant="ghost" onClick={() => { setTrackingOrder(order); setShowTrackingModal(true); }}>
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>
          ))}

          {/* Returns Tab */}
          <TabsContent value="returns">
            {returns.length === 0 ? (
              <Card className="p-12 text-center">
                <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No returns</h3>
                <p className="text-muted-foreground">Return requests will appear here.</p>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Return Status</TableHead>
                      <TableHead>Return Label</TableHead>
                      <TableHead>Return Tracking</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {returns.map(ret => (
                      <TableRow key={ret.id}>
                        <TableCell className="font-mono text-sm">{ret.shopify_order_id || ret.order_id?.substring(0, 8)}</TableCell>
                        <TableCell>
                          <Badge className={
                            ret.return_status === 'received' ? 'bg-green-100 text-green-800' :
                            ret.return_status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                            ret.return_status === 'label_generated' ? 'bg-yellow-100 text-yellow-800' :
                            ret.return_status === 'refunded' ? 'bg-gray-100 text-gray-800' :
                            'bg-purple-100 text-purple-800'
                          }>
                            {ret.return_status?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ret.return_label_url ? (
                            <a href={ret.return_label_url} target="_blank" rel="noopener noreferrer">
                              <Badge className="bg-green-100 text-green-800 cursor-pointer">
                                <ExternalLink className="w-3 h-3 mr-1" /> View
                              </Badge>
                            </a>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{ret.return_tracking_number || '—'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{ret.reason || '—'}</TableCell>
                        <TableCell className="text-sm">{new Date(ret.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Tracking Modal */}
        <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tracking Details</DialogTitle>
            </DialogHeader>
            {trackingOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                    <p className="font-mono text-lg">{trackingOrder.tracking_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Carrier</label>
                    <p className="text-lg">{trackingOrder.carrier || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={STATUS_COLORS[trackingOrder.order_status] || 'bg-gray-100 text-gray-800'}>
                      {trackingOrder.order_status?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Shopify Sync</label>
                    <p>{trackingOrder.synced_to_shopify ? '✅ Synced' : '❌ Not synced'}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  {getTrackingUrl(trackingOrder) && (
                    <Button onClick={() => window.open(getTrackingUrl(trackingOrder)!, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" /> Track on Carrier Site
                    </Button>
                  )}
                  {!trackingOrder.synced_to_shopify && (
                    <Button
                      variant="outline"
                      onClick={() => { setShowTrackingModal(false); handleRetrySync(trackingOrder); }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" /> Retry Sync
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Return Modal */}
        <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Return Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason for Return</label>
                <Textarea
                  placeholder="Describe the reason for this return..."
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReturnModal(false)}>Cancel</Button>
              <Button onClick={handleCreateReturn} disabled={!returnReason.trim()}>
                Create Return
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default OrdersDashboard;
