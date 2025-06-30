
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, ChartBar, Upload, CreditCard } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Quick action buttons for main shipping tasks
  const quickActions = [
    {
      title: "Create Shipping Label",
      description: "Generate a new shipping label for a package",
      icon: <Package className="h-6 w-6" />,
      action: () => navigate('/shipping')
    },
    {
      title: "Track Packages",
      description: "View and track shipment status",
      icon: <Truck className="h-6 w-6" />,
      action: () => navigate('/dashboard')
    },
    {
      title: "Bulk Shipping",
      description: "Upload multiple shipments via CSV",
      icon: <Upload className="h-6 w-6" />,
      action: () => navigate('/bulk-upload')
    },
    {
      title: "Shipping Analytics",
      description: "View shipping history and analytics",
      icon: <ChartBar className="h-6 w-6" />,
      action: () => navigate('/analytics')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ShipQuick</h1>
              <p className="text-gray-600">Your complete shipping solution</p>
            </div>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Streamline Your Shipping Process
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create labels, track packages, manage bulk shipments, and analyze your shipping data all in one place.
          </p>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                    {action.icon}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {action.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={action.action}
                  className="w-full"
                  variant="outline"
                >
                  {action.title}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <Card className="border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="text-2xl">Recent Activity</CardTitle>
              <CardDescription>Sample shipping activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">USPS Priority Mail</p>
                    <p className="text-sm text-blue-600">In Transit</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Track
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">FedEx Ground</p>
                    <p className="text-sm text-green-600">Delivered</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">UPS Next Day</p>
                    <p className="text-sm text-purple-600">Out for Delivery</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Track
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                View All Shipments
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-2 border-gray-100">
            <CardHeader>
              <CardTitle className="text-2xl">Shipping Summary</CardTitle>
              <CardDescription>This month's overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Shipments</span>
                  <span className="text-2xl font-bold">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">In Transit</span>
                  <span className="text-xl font-semibold text-blue-600">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivered</span>
                  <span className="text-xl font-semibold text-green-600">138</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Spent</span>
                  <span className="text-xl font-semibold text-amber-600">$1,428</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Savings</span>
                  <span className="text-xl font-semibold text-green-600">$356</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/analytics')}>
                View Analytics
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/shipping')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg"
          >
            <Package className="mr-3 h-6 w-6" />
            Start Shipping Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
