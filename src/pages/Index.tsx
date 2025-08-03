
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import UniversalShippingChatbot from '@/components/shipping/UniversalShippingChatbot';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ShipAI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The smartest way to ship your packages. Get instant rates, create labels, and track shipments all in one place.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shipments</p>
                  <p className="text-2xl font-bold text-gray-900">1,234</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">$5,678</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Cost</p>
                  <p className="text-2xl font-bold text-gray-900">$12.50</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivery Time</p>
                  <p className="text-2xl font-bold text-gray-900">2.5 days</p>
                </div>
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Create Label
              </CardTitle>
              <CardDescription>
                Ship domestic or international packages with AI-powered rate optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/create-label">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Start Shipping
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Rate Calculator
              </CardTitle>
              <CardDescription>
                Get instant shipping quotes from multiple carriers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/rate-calculator">
                <Button variant="outline" className="w-full">
                  Calculate Rates
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Bulk Upload
              </CardTitle>
              <CardDescription>
                Upload CSV files and create multiple labels at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/bulk-upload">
                <Button variant="outline" className="w-full">
                  Upload CSV
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
            <CardDescription>Your latest shipping activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Package to John Doe</p>
                  <p className="text-sm text-gray-600">Tracking: 1Z999AA1234567890</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">Delivered</p>
                  <p className="text-sm text-gray-600">$15.50</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Package to Jane Smith</p>
                  <p className="text-sm text-gray-600">Tracking: 1Z999AA0987654321</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">In Transit</p>
                  <p className="text-sm text-gray-600">$12.25</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chatbot */}
      <UniversalShippingChatbot mode="normal" />
    </div>
  );
};

export default Index;
