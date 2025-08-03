
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Truck, 
  BarChart3, 
  Upload,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserStats {
  totalShipments: number;
  deliveredShipments: number;
  inTransitShipments: number;
  totalSpent: number;
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState<UserStats>({
    totalShipments: 0,
    deliveredShipments: 0,
    inTransitShipments: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      // Fetch shipment records
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipment_records')
        .select('status, charged_rate')
        .eq('user_id', user?.id);

      if (shipmentsError) throw shipmentsError;

      // Fetch tracking records
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_records')
        .select('status')
        .eq('user_id', user?.id);

      if (trackingError) throw trackingError;

      // Fetch payment records
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('user_id', user?.id);

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const allRecords = [...(shipments || []), ...(tracking || [])];
      const totalShipments = allRecords.length;
      
      const deliveredShipments = allRecords.filter(record => 
        record.status === 'delivered'
      ).length;
      
      const inTransitShipments = allRecords.filter(record => 
        ['in_transit', 'out_for_delivery', 'processing'].includes(record.status || '')
      ).length;
      
      const totalSpent = (payments || []).reduce((sum, payment) => 
        sum + (parseFloat(payment.amount?.toString() || '0') || 0), 0
      ) + (shipments || []).reduce((sum, shipment) => 
        sum + (parseFloat(shipment.charged_rate?.toString() || '0') || 0), 0
      );

      setUserStats({
        totalShipments,
        deliveredShipments,
        inTransitShipments,
        totalSpent
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Create Shipping Label',
      description: 'Generate single shipping labels',
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      href: '/create-label'
    },
    {
      title: 'Batch Label Creation',
      description: 'Create multiple labels at once',
      icon: Upload,
      color: 'from-green-500 to-green-600',
      href: '/bulk-upload'
    },
    {
      title: 'Track Packages',
      description: 'Track your shipments',
      icon: Truck,
      color: 'from-orange-500 to-orange-600',
      href: '/tracking'
    },
    {
      title: 'Analytics',
      description: 'View shipping analytics',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      href: '/dashboard'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to ShipEasy</h1>
            <p className="text-xl text-gray-600 mb-8">Please sign in to access your dashboard</p>
            <Button onClick={() => navigate('/auth')} size="lg">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Here's your shipping overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Shipments</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : userStats.totalShipments}
                </p>
                <p className="text-blue-100 text-sm mt-1">All time</p>
              </div>
              <Package className="w-12 h-12 text-blue-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Delivered</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : userStats.deliveredShipments}
                </p>
                <p className="text-green-100 text-sm mt-1">
                  {userStats.totalShipments > 0 
                    ? `${((userStats.deliveredShipments / userStats.totalShipments) * 100).toFixed(1)}% rate`
                    : 'No data'
                  }
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">In Transit</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : userStats.inTransitShipments}
                </p>
                <p className="text-orange-100 text-sm mt-1">Active now</p>
              </div>
              <Clock className="w-12 h-12 text-orange-200" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Spent</p>
                <p className="text-3xl font-bold mt-1">
                  {loading ? '...' : `$${userStats.totalSpent.toFixed(2)}`}
                </p>
                <p className="text-purple-100 text-sm mt-1">All time</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-200" />
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => navigate(action.href)}
              >
                <div className={`bg-gradient-to-br ${action.color} p-6 text-white`}>
                  <action.icon className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-xl font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
                <div className="p-4 bg-white">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:bg-gray-50"
                  >
                    Get Started
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity Preview */}
        {userStats.totalShipments > 0 && (
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Account Overview</h2>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <TrendingUp className="w-4 h-4 mr-1" />
                Active Account
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{userStats.totalShipments}</p>
                <p className="text-sm text-gray-600">Total Shipments Created</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {userStats.totalShipments > 0 
                    ? `${((userStats.deliveredShipments / userStats.totalShipments) * 100).toFixed(0)}%`
                    : '0%'
                  }
                </p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">${userStats.totalSpent.toFixed(2)}</p>
                <p className="text-sm text-gray-600">Total Shipping Costs</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
