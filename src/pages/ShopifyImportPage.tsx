
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Store, Package, User, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShopifyOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    first_name: string;
    last_name: string;
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
    weight: number;
    price: string;
  }>;
  total_weight: number;
  total_price: string;
  created_at: string;
  fulfillment_status: string;
}

const ShopifyImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'connect' | 'orders'>('connect');
  const [storeName, setStoreName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if we have a stored Shopify connection
    checkShopifyConnection();
  }, []);

  const checkShopifyConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .single();

      if (data && data.shopify_store_url) {
        setIsConnected(true);
        setStoreName(data.shopify_store_url.replace('.myshopify.com', ''));
        setStep('orders');
        fetchOrders();
      }
    } catch (error) {
      console.error('Error checking Shopify connection:', error);
    }
  };

  const handleConnect = async () => {
    if (!storeName.trim()) {
      toast.error('Please enter your Shopify store name');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Generate OAuth URL
      const shopifyUrl = `https://${storeName}.myshopify.com/admin/oauth/authorize`;
      const clientId = 'your-shopify-app-key'; // This would be from your Shopify app
      const scopes = 'read_orders,read_products,read_customers';
      const redirectUri = `${window.location.origin}/shopify/callback`;
      
      const oauthUrl = `${shopifyUrl}?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=${Date.now()}`;
      
      // For now, we'll simulate the connection
      setTimeout(() => {
        setIsConnected(true);
        setStep('orders');
        setIsConnecting(false);
        toast.success('Store connected successfully!');
        fetchOrders();
      }, 2000);
      
      // In production, you would redirect to the OAuth URL:
      // window.location.href = oauthUrl;
      
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      toast.error('Failed to connect to Shopify store');
      setIsConnecting(false);
    }
  };

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    
    try {
      // Simulate API call to fetch orders
      // In production, this would call your Supabase edge function
      const { data, error } = await supabase.functions.invoke('get-shopify-orders', {
        body: { storeName }
      });

      if (error) throw error;

      // For now, use mock data
      const mockOrders: ShopifyOrder[] = [
        {
          id: '1001',
          order_number: '#1001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          shipping_address: {
            first_name: 'John',
            last_name: 'Doe',
            address1: '123 Main St',
            city: 'New York',
            province: 'NY',
            zip: '10001',
            country: 'US',
            phone: '555-0123'
          },
          line_items: [
            {
              id: '1',
              name: 'T-Shirt',
              quantity: 2,
              weight: 0.5,
              price: '25.00'
            }
          ],
          total_weight: 1.0,
          total_price: '50.00',
          created_at: '2024-01-15T10:00:00Z',
          fulfillment_status: 'unfulfilled'
        },
        {
          id: '1002',
          order_number: '#1002',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          shipping_address: {
            first_name: 'Jane',
            last_name: 'Smith',
            address1: '456 Oak Ave',
            city: 'Los Angeles',
            province: 'CA',
            zip: '90210',
            country: 'US',
            phone: '555-0456'
          },
          line_items: [
            {
              id: '2',
              name: 'Hoodie',
              quantity: 1,
              weight: 1.2,
              price: '65.00'
            }
          ],
          total_weight: 1.2,
          total_price: '65.00',
          created_at: '2024-01-15T11:30:00Z',
          fulfillment_status: 'unfulfilled'
        }
      ];

      setOrders(mockOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  if (step === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Connect Shopify Store</h1>
                <p className="text-gray-600">Import orders from your Shopify store</p>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Form */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Store className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Connect Your Shopify Store</CardTitle>
                <p className="text-sm text-gray-600">
                  Enter your store name to connect and import orders
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="your-store"
                      className="rounded-r-none"
                    />
                    <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600 border border-l-0 rounded-r-md">
                      .myshopify.com
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Connect Store
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center">
                  You'll be redirected to Shopify to authorize the connection
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shopify Orders</h1>
                <p className="text-gray-600">
                  Connected to: <strong>{storeName}.myshopify.com</strong>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsConnected(false);
                  setStep('connect');
                }}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Unfulfilled Orders ({orders.length})
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Select orders to import for shipping
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="selectAll" className="text-sm">
                    Select All ({selectedOrders.length})
                  </Label>
                </div>
                
                <Button
                  disabled={selectedOrders.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Ship Selected Orders ({selectedOrders.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No unfulfilled orders</h3>
                <p className="text-gray-600">All orders have been fulfilled or there are no orders to display.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <div key={order.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleOrderSelect(order.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Order Info */}
                        <div>
                          <div className="font-medium text-gray-900">{order.order_number}</div>
                          <div className="text-sm text-gray-600">{order.customer_name}</div>
                          <div className="text-sm text-gray-500">{order.customer_email}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Shipping Address */}
                        <div>
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                            <MapPin className="w-3 h-3" />
                            Ship To
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.shipping_address.address1}
                            {order.shipping_address.address2 && (
                              <>, {order.shipping_address.address2}</>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.zip}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.shipping_address.country}
                          </div>
                        </div>
                        
                        {/* Items */}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Items</div>
                          {order.line_items.map((item) => (
                            <div key={item.id} className="text-sm text-gray-600">
                              {item.name} × {item.quantity}
                            </div>
                          ))}
                        </div>
                        
                        {/* Weight & Price */}
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            Weight: {order.total_weight} lbs
                          </div>
                          <div className="text-lg font-medium text-gray-900">
                            ${order.total_price}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {order.fulfillment_status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopifyImportPage;
