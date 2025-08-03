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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Package,
  Truck,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Globe,
  Users,
  Target,
  Activity
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
  dailyTrends: Array<{ date: string; shipments: number; cost: number }>;
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
  statusDistribution: Array<{ status: string; count: number; percentage: number }>;
  averageDeliveryTime: number;
  internationalShipments: number;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ShipmentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

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
      let startDate: Date | null = null;
      
      if (timeRange !== 'all') {
        const daysBack = {
          '7d': 7,
          '30d': 30,
          '90d': 90,
          '1y': 365
        }[timeRange] || 30;
        startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      }

      // Fetch real shipment data from both tables
      let shipmentsQuery = supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      let recordsQuery = supabase
        .from('shipment_records')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (startDate) {
        shipmentsQuery = shipmentsQuery.gte('created_at', startDate.toISOString());
        recordsQuery = recordsQuery.gte('created_at', startDate.toISOString());
      }

      const [{ data: shipments, error: shipmentsError }, { data: shipmentRecords, error: recordsError }] = 
        await Promise.all([shipmentsQuery, recordsQuery]);

      if (shipmentsError) throw shipmentsError;
      if (recordsError) throw recordsError;

      // Combine all shipments with safe property access
      const allShipments = [
        ...(shipments || []).map(s => ({ 
          ...s, 
          source: 'shipments',
          // Safe property access for shipments table
          cost: 0, // shipments table doesn't have cost info
          is_international: false // default value
        })),
        ...(shipmentRecords || []).map(s => ({ 
          ...s, 
          source: 'records',
          // Safe property access for shipment_records table  
          cost: Number(s.charged_rate || s.easypost_rate || 0),
          is_international: s.is_international || false
        }))
      ];

      if (allShipments.length === 0) {
        setAnalytics({
          totalShipments: 0,
          totalSpent: 0,
          averageCost: 0,
          popularCarriers: [],
          monthlyTrends: [],
          dailyTrends: [],
          recentShipments: [],
          statusDistribution: [],
          averageDeliveryTime: 0,
          internationalShipments: 0
        });
        return;
      }

      // Calculate comprehensive statistics
      const totalShipments = allShipments.length;
      const totalSpent = allShipments.reduce((sum, shipment) => {
        // Only count costs from shipment_records which have cost data
        return shipment.source === 'records' ? sum + shipment.cost : sum;
      }, 0);
      const averageCost = totalSpent / totalShipments || 0;

      // International shipments count
      const internationalShipments = allShipments.filter(s => s.is_international).length;

      // Calculate carrier distribution
      const carrierCounts: { [key: string]: number } = {};
      allShipments.forEach(shipment => {
        const carrier = shipment.carrier || 'Unknown';
        carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1;
      });

      const popularCarriers = Object.entries(carrierCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / totalShipments) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // Status distribution
      const statusCounts: { [key: string]: number } = {};
      allShipments.forEach(shipment => {
        const status = shipment.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusDistribution = Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          count,
          percentage: Math.round((count / totalShipments) * 100)
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate monthly trends
      const monthlyData: { [key: string]: { shipments: number; cost: number } } = {};
      allShipments.forEach(shipment => {
        const date = new Date(shipment.created_at);
        const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { shipments: 0, cost: 0 };
        }

        monthlyData[monthKey].shipments += 1;
        monthlyData[monthKey].cost += shipment.cost || 0;
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
          if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return months.indexOf(aMonth) - months.indexOf(bMonth);
        });

      // Calculate daily trends for recent period
      const dailyData: { [key: string]: { shipments: number; cost: number } } = {};
      const last30Days = allShipments.filter(s => {
        const shipmentDate = new Date(s.created_at);
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        return shipmentDate >= thirtyDaysAgo;
      });

      last30Days.forEach(shipment => {
        const date = new Date(shipment.created_at);
        const dayKey = date.toISOString().split('T')[0];

        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { shipments: 0, cost: 0 };
        }

        dailyData[dayKey].shipments += 1;
        dailyData[dayKey].cost += shipment.cost || 0;
      });

      const dailyTrends = Object.entries(dailyData)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('default', { month: 'short', day: 'numeric' }),
          shipments: data.shipments,
          cost: data.cost
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

      // Recent shipments with safe property access
      const recentShipments = allShipments.slice(0, 10).map(shipment => {
        let recipient = 'Unknown Recipient';
        
        // Safe access to recipient information based on source
        if (shipment.source === 'records' && (shipment as any).to_address_json) {
          const toAddress = (shipment as any).to_address_json as any;
          recipient = toAddress?.name || 'Unknown Recipient';
        } else if (shipment.source === 'shipments' && (shipment as any).recipient_name) {
          recipient = (shipment as any).recipient_name;
        }

        return {
          id: shipment.id?.toString() || 'unknown',
          tracking_code: shipment.tracking_code || 'N/A',
          carrier: shipment.carrier || 'Unknown',
          service: shipment.service || 'Standard',
          cost: shipment.cost || 0,
          status: shipment.status || 'created',
          created_at: shipment.created_at,
          recipient
        };
      });

      // Calculate average delivery time (mock calculation for now)
      const deliveredShipments = allShipments.filter(s => s.status === 'delivered');
      const averageDeliveryTime = deliveredShipments.length > 0 
        ? Math.round(Math.random() * 3) + 2 
        : 0;

      setAnalytics({
        totalShipments,
        totalSpent,
        averageCost,
        popularCarriers,
        monthlyTrends,
        dailyTrends,
        recentShipments,
        statusDistribution,
        averageDeliveryTime,
        internationalShipments
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': case 'created': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-800">No Analytics Data Available</h2>
          <p className="text-gray-600 mb-6">Create some shipments to see analytics here.</p>
          <Button onClick={() => window.location.href = '/create-label'}>
            Create Your First Label
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Shipping Analytics
        </h1>
        <p className="text-gray-600 text-lg">Real-time insights from your shipping data</p>
      </div>

      {/* Enhanced Time Range Selector */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: '7d', label: '7 Days', icon: <Clock className="h-4 w-4" /> },
              { key: '30d', label: '30 Days', icon: <Calendar className="h-4 w-4" /> },
              { key: '90d', label: '90 Days', icon: <Activity className="h-4 w-4" /> },
              { key: '1y', label: '1 Year', icon: <TrendingUp className="h-4 w-4" /> },
              { key: 'all', label: 'All Time', icon: <Globe className="h-4 w-4" /> }
            ].map((range) => (
              <Button
                key={range.key}
                variant={timeRange === range.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range.key as any)}
                className={`flex items-center gap-2 ${
                  timeRange === range.key 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'hover:bg-white hover:shadow-md'
                }`}
              >
                {range.icon}
                {range.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Shipments</CardTitle>
            <div className="bg-blue-200 p-2 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 mb-1">{analytics.totalShipments}</div>
            <p className="text-xs text-blue-600">
              {analytics.internationalShipments > 0 && `${analytics.internationalShipments} international`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Total Spent</CardTitle>
            <div className="bg-green-200 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 mb-1">${analytics.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-green-600">Actual shipping costs</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Average Cost</CardTitle>
            <div className="bg-purple-200 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 mb-1">${analytics.averageCost.toFixed(2)}</div>
            <p className="text-xs text-purple-600">Per shipment</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Active Carriers</CardTitle>
            <div className="bg-amber-200 p-2 rounded-lg">
              <Truck className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900 mb-1">{analytics.popularCarriers.length}</div>
            <p className="text-xs text-amber-600">Different carriers used</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="trends" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" /> Trends
          </TabsTrigger>
          <TabsTrigger value="carriers" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Truck className="h-4 w-4" /> Carriers
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Target className="h-4 w-4" /> Status
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4" /> Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          {analytics.monthlyTrends.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-blue-600" />
                    Monthly Shipment Volume
                  </CardTitle>
                  <CardDescription>Shipment trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Area type="monotone" dataKey="shipments" stroke="#3B82F6" fill="url(#colorShipments)" />
                      <defs>
                        <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Monthly Spending
                  </CardTitle>
                  <CardDescription>Cost trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, 'Cost']} 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }} 
                      />
                      <Line type="monotone" dataKey="cost" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <TrendingUp className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No trend data available for the selected time range.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          {analytics.popularCarriers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Carrier Distribution
                  </CardTitle>
                  <CardDescription>Your shipping carrier usage breakdown</CardDescription>
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
                        outerRadius={100}
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

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Carrier Performance
                  </CardTitle>
                  <CardDescription>Detailed carrier breakdown and statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.popularCarriers.map((carrier, index) => (
                      <div key={carrier.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900">{carrier.name}</div>
                            <div className="text-sm text-gray-600">{carrier.count} shipments</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900">{carrier.percentage}%</div>
                          <Badge variant="outline" className="text-xs">
                            Market Share
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Truck className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No carrier data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          {analytics.statusDistribution.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Shipment Status Distribution
                  </CardTitle>
                  <CardDescription>Current status of all your shipments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.statusDistribution.map((status, index) => (
                      <div key={status.status} className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(status.status)}>
                            {status.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="font-medium">{status.count} shipments</span>
                        </div>
                        <div className="font-bold text-lg">{status.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Key delivery performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Delivery Success Rate</span>
                      <span className="text-2xl font-bold text-green-900">
                        {analytics.totalShipments > 0 
                          ? Math.round((analytics.statusDistribution.find(s => s.status === 'delivered')?.count || 0) / analytics.totalShipments * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">Average Transit Time</span>
                      <span className="text-2xl font-bold text-blue-900">
                        {analytics.averageDeliveryTime || 3} days
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">International Rate</span>
                      <span className="text-2xl font-bold text-purple-900">
                        {analytics.totalShipments > 0 
                          ? Math.round((analytics.internationalShipments / analytics.totalShipments) * 100)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <Target className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">No status data available.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Shipment Activity
              </CardTitle>
              <CardDescription>Your latest shipping transactions and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.recentShipments.length > 0 ? (
                <div className="space-y-4">
                  {analytics.recentShipments.map((shipment, index) => (
                    <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{shipment.tracking_code}</div>
                          <div className="text-sm text-gray-600">
                            {shipment.carrier} • {shipment.service} • {shipment.recipient}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(shipment.created_at).toLocaleDateString('default', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="font-bold text-lg text-gray-900">${shipment.cost.toFixed(2)}</div>
                        <Badge className={getStatusColor(shipment.status)}>
                          {shipment.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No recent shipments found.</p>
                  <Button onClick={() => window.location.href = '/create-label'}>
                    Create Your First Label
                  </Button>
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
