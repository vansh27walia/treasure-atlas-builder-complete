
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

interface TrackingStatsProps {
  trackingData: any[];
}

const TrackingStats: React.FC<TrackingStatsProps> = ({ trackingData }) => {
  const stats = React.useMemo(() => {
    const total = trackingData.length;
    const delivered = trackingData.filter(item => item.status === 'delivered').length;
    const inTransit = trackingData.filter(item => item.status === 'in_transit').length;
    const pending = trackingData.filter(item => 
      item.status === 'created' || item.status === 'unknown'
    ).length;

    return { total, delivered, inTransit, pending };
  }, [trackingData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Shipments</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Delivered</p>
              <p className="text-2xl font-bold text-green-900">{stats.delivered}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">In Transit</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.inTransit}</p>
            </div>
            <Truck className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingStats;
