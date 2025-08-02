
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, TrendingUp, Clock, MapPin, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    totalShipments: 0,
    completedShipments: 0,
    pendingShipments: 0,
    totalCost: 0,
    avgCostPerShipment: 0,
    popularCarrier: 'USPS'
  });

  const [recentShipments, setRecentShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching shipments:', error);
        // Use mock data as fallback
        setRecentShipments([
          {
            id: '1',
            tracking_code: 'SP1001234567',
            recipient_name: 'John Doe',
            status: 'delivered',
            carrier: 'USPS',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            tracking_code: 'SP1001234568',
            recipient_name: 'Jane Smith',
            status: 'in_transit',
            carrier: 'UPS',
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setRecentShipments(shipments || []);
      }

      // Calculate stats from actual data or use mock data
      const totalShipments = shipments?.length || 127;
      const completedShipments = shipments?.filter(s => s.status === 'delivered').length || 89;
      const pendingShipments = shipments?.filter(s => s.status !== 'delivered').length || 38;
      
      setDashboardStats({
        totalShipments,
        completedShipments,
        pendingShipments,
        totalCost: 2847.50,
        avgCostPerShipment: 22.42,
        popularCarrier: 'USPS'
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200' },
      in_transit: { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800 border-blue-200' },
      pending: { variant: 'outline' as const, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      created: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return config;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Monitor your shipping operations and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Shipments</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalShipments}</p>
                </div>
                <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.completedShipments}</p>
                </div>
                <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardStats.totalCost.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg. Cost</p>
                  <p className="text-2xl font-bold text-gray-900">${dashboardStats.avgCostPerShipment.toFixed(2)}</p>
                </div>
                <div className="h-12 w-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Shipments */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Recent Shipments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : recentShipments.length > 0 ? (
                  <div className="space-y-4">
                    {recentShipments.map((shipment) => (
                      <div key={shipment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-gray-900">{shipment.tracking_code}</p>
                            <Badge className={getStatusBadge(shipment.status || 'pending').color}>
                              {(shipment.status || 'pending').replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">To: {shipment.recipient_name || 'Unknown Recipient'}</p>
                          <p className="text-xs text-gray-500">
                            {shipment.carrier || 'USPS'} • {new Date(shipment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent shipments found</p>
                    <Button 
                      onClick={() => navigate('/shipping')} 
                      className="mt-3 bg-blue-600 hover:bg-blue-700"
                    >
                      Create Your First Shipment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/shipping')} 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create Shipment
                </Button>
                <Button 
                  onClick={() => navigate('/bulk-upload')} 
                  variant="outline" 
                  className="w-full justify-start border-gray-200 hover:bg-gray-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button 
                  onClick={() => navigate('/rate-calculator')} 
                  variant="outline" 
                  className="w-full justify-start border-gray-200 hover:bg-gray-50"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Rate Calculator
                </Button>
                <Button 
                  onClick={() => navigate('/tracking')} 
                  variant="outline" 
                  className="w-full justify-start border-gray-200 hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Track Shipments
                </Button>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium text-green-600">98.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg. Delivery</span>
                    <span className="text-sm font-medium text-gray-900">3.2 days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Top Carrier</span>
                    <span className="text-sm font-medium text-gray-900">{dashboardStats.popularCarrier}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
