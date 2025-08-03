import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Truck, Package, Clock, DollarSign, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface AnalyticsData {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  totalSpent: number;
  carrierBreakdown: Array<{ name: string; value: number; color: string }>;
  monthlyTrends: Array<{ month: string; shipments: number; cost: number }>;
  recentActivity: Array<{ id: string; action: string; date: string; status: string }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalShipments: 0,
    deliveredShipments: 0,
    inTransitShipments: 0,
    totalSpent: 0,
    carrierBreakdown: [],
    monthlyTrends: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRealAnalyticsData();
    }
  }, [user]);

  const fetchRealAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipment records
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipment_records')
        .select('*')
        .eq('user_id', user?.id);

      if (shipmentsError) throw shipmentsError;

      // Fetch tracking records
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_records')
        .select('*')
        .eq('user_id', user?.id);

      if (trackingError) throw trackingError;

      // Fetch payment records
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('user_id', user?.id);

      if (paymentsError) throw paymentsError;

      // Calculate analytics
      const allRecords = [...(shipments || []), ...(tracking || [])];
      const totalShipments = allRecords.length;
      const deliveredShipments = allRecords.filter(record => record.status === 'delivered').length;
      const inTransitShipments = allRecords.filter(record => 
        ['in_transit', 'out_for_delivery', 'processing'].includes(record.status || '')
      ).length;

      const totalSpent = (payments || []).reduce((sum, payment) => 
        sum + (parseFloat(payment.amount?.toString() || '0') || 0), 0
      );

      // Carrier breakdown from real data
      const carrierCounts: { [key: string]: number } = {};
      allRecords.forEach(record => {
        const carrier = record.carrier || 'Unknown';
        carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1;
      });

      const carrierColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const carrierBreakdown = Object.entries(carrierCounts).map(([name, value], index) => ({
        name,
        value,
        color: carrierColors[index % carrierColors.length]
      }));

      // Monthly trends from real data
      const monthlyData: { [key: string]: { shipments: number; cost: number } } = {};
      allRecords.forEach(record => {
        const month = new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
          monthlyData[month] = { shipments: 0, cost: 0 };
        }
        monthlyData[month].shipments += 1;
      });

      (payments || []).forEach(payment => {
        const month = new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData[month]) {
          monthlyData[month].cost += parseFloat(payment.amount?.toString() || '0') || 0;
        }
      });

      const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        shipments: data.shipments,
        cost: data.cost
      })).slice(-6); // Last 6 months

      // Recent activity from real data - fix the id type issue
      const recentActivity = allRecords.slice(-10).map(record => ({
        id: record.id.toString(), // Convert to string to match interface
        action: `Shipment ${record.tracking_code || record.shipment_id || 'created'}`,
        date: new Date(record.created_at).toLocaleDateString(),
        status: record.status || 'pending'
      }));

      setAnalyticsData({
        totalShipments,
        deliveredShipments,
        inTransitShipments,
        totalSpent,
        carrierBreakdown,
        monthlyTrends,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Fallback to minimal data if error occurs
      setAnalyticsData({
        totalShipments: 0,
        deliveredShipments: 0,
        inTransitShipments: 0,
        totalSpent: 0,
        carrierBreakdown: [],
        monthlyTrends: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded-lg"></div>
            <div className="h-80 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const deliveryRate = analyticsData.totalShipments > 0 ? 
    (analyticsData.deliveredShipments / analyticsData.totalShipments) * 100 : 0;

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your shipping performance and insights</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <TrendingUp className="w-4 h-4 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Shipments</p>
              <p className="text-3xl font-bold mt-1">{analyticsData.totalShipments}</p>
              <p className="text-blue-100 text-sm mt-1">All time</p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Delivered</p>
              <p className="text-3xl font-bold mt-1">{analyticsData.deliveredShipments}</p>
              <p className="text-green-100 text-sm mt-1">{deliveryRate.toFixed(1)}% success rate</p>
            </div>
            <Truck className="w-12 h-12 text-green-200" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">In Transit</p>
              <p className="text-3xl font-bold mt-1">{analyticsData.inTransitShipments}</p>
              <p className="text-orange-100 text-sm mt-1">Active shipments</p>
            </div>
            <Clock className="w-12 h-12 text-orange-200" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Spent</p>
              <p className="text-3xl font-bold mt-1">${analyticsData.totalSpent.toFixed(2)}</p>
              <p className="text-purple-100 text-sm mt-1">All time</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Carrier Distribution */}
        <Card className="p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Carrier Distribution</h3>
          {analyticsData.carrierBreakdown.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.carrierBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {analyticsData.carrierBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-4">
                {analyticsData.carrierBreakdown.map((carrier, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: carrier.color }}></div>
                    <span className="text-sm text-gray-600">{carrier.name} ({carrier.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No shipment data available</p>
              </div>
            </div>
          )}
        </Card>

        {/* Monthly Trends */}
        <Card className="p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          {analyticsData.monthlyTrends.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="shipments" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No trend data available</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {analyticsData.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {analyticsData.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{activity.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={activity.status === 'delivered' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
