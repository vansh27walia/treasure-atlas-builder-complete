
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, DollarSign, TrendingUp, MapPin, Clock, Users, Plus, ArrowRight, BarChart3, Target, Zap, Shield, Globe2, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';

interface ShippingStats {
  totalShipments: number;
  totalSpent: number;
  averageCost: number;
  recentShipments: Array<{
    id: string;
    tracking_code: string;
    carrier: string;
    cost: number;
    status: string;
    created_at: string;
  }>;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ShippingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      setIsLoading(true);
      try {
        const userId = user?.id;
        if (!userId) {
          console.error("User ID is missing.");
          return;
        }

        const { data: shipments, error: shipmentsError } = await supabase
          .from('shipments')
          .select('*')
          .eq('user_id', userId);

        if (shipmentsError) {
          console.error("Error fetching shipments:", shipmentsError);
          return;
        }

        const { data: shipmentRecords, error: recordsError } = await supabase
          .from('shipment_records')
          .select('*')
          .eq('user_id', userId);

        if (recordsError) {
          console.error("Error fetching shipment records:", recordsError);
          return;
        }

        // Process shipments and shipment_records separately
        const processedShipments = (shipments || []).map(shipment => ({
          id: shipment.id?.toString() || 'unknown',
          tracking_code: shipment.tracking_code || 'N/A',
          carrier: shipment.carrier || 'Unknown',
          cost: 0, // shipments table doesn't have cost data
          status: shipment.status || 'created',
          created_at: shipment.created_at,
          source: 'shipments' as const
        }));

        const processedRecords = (shipmentRecords || []).map(record => ({
          id: record.id?.toString() || 'unknown',
          tracking_code: record.tracking_code || 'N/A',
          carrier: record.carrier || 'Unknown',
          cost: record.charged_rate || record.easypost_rate || 0,
          status: record.status || 'created',
          created_at: record.created_at,
          source: 'shipment_records' as const
        }));

        // Combine both datasets
        const allShipments = [...processedShipments, ...processedRecords];

        const totalShipments = allShipments.length;
        const totalSpent = processedRecords.reduce((sum, record) => sum + record.cost, 0);
        const averageCost = totalShipments > 0 ? totalSpent / totalShipments : 0;

        // Fetch recent shipments (last 5)
        const recentShipments = allShipments
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(shipment => ({
            id: shipment.id,
            tracking_code: shipment.tracking_code,
            carrier: shipment.carrier,
            cost: shipment.cost,
            status: shipment.status,
            created_at: shipment.created_at
          }));

        setStats({
          totalShipments,
          totalSpent,
          averageCost,
          recentShipments
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUserStats();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'created':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Ship Smarter with <span className="text-yellow-300">AI-Powered</span> Logistics
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Compare rates from 100+ carriers, create labels instantly, and track shipments with real-time AI insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                onClick={() => navigate('/create-label')}
              >
                <Package className="mr-2 h-5 w-5" />
                Create Shipping Label
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate('/rate-calculator')}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Compare Rates
              </Button>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-400 rounded-full opacity-10 animate-bounce"></div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="container mx-auto px-4 py-12 -mt-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Shipments</CardTitle>
                <Package className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalShipments}</div>
                <p className="text-xs text-gray-500 mt-1">Your shipping volume</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Spent</CardTitle>
                <DollarSign className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">${stats.totalSpent.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Lifetime shipping costs</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Average Cost</CardTitle>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">${stats.averageCost.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">Per shipment</p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:shadow-2xl transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Tracking</CardTitle>
                <Truck className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.recentShipments.filter(s => s.status === 'in_transit').length}
                </div>
                <p className="text-xs text-gray-500 mt-1">In transit</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Shipments */}
      {stats && stats.recentShipments.length > 0 && (
        <div className="container mx-auto px-4 py-12">
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">Recent Shipments</CardTitle>
                  <CardDescription className="text-gray-600">Your latest shipping activity</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/tracking')}
                  className="hover:bg-blue-50"
                >
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentShipments.slice(0, 5).map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{shipment.tracking_code}</div>
                        <div className="text-sm text-gray-600">{shipment.carrier}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${shipment.cost.toFixed(2)}</div>
                      <Badge className={getStatusColor(shipment.status)}>
                        {shipment.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Ship Successfully
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From rate comparison to label creation, tracking, and analytics - we've got your shipping covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature Cards */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/create-label')}>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Smart Label Creation</CardTitle>
              <CardDescription className="text-gray-600">
                Create shipping labels with AI-powered rate recommendations and real-time carrier comparison.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/bulk-upload')}>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Bulk Processing</CardTitle>
              <CardDescription className="text-gray-600">
                Upload CSV files and process hundreds of shipments at once with intelligent rate optimization.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/tracking')}>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Real-Time Tracking</CardTitle>
              <CardDescription className="text-gray-600">
                Monitor all your shipments with live updates, delivery predictions, and exception alerts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/settings')}>
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Advanced Analytics</CardTitle>
              <CardDescription className="text-gray-600">
                Get deep insights into your shipping patterns, costs, and performance with AI-powered analytics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/freight-forwarding')}>
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <Globe2 className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Global Freight</CardTitle>
              <CardDescription className="text-gray-600">
                Handle international shipments with customs documentation, freight forwarding, and compliance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/rate-calculator')}>
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Rate Calculator</CardTitle>
              <CardDescription className="text-gray-600">
                Compare rates from 100+ carriers instantly with our smart rate calculation engine.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Shipping?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of businesses who trust us with their logistics needs.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            onClick={() => navigate('/create-label')}
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Shipping Now
          </Button>
        </div>
      </div>

      {/* ShipAI Chatbot */}
      <ShipAIChatbot onClose={() => {}} />
    </div>
  );
};

export default Index;
