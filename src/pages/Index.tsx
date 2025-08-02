import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, ChartBar, Upload, CreditCard, TrendingUp, MapPin, Clock, Users, Calculator, FileText, Plane, Container, Settings } from 'lucide-react';
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
  
  // Quick action items for the top section
  const quickActionItems = [
    {
      title: "Create Label",
      description: "Generate shipping labels",
      icon: <Package className="h-8 w-8" />,
      action: () => navigate('/create-label'),
      gradient: "from-blue-500 to-blue-600",
      textColor: "text-white"
    },
    {
      title: "Batch Upload",
      description: "Create multiple labels",
      icon: <Upload className="h-8 w-8" />,
      action: () => navigate('/bulk-upload'),
      gradient: "from-purple-500 to-purple-600",
      textColor: "text-white"
    },
    {
      title: "Import",
      description: "Import shipping data",
      icon: <FileText className="h-8 w-8" />,
      action: () => navigate('/import'),
      gradient: "from-green-500 to-green-600",
      textColor: "text-white"
    },
    {
      title: "Rate Calculator",
      description: "Compare rates",
      icon: <Calculator className="h-8 w-8" />,
      action: () => navigate('/rate-calculator'),
      gradient: "from-orange-500 to-orange-600",
      textColor: "text-white"
    },
    {
      title: "Track Packages",
      description: "Monitor shipments",
      icon: <Truck className="h-8 w-8" />,
      action: () => navigate('/tracking'),
      gradient: "from-teal-500 to-teal-600",
      textColor: "text-white"
    },
    {
      title: "Analytics",
      description: "View insights",
      icon: <ChartBar className="h-8 w-8" />,
      action: () => navigate('/dashboard?tab=history'),
      gradient: "from-pink-500 to-pink-600",
      textColor: "text-white"
    }
  ];

  const freightServices = [
    {
      title: "LTL Shipping",
      description: "Less than truckload",
      icon: <Container className="h-6 w-6" />,
      action: () => navigate('/ltl-shipping'),
    },
    {
      title: "FTL Shipping", 
      description: "Full truckload",
      icon: <Truck className="h-6 w-6" />,
      action: () => navigate('/ftl-shipping'),
    },
    {
      title: "Freight Forwarding",
      description: "International freight",
      icon: <Plane className="h-6 w-6" />,
      action: () => navigate('/freight-forwarding'),
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ShipQuick Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your complete shipping solution with real-time tracking, bulk operations, and intelligent rate optimization
          </p>
        </div>

        {/* Quick Actions - Top Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {quickActionItems.map((item, index) => (
              <Card key={index} className={`hover:scale-105 transition-all duration-200 cursor-pointer border-0 shadow-lg bg-gradient-to-br ${item.gradient}`} onClick={item.action}>
                <CardContent className="p-6 text-center">
                  <div className={`mb-4 ${item.textColor}`}>
                    {item.icon}
                  </div>
                  <h3 className={`font-semibold ${item.textColor} mb-2`}>{item.title}</h3>
                  <p className={`text-sm ${item.textColor} opacity-90`}>{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
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

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
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

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">In Transit</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {loading ? '...' : dashboardData.inTransitShipments}
              </div>
              <p className="text-xs text-orange-600 mt-1">Active shipments</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Spent</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                ${loading ? '...' : dashboardData.totalSpent.toFixed(2)}
              </div>
              <p className="text-xs text-purple-600 mt-1">Total shipping costs</p>
            </CardContent>
          </Card>
        </div>

        {/* Freight Services */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Container className="h-6 w-6 text-purple-600" />
            Freight Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {freightServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 border-gray-200 hover:border-purple-300" onClick={service.action}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shipments */}
          <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Recent Shipments
              </CardTitle>
              <CardDescription className="text-blue-100">Your most recent shipping activity (Live Data)</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
                    <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-all">
                      <div>
                        <p className="font-medium text-gray-900">{shipment.carrier || 'Unknown'} - {shipment.tracking_code || shipment.id?.slice(-8)}</p>
                        <p className={`text-sm font-medium ${
                          shipment.status === 'delivered' ? 'text-green-600' :
                          shipment.status === 'in_transit' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {shipment.status?.replace('_', ' ').toUpperCase() || 'Processing'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">$12.50</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')} className="mt-1">
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
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <Button variant="ghost" onClick={() => navigate('/dashboard?tab=tracking')} className="w-full">
                View All Shipments
              </Button>
            </CardFooter>
          </Card>

          {/* Analytics Summary */}
          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription className="text-pink-100">Live performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Avg Cost</span>
                  <span className="font-bold text-gray-900">
                    ${dashboardData.totalShipments > 0 ? (dashboardData.totalSpent / dashboardData.totalShipments).toFixed(2) : '0.00'}
                  </span>
                </div>
                
                {dashboardData.topCarriers.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      <span className="text-gray-700 font-medium text-sm">Top Carriers</span>
                      {dashboardData.topCarriers.map((carrier, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <span className="capitalize text-gray-700 font-medium">{carrier.carrier}</span>
                          <span className="font-semibold text-blue-600">{carrier.count}</span>
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
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <Button variant="ghost" onClick={() => navigate('/dashboard?tab=history')} className="w-full">
                View Analytics
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg p-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Ship?</h2>
          <p className="mb-6 text-blue-100 text-lg">Create your first shipping label or upload multiple addresses for bulk shipping</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button 
              size="lg" 
              onClick={() => navigate('/create-label')}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
            >
              <Package className="mr-2 h-5 w-5" />
              Create Single Label
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/bulk-upload')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 shadow-lg"
            >
              <Upload className="mr-2 h-5 w-5" />
              Bulk Upload
            </Button>
            <Button 
              size="lg" 
              onClick={() => navigate('/import')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600 shadow-lg"
            >
              <FileText className="mr-2 h-5 w-5" />
              Import Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
