import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, ChartBar, Upload, CreditCard, TrendingUp, MapPin, Clock, Users, Calculator, FileText, Plane, Container, Settings, Download, BarChart3, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
const Index: React.FC = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    inTransitShipments: 0,
    totalSpent: 0,
    recentShipments: [],
    topCarriers: [],
    thisMonthShipments: 0,
    thisMonthSpent: 0,
    avgShippingCost: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (user) {
      fetchRealDashboardData();
    } else {
      setLoading(false);
    }
  }, [user]);
  const fetchRealDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch shipments from both tables
      const [shipmentsResponse, recordsResponse] = await Promise.all([supabase.from('shipments').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      }), supabase.from('shipment_records').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      })]);
      const shipments = shipmentsResponse.data || [];
      const records = recordsResponse.data || [];

      // Combine all shipments with proper cost calculation
      const allShipments = [...shipments.map(s => ({
        ...s,
        cost: 0,
        // shipments table doesn't have cost data
        source: 'shipments'
      })), ...records.map(r => ({
        ...r,
        cost: Number(r.charged_rate) || Number(r.easypost_rate) || 0,
        source: 'records'
      }))].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate real statistics
      const totalShipments = allShipments.length;
      const deliveredShipments = allShipments.filter(s => s.status === 'delivered').length;
      const inTransitShipments = allShipments.filter(s => ['in_transit', 'created', 'pending', 'processing'].includes(s.status || '')).length;

      // Calculate real total spent from records only (they have cost data)
      const totalSpent = records.reduce((sum, record) => {
        return sum + (Number(record.charged_rate) || Number(record.easypost_rate) || 0);
      }, 0);

      // This month statistics
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthShipments = allShipments.filter(s => new Date(s.created_at) >= thisMonth).length;
      const thisMonthSpent = records.filter(r => new Date(r.created_at) >= thisMonth).reduce((sum, record) => {
        return sum + (Number(record.charged_rate) || Number(record.easypost_rate) || 0);
      }, 0);

      // Calculate average and success rate
      const avgShippingCost = records.length > 0 ? totalSpent / records.length : 0;
      const successRate = totalShipments > 0 ? deliveredShipments / totalShipments * 100 : 0;

      // Get carrier statistics
      const carrierStats: Record<string, number> = {};
      allShipments.forEach(shipment => {
        const carrier = shipment.carrier || 'Unknown';
        carrierStats[carrier] = (carrierStats[carrier] || 0) + 1;
      });
      const topCarriers = Object.entries(carrierStats).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 3).map(([carrier, count]) => ({
        carrier,
        count: count as number
      }));
      setDashboardData({
        totalShipments,
        deliveredShipments,
        inTransitShipments,
        totalSpent,
        recentShipments: allShipments.slice(0, 5),
        topCarriers,
        thisMonthShipments,
        thisMonthSpent,
        avgShippingCost,
        successRate
      });
    } catch (error) {
      console.error('Error fetching real dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadAnalytics = async () => {
    try {
      // Fetch all user data for analytics
      const [shipmentsRes, recordsRes] = await Promise.all([supabase.from('shipments').select('*').eq('user_id', user?.id), supabase.from('shipment_records').select('*').eq('user_id', user?.id)]);
      const analyticsData = {
        summary: dashboardData,
        shipments: shipmentsRes.data || [],
        shipment_records: recordsRes.data || [],
        exported_at: new Date().toISOString(),
        user_id: user?.id
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(analyticsData, null, 2);
      const dataBlob = new Blob([dataStr], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading analytics:', error);
    }
  };

  // Quick action items - enhanced with better icons and descriptions
  const quickActionItems = [{
    title: "Create Label",
    description: "Single shipping label",
    icon: <Package className="h-8 w-8" />,
    action: () => navigate('/create-label'),
    gradient: "from-blue-500 to-blue-600",
    textColor: "text-white"
  }, {
    title: "Bulk Labels",
    description: "Upload CSV for batch",
    icon: <Upload className="h-8 w-8" />,
    action: () => navigate('/bulk-upload'),
    gradient: "from-purple-500 to-purple-600",
    textColor: "text-white"
  }, {
    title: "Track Packages",
    description: "Monitor deliveries",
    icon: <Truck className="h-8 w-8" />,
    action: () => navigate('/tracking'),
    gradient: "from-orange-500 to-orange-600",
    textColor: "text-white"
  }, {
    title: "Analytics",
    description: "View performance",
    icon: <BarChart3 className="h-8 w-8" />,
    action: () => navigate('/dashboard?tab=history'),
    gradient: "from-teal-500 to-teal-600",
    textColor: "text-white"
  }];
  const freightServices = [{
    title: "LTL Shipping",
    description: "Less than truckload",
    icon: <Container className="h-6 w-6" />,
    action: () => navigate('/ltl-shipping')
  }, {
    title: "FTL Shipping",
    description: "Full truckload",
    icon: <Truck className="h-6 w-6" />,
    action: () => navigate('/ftl-shipping')
  }, {
    title: "Freight Forwarding",
    description: "International freight",
    icon: <Plane className="h-6 w-6" />,
    action: () => navigate('/freight-forwarding')
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="p-8 space-y-8">
        {/* Enhanced Header Section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
            ShipQuick Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Complete shipping management with real-time data, advanced analytics, and intelligent automation
          </p>
          {user && <div className="flex justify-center gap-4">
              <Button onClick={handleDownloadAnalytics} variant="outline" className="bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50">
                <Download className="mr-2 h-4 w-4" />
                Download Analytics
              </Button>
            </div>}
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActionItems.map((item, index) => <Card key={index} className={`hover:scale-105 transition-all duration-300 cursor-pointer border-0 shadow-xl bg-gradient-to-br ${item.gradient} hover:shadow-2xl`} onClick={item.action}>
                <CardContent className="p-8 text-center">
                  <div className={`mb-4 ${item.textColor} flex justify-center`}>
                    {item.icon}
                  </div>
                  <h3 className={`font-semibold ${item.textColor} mb-2 text-lg`}>{item.title}</h3>
                  <p className={`text-sm ${item.textColor} opacity-90`}>{item.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>

        {/* Enhanced Statistics Cards with Real Data */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Live Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Shipments</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">
                  {loading ? '...' : dashboardData.totalShipments.toLocaleString()}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {user ? `+${dashboardData.thisMonthShipments} this month` : 'Sign in to see data'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">
                  {loading ? '...' : `${dashboardData.successRate.toFixed(1)}%`}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {user ? `${dashboardData.deliveredShipments} delivered` : 'Sign in to see data'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">In Transit</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">
                  {loading ? '...' : dashboardData.inTransitShipments}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  {user ? 'Active shipments' : 'Sign in to track'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Total Spent</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">
                  ${loading ? '...' : dashboardData.totalSpent.toFixed(2)}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {user ? `$${dashboardData.thisMonthSpent.toFixed(2)} this month` : 'Sign in to see costs'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Freight Services */}
        

        {/* Enhanced Live Activity Section with Real Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Shipments */}
          <Card className="col-span-1 lg:col-span-2 border-0 shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-600 to-teal-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Recent Shipments (Live Data)
              </CardTitle>
              <CardDescription className="text-blue-100">Real-time shipping activity from your account</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!user ? <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Sign in to see your recent shipments</p>
                  <Button onClick={() => navigate('/auth')}>Sign In</Button>
                </div> : loading ? <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>)}
                </div> : dashboardData.recentShipments.length > 0 ? <div className="space-y-4">
                  {dashboardData.recentShipments.slice(0, 4).map((shipment: any, index) => <div key={index} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">
                            {shipment.carrier || 'USPS'} - {shipment.tracking_code || `TRK${shipment.id.slice(-8)}`}
                          </p>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {shipment.source}
                          </span>
                        </div>
                        <p className={`text-sm font-medium ${shipment.status === 'delivered' ? 'text-green-600' : shipment.status === 'in_transit' ? 'text-blue-600' : 'text-gray-600'}`}>
                          {shipment.status?.replace('_', ' ').toUpperCase() || 'CREATED'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {shipment.recipient_name || 'Recipient'} • {new Date(shipment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${shipment.cost ? shipment.cost.toFixed(2) : '0.00'}
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')} className="mt-1">
                          Track
                        </Button>
                      </div>
                    </div>)}
                </div> : <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No shipments yet - start shipping!</p>
                  <Button onClick={() => navigate('/create-label')}>Create First Label</Button>
                </div>}
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <Button variant="ghost" onClick={() => navigate('/dashboard?tab=tracking')} className="w-full">
                View All Shipments
              </Button>
            </CardFooter>
          </Card>

          {/* Enhanced Analytics Summary with Real Data */}
          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Summary
              </CardTitle>
              <CardDescription className="text-teal-100">Live performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!user ? <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">Sign in to view analytics</p>
                </div> : <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <span className="text-gray-700 font-medium">Avg Cost</span>
                    <span className="font-bold text-gray-900">
                      ${dashboardData.avgShippingCost.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                    <span className="text-gray-700 font-medium">This Month</span>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{dashboardData.thisMonthShipments}</p>
                      <p className="text-xs text-gray-500">${dashboardData.thisMonthSpent.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <span className="text-gray-700 font-medium text-sm">Top Carriers</span>
                    {dashboardData.topCarriers.length > 0 ? dashboardData.topCarriers.map((carrier, index) => <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="capitalize text-gray-700 font-medium">{carrier.carrier}</span>
                        <span className="font-semibold text-blue-600">{carrier.count}</span>
                      </div>) : <p className="text-gray-500 text-sm">No data available yet</p>}
                  </div>
                </div>}
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg">
              <Button variant="ghost" onClick={() => navigate('/dashboard?tab=history')} className="w-full">
                Full Analytics
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-xl p-12 text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Ship Smarter?</h2>
          <p className="mb-8 text-blue-100 text-xl max-w-2xl mx-auto">
            Experience the future of shipping with real-time analytics, AI-powered optimization, and seamless bulk processing
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <Button size="lg" onClick={() => navigate('/create-label')} className="bg-white text-blue-600 hover:bg-blue-50 shadow-xl px-8 py-4 text-lg">
              <Package className="mr-2 h-6 w-6" />
              Create Single Label
            </Button>
            <Button size="lg" onClick={() => navigate('/bulk-upload')} variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 shadow-xl px-8 py-4 text-lg">
              <Upload className="mr-2 h-6 w-6" />
              Batch Processing
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;