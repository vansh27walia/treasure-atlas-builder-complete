
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, ChartBar, Upload, CreditCard, TrendingUp, MapPin, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    inTransitShipments: 0,
    totalSpent: 0,
    recentShipments: [],
    topCarriers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Fetch labels data (this is the correct table based on the error messages)
        const { data: labels } = await supabase
          .from('labels')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (labels) {
          // Calculate statistics from labels
          const totalShipments = labels.length;
          const deliveredShipments = labels.filter(l => l.status === 'delivered').length;
          const inTransitShipments = labels.filter(l => l.status === 'in_transit').length;
          
          // Calculate total spent - handle both string and number types
          const totalSpent = labels.reduce((sum, label) => {
            const cost = typeof label.cost === 'string' ? parseFloat(label.cost) || 0 : (label.cost || 0);
            return sum + cost;
          }, 0);

          // Get carrier stats
          const carrierStats: Record<string, number> = {};
          labels.forEach(label => {
            const carrier = label.carrier || 'Unknown';
            carrierStats[carrier] = (carrierStats[carrier] || 0) + 1;
          });

          const topCarriers = Object.entries(carrierStats)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([carrier, count]) => ({ carrier, count: count as number }));

          setDashboardData({
            totalShipments,
            deliveredShipments,
            inTransitShipments,
            totalSpent,
            recentShipments: labels.slice(0, 5),
            topCarriers
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);
  
  // Quick action buttons for main shipping tasks
  const quickActions = [
    {
      title: "Create Shipping Label",
      description: "Generate a new shipping label for a package",
      icon: <Package className="h-6 w-6" />,
      action: () => navigate('/create-label'),
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
    },
    {
      title: "Track Packages",
      description: "View and track shipment status",
      icon: <Truck className="h-6 w-6" />,
      action: () => navigate('/dashboard?tab=tracking'),
      color: "bg-green-50 border-green-200 hover:bg-green-100"
    },
    {
      title: "Batch Label Creation",
      description: "Create multiple shipping labels at once",
      icon: <Upload className="h-6 w-6" />,
      action: () => navigate('/bulk-upload'),
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100"
    },
    {
      title: "Rate Calculator",
      description: "Compare shipping rates from multiple carriers",
      icon: <ChartBar className="h-6 w-6" />,
      action: () => navigate('/rate-calculator'),
      color: "bg-amber-50 border-amber-200 hover:bg-amber-100"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ShipQuick Dashboard
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your complete shipping solution with real-time tracking, bulk operations, and intelligent rate optimization
        </p>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {loading ? '...' : dashboardData.totalShipments}
            </div>
            <p className="text-xs text-blue-600 mt-1">Live data from your account</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Delivered</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {loading ? '...' : dashboardData.deliveredShipments}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {dashboardData.totalShipments > 0 
                ? `${Math.round((dashboardData.deliveredShipments / dashboardData.totalShipments) * 100)}% success rate`
                : 'No shipments yet'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">In Transit</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {loading ? '...' : dashboardData.inTransitShipments}
            </div>
            <p className="text-xs text-purple-600 mt-1">Active shipments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">
              ${loading ? '...' : dashboardData.totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-amber-600 mt-1">Total shipping costs</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className={`hover:shadow-lg transition-all duration-300 border-2 cursor-pointer ${action.color}`} onClick={action.action}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  {action.icon}
                </div>
                <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-700">{action.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Shipments */}
        <Card className="col-span-1 lg:col-span-2 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Recent Shipments
            </CardTitle>
            <CardDescription>Your most recent shipping activity (Live Data)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dashboardData.recentShipments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentShipments.slice(0, 3).map((shipment: any, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium">{shipment.carrier || 'Unknown'} - {shipment.id?.slice(-8)}</p>
                      <p className={`text-sm ${
                        shipment.status === 'delivered' ? 'text-green-600' :
                        shipment.status === 'in_transit' ? 'text-blue-600' :
                        'text-purple-600'
                      }`}>
                        {shipment.status?.replace('_', ' ').toUpperCase() || 'Processing'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${typeof shipment.cost === 'string' ? parseFloat(shipment.cost || '0').toFixed(2) : (shipment.cost || 0).toFixed(2)}
                      </p>
                      <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No shipments yet. Create your first shipment!</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/dashboard?tab=tracking')} className="w-full">
              View All Shipments
            </Button>
          </CardFooter>
        </Card>

        {/* Analytics Summary */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Shipping Analytics
            </CardTitle>
            <CardDescription>Live performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Cost</span>
                <span className="font-semibold">
                  ${dashboardData.totalShipments > 0 ? (dashboardData.totalSpent / dashboardData.totalShipments).toFixed(2) : '0.00'}
                </span>
              </div>
              
              {dashboardData.topCarriers.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <span className="text-gray-600 text-sm">Top Carriers</span>
                    {dashboardData.topCarriers.map((carrier, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{carrier.carrier}</span>
                        <span className="font-medium">{carrier.count} shipments</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <ChartBar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Analytics available after first shipment</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/dashboard?tab=history')} className="w-full">
              View Analytics
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Ready to Ship?</h2>
        <p className="mb-6 text-blue-100">Create your first shipping label or upload multiple addresses for bulk shipping</p>
        <div className="flex justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => navigate('/create-label')}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Package className="mr-2 h-5 w-5" />
            Create Single Label
          </Button>
          <Button 
            size="lg" 
            onClick={() => navigate('/bulk-upload')}
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-blue-600"
          >
            <Upload className="mr-2 h-5 w-5" />
            Bulk Upload
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
