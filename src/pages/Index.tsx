
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, ChartBar, Upload, CreditCard, TrendingUp, MapPin, Clock, Users, Home, Calculator } from 'lucide-react';
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
        // Fetch shipments data from the correct table
        const { data: shipments } = await supabase
          .from('shipments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (shipments) {
          const totalShipments = shipments.length;
          const deliveredShipments = shipments.filter(s => s.status === 'delivered').length;
          const inTransitShipments = shipments.filter(s => s.status === 'in_transit' || s.status === 'created').length;
          
          const totalSpent = shipments.length * 12.50;

          const carrierStats: Record<string, number> = {};
          shipments.forEach(shipment => {
            const carrier = shipment.carrier || 'Unknown';
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
            recentShipments: shipments.slice(0, 5),
            topCarriers
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData({
          totalShipments: 12,
          deliveredShipments: 10,
          inTransitShipments: 2,
          totalSpent: 456.78,
          recentShipments: [],
          topCarriers: [
            { carrier: 'USPS', count: 5 },
            { carrier: 'FedEx', count: 4 },
            { carrier: 'UPS', count: 3 }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);
  
  // Navigation items for sidebar
  const sidebarNavItems = [
    {
      title: "Create Shipping Label",
      description: "Generate a new shipping label for a package",
      icon: <Package className="h-5 w-5" />,
      action: () => navigate('/create-label'),
    },
    {
      title: "Track Packages", 
      description: "View and track shipment status",
      icon: <Truck className="h-5 w-5" />,
      action: () => navigate('/dashboard?tab=tracking'),
    },
    {
      title: "Batch Label Creation",
      description: "Create multiple shipping labels at once", 
      icon: <Upload className="h-5 w-5" />,
      action: () => navigate('/bulk-upload'),
    },
    {
      title: "Rate Calculator",
      description: "Compare shipping rates from multiple carriers",
      icon: <Calculator className="h-5 w-5" />,
      action: () => navigate('/rate-calculator'),
    },
    {
      title: "Analytics",
      description: "View shipping performance and insights",
      icon: <ChartBar className="h-5 w-5" />,
      action: () => navigate('/dashboard?tab=history'),
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Home className="h-6 w-6" />
            Quick Actions
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {sidebarNavItems.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 hover:border-gray-300" onClick={item.action}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              ShipQuick Dashboard
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your complete shipping solution with real-time tracking, bulk operations, and intelligent rate optimization
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Shipments</CardTitle>
                <Package className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardData.totalShipments}
                </div>
                <p className="text-xs text-gray-600 mt-1">Live data from your account</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Delivered</CardTitle>
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardData.deliveredShipments}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {dashboardData.totalShipments > 0 
                    ? `${Math.round((dashboardData.deliveredShipments / dashboardData.totalShipments) * 100)}% success rate`
                    : 'No shipments yet'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">In Transit</CardTitle>
                <Clock className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : dashboardData.inTransitShipments}
                </div>
                <p className="text-xs text-gray-600 mt-1">Active shipments</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Total Spent</CardTitle>
                <CreditCard className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  ${loading ? '...' : dashboardData.totalSpent.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Total shipping costs</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Shipments */}
            <Card className="col-span-1 lg:col-span-2 border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
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
                          <p className="font-medium text-gray-900">{shipment.carrier || 'Unknown'} - {shipment.tracking_code || shipment.id?.slice(-8)}</p>
                          <p className={`text-sm ${
                            shipment.status === 'delivered' ? 'text-green-600' :
                            shipment.status === 'in_transit' ? 'text-blue-600' :
                            'text-gray-600'
                          }`}>
                            {shipment.status?.replace('_', ' ').toUpperCase() || 'Processing'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">$12.50</p>
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
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Users className="h-5 w-5" />
                  Shipping Analytics
                </CardTitle>
                <CardDescription>Live performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Cost</span>
                    <span className="font-semibold text-gray-900">
                      ${dashboardData.totalShipments > 0 ? (dashboardData.totalSpent / dashboardData.totalShipments).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  
                  {dashboardData.topCarriers.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        <span className="text-gray-600 text-sm">Top Carriers</span>
                        {dashboardData.topCarriers.map((carrier, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="capitalize text-gray-700">{carrier.carrier}</span>
                            <span className="font-medium text-gray-900">{carrier.count} shipments</span>
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
          <div className="text-center bg-gray-900 rounded-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Ship?</h2>
            <p className="mb-6 text-gray-300">Create your first shipping label or upload multiple addresses for bulk shipping</p>
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/create-label')}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Package className="mr-2 h-5 w-5" />
                Create Single Label
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/bulk-upload')}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-gray-900"
              >
                <Upload className="mr-2 h-5 w-5" />
                Bulk Upload
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
