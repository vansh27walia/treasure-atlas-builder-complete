
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingCart, Download, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ShopifyOrder {
  id: string;
  order_number: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
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
    title: string;
    quantity: number;
    weight?: number;
    price: string;
  }>;
  total_weight?: number;
  created_at: string;
}

const ShopifyBulkShipping: React.FC = () => {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState<ShopifyOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const handleShopifyConnect = async () => {
    if (!user) {
      toast.error('Please login to connect Shopify');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Generate state parameter for OAuth security
      const state = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('shopify_oauth_state', state);
      
      // Redirect to Shopify OAuth
      const shopifyOAuthUrl = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-oauth?state=${state}`;
      window.location.href = shopifyOAuthUrl;
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      toast.error('Failed to connect to Shopify. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImportOrders = async () => {
    if (!user) {
      toast.error('Please login to import orders');
      return;
    }

    setIsImporting(true);
    
    try {
      const response = await fetch('https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/shopify-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          limit: 50,
          status: 'unfulfilled'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setIsConnected(true);
        toast.success(`Successfully imported ${data.orders.length} orders from Shopify`);
      } else {
        throw new Error('Invalid response format from Shopify');
      }
    } catch (error) {
      console.error('Error importing Shopify orders:', error);
      toast.error('Failed to import orders from Shopify. Please check your connection and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrders(
      selectedOrders.length === orders.length 
        ? [] 
        : orders.map(order => order.id)
    );
  };

  const convertToCSV = (orders: ShopifyOrder[]) => {
    const headers = [
      'Order Number',
      'Customer Name',
      'Email',
      'Company',
      'Address 1',
      'Address 2',
      'City',
      'State',
      'Zip',
      'Country',
      'Phone',
      'Weight (oz)',
      'Items',
      'Total Value'
    ];

    const csvData = orders.map(order => {
      const totalValue = order.line_items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      const itemsDescription = order.line_items.map(item => `${item.title} (${item.quantity})`).join('; ');
      
      return [
        order.order_number,
        `${order.customer.first_name} ${order.customer.last_name}`,
        order.customer.email,
        order.shipping_address.company || '',
        order.shipping_address.address1,
        order.shipping_address.address2 || '',
        order.shipping_address.city,
        order.shipping_address.province,
        order.shipping_address.zip,
        order.shipping_address.country,
        order.shipping_address.phone || '',
        order.total_weight || 16, // Default weight if not provided
        itemsDescription,
        totalValue.toFixed(2)
      ];
    });

    return [headers, ...csvData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const handleCreateBulkShipment = () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order to ship');
      return;
    }

    const selectedOrderData = orders.filter(order => selectedOrders.includes(order.id));
    const csvContent = convertToCSV(selectedOrderData);
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `shopify_orders_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast.success(`CSV file created with ${selectedOrders.length} orders`);
    
    // Navigate to bulk upload page
    setTimeout(() => {
      window.location.href = '/bulk-upload';
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopify Integration
          </CardTitle>
          <CardDescription>
            Connect your Shopify store to import orders and create bulk shipping labels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Connect your Shopify store to import unfulfilled orders and create shipping labels in bulk.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-4">
                <Button 
                  onClick={handleShopifyConnect}
                  disabled={isConnecting}
                  className="flex-1"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Shopify Store'
                  )}
                </Button>
                
                <Button 
                  onClick={handleImportOrders}
                  disabled={isImporting}
                  variant="outline"
                  className="flex-1"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Orders'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>Connected to Shopify</span>
              </div>
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Orders ({orders.length})
                </h3>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSelectAll}
                    variant="outline"
                    size="sm"
                  >
                    {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button 
                    onClick={handleCreateBulkShipment}
                    disabled={selectedOrders.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Create Bulk Shipment ({selectedOrders.length})
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleOrderSelection(order.id)}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="font-medium">Order #{order.order_number}</div>
                          <div className="text-sm text-gray-600">
                            {order.customer.first_name} {order.customer.last_name} - {order.shipping_address.city}, {order.shipping_address.province}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {order.line_items.length} item{order.line_items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </Card>
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
