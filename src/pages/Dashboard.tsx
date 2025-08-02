import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  MapPin, 
  Truck,
  FileSpreadsheet,
  BarChart3,
  Activity,
  Zap,
  Globe
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    totalSpent: 0,
    averageCost: 0,
    recentShipments: [],
    popularCarriers: [],
    monthlyVolume: [],
    isLoading: true
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch live shipping data
        const { data: shipments, error: shipmentsError } = await supabase
          .from('bulk_shipments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (shipmentsError) {
          console.error('Error fetching shipments:', shipmentsError);
        }

        // Process the data
        const processedShipments = shipments || [];
        const totalShipments = processedShipments.length;
        const pendingShipments = processedShipments.filter(s => s.status === 'pending').length;
        const totalSpent = processedShipments.reduce((sum, s) => {
          const cost = typeof s.total_cost === 'string' ? parseFloat(s.total_cost) : s.total_cost;
          return sum + (cost || 0);
        }, 0);
        const averageCost = totalShipments > 0 ? totalSpent / totalShipments : 0;

        // Get recent shipments
        const recentShipments = processedShipments.slice(0, 5);

        // Calculate popular carriers from shipment_data
        const carrierCounts: Record<string, number> = {};
        processedShipments.forEach(shipment => {
          try {
            const shipmentData = typeof shipment.shipment_data === 'string' 
              ? JSON.parse(shipment.shipment_data) 
              : shipment.shipment_data;
            
            if (shipmentData?.carrier) {
              carrierCounts[shipmentData.carrier] = (carrierCounts[shipmentData.carrier] || 0) + 1;
            }
          } catch (error) {
            console.log('Error parsing shipment data:', error);
          }
        });

        const popularCarriers = Object.entries(carrierCounts)
          .map(([carrier, count]) => ({ carrier, count }))
          .sort((a, b) => (b.count as number) - (a.count as number))
          .slice(0, 3);

        // Calculate monthly volume (last 6 months)
        const monthlyVolume = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthShipments = processedShipments.filter(s => {
            const shipmentDate = new Date(s.created_at);
            return shipmentDate.getMonth() === date.getMonth() && 
                   shipmentDate.getFullYear() === date.getFullYear();
          });
          
          monthlyVolume.push({
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            volume: monthShipments.length,
            revenue: monthShipments.reduce((sum, s) => {
              const cost = typeof s.total_cost === 'string' ? parseFloat(s.total_cost) : s.total_cost;
              return sum + (cost || 0);
            }, 0)
          });
        }

        setDashboardData({
          totalShipments,
          pendingShipments,
          totalSpent,
          averageCost,
          recentShipments,
          popularCarriers,
          monthlyVolume,
          isLoading: false
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardData();
  }, [user]);

  const quickActions = [
    {
      title: 'Create Shipping Label',
      description: 'Generate labels for domestic & international shipping',
      icon: Package,
      path: '/create-label',
      gradient: 'from-blue-600 to-blue-700',
      hoverGradient: 'from-blue-700 to-blue-800'
    },
    {
      title: 'Batch Label Creation',
      description: 'Upload CSV and create multiple labels at once',
      icon: FileSpreadsheet,
      path: '/bulk-upload',
      gradient: 'from-purple-600 to-purple-700',
      hoverGradient: 'from-purple-700 to-purple-800'
    },
    {
      title: 'Rate Calculator',
      description: 'Compare shipping rates across all carriers',
      icon: Calculator,
      path: '/rate-calculator',
      gradient: 'from-green-600 to-green-700',
      hoverGradient: 'from-green-700 to-green-800'
    },
    {
      title: 'Track Shipments',
      description: 'Monitor your packages in real-time',
      icon: MapPin,
      path: '/tracking',
      gradient: 'from-orange-600 to-orange-700',
      hoverGradient: 'from-orange-700 to-orange-800'
    }
  ];

  const stats = [
    {
      title: 'Total Shipments',
      value: dashboardData.isLoading ? '...' : dashboardData.totalShipments.toLocaleString(),
      change: '+12%',
      changeType: 'increase',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Pending Shipments',
      value: dashboardData.isLoading ? '...' : dashboardData.pendingShipments.toString(),
      change: '-5%',
      changeType: 'decrease',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Total Spent',
      value: dashboardData.isLoading ? '...' : `$${dashboardData.totalSpent.toLocaleString()}`,
      change: '+8%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Average Cost',
      value: dashboardData.isLoading ? '...' : `$${dashboardData.averageCost.toFixed(2)}`,
      change: '+3%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}! 👋
          </h1>
          <p className="text-gray-600">
            Manage your shipping operations with our comprehensive platform
          </p>
        </div>

        {/* Live Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <Badge 
                          className={`text-xs ${stat.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {stat.change}
                        </Badge>
                        <span className="text-xs text-gray-500 ml-2">vs last month</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-50 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-0">
                  <div className={`bg-gradient-to-r ${action.gradient} group-hover:bg-gradient-to-r group-hover:${action.hoverGradient} p-6 text-white transition-all duration-300`}>
                    <Icon className="h-8 w-8 mb-3" />
                    <h3 className="font-bold text-lg mb-2">{action.title}</h3>
                    <p className="text-white/90 text-sm">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Shipments */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading recent activity...</p>
                  </div>
                ) : dashboardData.recentShipments.length > 0 ? (
                  dashboardData.recentShipments.map((shipment: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Shipment #{shipment.id?.slice(-8)}</p>
                          <p className="text-gray-500 text-xs">{new Date(shipment.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        ${(typeof shipment.total_cost === 'string' ? parseFloat(shipment.total_cost) : shipment.total_cost || 0).toFixed(2)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent shipments</p>
                    <Button 
                      onClick={() => navigate('/create-label')} 
                      className="mt-2"
                      size="sm"
                    >
                      Create First Shipment
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Popular Carriers */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Popular Carriers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading carrier data...</p>
                  </div>
                ) : dashboardData.popularCarriers.length > 0 ? (
                  dashboardData.popularCarriers.map((carrier: any, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Truck className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{carrier.carrier}</p>
                          <p className="text-gray-500 text-xs">{carrier.count} shipments</p>
                        </div>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(carrier.count / dashboardData.totalShipments) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No carrier data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
