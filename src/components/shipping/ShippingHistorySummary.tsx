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
import { toast } from '@/components/ui/sonner';

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
      fetchRealAnalytics();
    }
  }, [user, timeRange]);

  const fetchRealAnalytics = async () => {
    try {
      setIsLoading(true);

      // Calculate date range
      const now = new Date();
      const daysBack = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[timeRange] || 30;

      const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

      // Fetch real shipment data from database
      const { data: shipmentRecords, error } = await supabase
        .from('shipment_records')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching shipment records:', error);
        toast.error('Failed to load analytics data');
        return;
      }

      if (!shipmentRecords || shipmentRecords.length === 0) {
        // Set empty analytics if no data
        setAnalytics({
          totalShipments: 0,
          totalSpent: 0,
          averageCost: 0,
          popularCarriers: [],
          monthlyTrends: [],
          recentShipments: []
        });
        return;
      }

      // Process real data
      const totalShipments = shipmentRecords.length;
      const totalSpent = shipmentRecords.reduce((sum, record) => {
        const cost = record.charged_rate || record.easypost_rate || 0;
        return sum + Number(cost);
      }, 0);
      const averageCost = totalSpent / totalShipments || 0;

      // Calculate carrier distribution
      const carrierCounts: { [key: string]: number } = {};
      shipmentRecords.forEach(record => {
        const carrier = record.carrier || 'Unknown';
        carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1;
      });

      const popularCarriers = Object.entries(carrierCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalShipments) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate monthly trends
      const monthlyData: { [key: string]: { shipments: number; cost: number } } = {};
      shipmentRecords.forEach(record => {
        const date = new Date(record.created_at);
        const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { shipments: 0, cost: 0 };
        }

        monthlyData[monthKey].shipments += 1;
        monthlyData[monthKey].cost += Number(record.charged_rate || record.easypost_rate || 0);
      });

      const monthlyTrends = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          shipments: data.shipments,
          cost: data.cost
        }))
        .sort((a, b) => {
          const [aMonth, aYear] = a.month.split('-');
          const [bMonth, bYear] = b.month.split('-');

          if (aYear !== bYear) {
            return parseInt(aYear) - parseInt(bYear);
          }

          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(aMonth) - months.indexOf(bMonth);
        });

      // Recent shipments
      const recentShipments = shipmentRecords.slice(0, 10).map(record => {
        const toAddress = record.to_address_json as any;
        return {
          id: record.id.toString(),
          tracking_code: record.tracking_code || 'N/A',
          carrier: record.carrier || 'Unknown',
          service: record.service || 'Standard',
          cost: Number(record.charged_rate || record.easypost_rate || 0),
          status: record.status || 'created',
          created_at: record.created_at,
          recipient: toAddress?.name || 'Unknown Recipient'
        };
      });

      setAnalytics({
        totalShipments,
        totalSpent,
        averageCost,
        popularCarriers,
        monthlyTrends,
        recentShipments
      });

      console.log('Analytics loaded with real data:', {
        totalShipments,
        totalSpent,
        carriers: popularCarriers.length
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
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

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Analytics Data Available</h2>
          <p className="text-gray-600">Create some shipments to see analytics here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shipping Analytics</h1>
        <p className="text-gray-600">Real-time insights from your shipping data</p>
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
            <div className="text-2xl font-bold">{analytics.totalShipments}</div>
            <p className="text-xs text-muted-foreground">Real shipment data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Actual shipping costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per shipment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Carriers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.popularCarriers.length}</div>
            <p className="text-xs text-muted-foreground">Different carriers used</p>
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
          {analytics.monthlyTrends.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Shipments</CardTitle>
                  <CardDescription>Shipment volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="shipments" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Costs</CardTitle>
                  <CardDescription>Shipping expenses over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyTrends}>
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
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No trend data available for the selected time range.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          {analytics.popularCarriers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Carrier Distribution</CardTitle>
                  <CardDescription>Your shipping carrier usage</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.popularCarriers}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.popularCarriers.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Carrier Statistics</CardTitle>
                  <CardDescription>Detailed carrier breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.popularCarriers.map((carrier, index) => (
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
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No carrier data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
              <CardDescription>Your latest shipping activity</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentShipments.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentShipments.map((shipment) => (
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent shipments found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;

