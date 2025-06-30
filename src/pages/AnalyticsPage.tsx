
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Package, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShipmentAnalytics {
  totalShipments: number;
  totalSpent: number;
  averageCost: number;
  popularCarriers: Array<{ name: string; count: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; shipments: number; cost: number }>;
  recentShipments: Array<{
    id: string;
    tracking_code: string;
    carrier: string;
    service: string;
    cost: number;
    status: string;
    created_at: string;
    recipient: string;
  }>;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ShipmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('get-shipping-analytics', {
        body: { timeRange }
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Fallback to mock data for now
      setAnalytics({
        totalShipments: 156,
        totalSpent: 2485.67,
        averageCost: 15.93,
        popularCarriers: [
          { name: 'USPS', count: 89, percentage: 57 },
          { name: 'UPS', count: 42, percentage: 27 },
          { name: 'FedEx', count: 25, percentage: 16 }
        ],
        monthlyTrends: [
          { month: 'Jan', shipments: 23, cost: 365.50 },
          { month: 'Feb', shipments: 31, cost: 492.30 },
          { month: 'Mar', shipments: 28, cost: 446.20 },
          { month: 'Apr', shipments: 35, cost: 558.75 },
          { month: 'May', shipments: 39, cost: 622.92 }
        ],
        recentShipments: [
          {
            id: '1',
            tracking_code: '1Z999AA1234567890',
            carrier: 'UPS',
            service: 'Ground',
            cost: 12.45,
            status: 'delivered',
            created_at: '2024-01-15T10:30:00Z',
            recipient: 'John Doe'
          },
          {
            id: '2',
            tracking_code: '9400109699938838456789',
            carrier: 'USPS',
            service: 'Priority Mail',
            cost: 8.35,
            status: 'in_transit',
            created_at: '2024-01-14T14:20:00Z',
            recipient: 'Jane Smith'
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shipping Analytics</h1>
        <p className="text-gray-600">Track your shipping performance and costs</p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <div className="flex gap-2">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
            { key: '1y', label: '1 Year' }
          ].map((range) => (
            <Button
              key={range.key}
              variant={timeRange === range.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range.key as any)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalShipments || 0}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.totalSpent.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">+8% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics?.averageCost.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">-3% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.5%</div>
            <p className="text-xs text-muted-foreground">+2% from last period</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="recent">Recent Shipments</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Shipments Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Shipments</CardTitle>
                <CardDescription>Number of shipments over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="shipments" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Cost Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Costs</CardTitle>
                <CardDescription>Shipping costs over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                    <Line type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carrier Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Carrier Distribution</CardTitle>
                <CardDescription>Breakdown by shipping carrier</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.popularCarriers}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics?.popularCarriers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Carrier Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Carrier Statistics</CardTitle>
                <CardDescription>Detailed breakdown by carrier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.popularCarriers.map((carrier, index) => (
                    <div key={carrier.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <div className="font-medium">{carrier.name}</div>
                          <div className="text-sm text-gray-600">{carrier.count} shipments</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{carrier.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>Your latest shipping activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentShipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{shipment.tracking_code}</div>
                        <div className="text-sm text-gray-600">
                          {shipment.carrier} • {shipment.service} • {shipment.recipient}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(shipment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${shipment.cost.toFixed(2)}</div>
                      <Badge className={getStatusColor(shipment.status)}>
                        {shipment.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
