
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import TrackingFilters from '@/components/tracking/TrackingFilters';
import TrackingList from '@/components/tracking/TrackingList';
import TrackingSearchBar from '@/components/tracking/TrackingSearchBar';
import { Search, Package, TrendingUp, Clock, MapPin } from 'lucide-react';

const TrackingPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTracking, setSelectedTracking] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const trackingCount = {
    all: 125,
    in_transit: 45,
    out_for_delivery: 12,
    delivered: 68
  };

  const stats = [
    { 
      label: 'Total Shipments', 
      value: '125', 
      icon: Package,
      color: 'bg-blue-500'
    },
    { 
      label: 'In Transit', 
      value: '45', 
      icon: Clock,
      color: 'bg-yellow-500'
    },
    { 
      label: 'Out for Delivery', 
      value: '12', 
      icon: MapPin,
      color: 'bg-purple-500'
    },
    { 
      label: 'Delivered', 
      value: '68', 
      icon: TrendingUp,
      color: 'bg-green-500'
    }
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Top Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
              <p className="text-gray-600">Monitor and track all your shipments in real-time</p>
            </div>
            
            <div className="flex items-center gap-4">
              <TrackingSearchBar 
                onSearch={setSearchTerm} 
                onRefresh={handleRefresh}
                isLoading={isLoading}
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                Track Package
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters and List */}
        <Card className="p-6">
          <div className="mb-6">
            <TrackingFilters
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              trackingCount={trackingCount}
            />
          </div>
          
          <TrackingList 
            trackingData={trackingData}
            isLoading={isLoading}
            selectedTracking={selectedTracking}
            setSelectedTracking={setSelectedTracking}
            setActiveFilter={setActiveFilter}
          />
        </Card>
      </div>
    </div>
  );
};

export default TrackingPage;
