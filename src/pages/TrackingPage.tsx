
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Clock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TrackingDashboard from '@/components/tracking/TrackingDashboard';
import UniversalAIChatbot from '@/components/shipping/UniversalAIChatbot';

const TrackingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Truck className="h-8 w-8 text-purple-600" />
                Package Tracking
              </h1>
              <p className="text-gray-600 mt-2">
                Track your shipments across all major carriers in real-time
              </p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              <MapPin className="h-3 w-3 mr-1" />
              Real-time Updates
            </Badge>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              All carriers in one place
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Live tracking updates
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Delivery notifications
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-t-lg">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Track Your Shipments
              </CardTitle>
              <CardDescription className="text-gray-600">
                Monitor package status, delivery progress, and get notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TrackingDashboard />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Universal AI Chatbot */}
      <UniversalAIChatbot />
    </div>
  );
};

export default TrackingPage;
