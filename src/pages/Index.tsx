
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
      action: () => navigate('/create-label')
    },
    {
      title: "Track Packages",
      description: "View and track shipment status",
      icon: <Truck className="h-6 w-6" />,
      action: () => navigate('/dashboard?tab=tracking')
    },
    {
      title: "Bulk Shipping",
      description: "Upload multiple shipments via CSV",
      icon: <Upload className="h-6 w-6" />,
      action: () => navigate('/dashboard?tab=bulk')
    },
    {
      title: "Shipping History",
      description: "View past shipments and analytics",
      icon: <ChartBar className="h-6 w-6" />,
      action: () => navigate('/dashboard?tab=history')
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shipping Dashboard</h1>
        <p className="text-gray-600">Welcome to ShipQuick - your complete shipping solution</p>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  {action.icon}
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{action.description}</CardDescription>
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

      {/* Shipping summary and recent activity section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border-2 border-gray-100">
          <CardHeader>
            <CardTitle>Recent Shipments</CardTitle>
            <CardDescription>Your most recent shipping activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium">USPS - EZ1000000001</p>
                  <p className="text-sm text-blue-600">In Transit</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>
                  Track
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium">FedEx - EZ1000000002</p>
                  <p className="text-sm text-green-600">Delivered</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>
                  Details
                </Button>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium">UPS - EZ1000000003</p>
                  <p className="text-sm text-purple-600">Out for Delivery</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>
                  Track
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/dashboard?tab=tracking')} className="w-full">
              View All Shipments
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-2 border-gray-100">
          <CardHeader>
            <CardTitle>Shipping Summary</CardTitle>
            <CardDescription>This month's activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Shipments</span>
                <span className="font-semibold">142</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">In Transit</span>
                <span className="font-semibold text-blue-600">14</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Delivered</span>
                <span className="font-semibold text-green-600">128</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shipping Spent</span>
                <span className="font-semibold text-amber-600">$1,256</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Saved</span>
                <span className="font-semibold text-green-600">$320</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => navigate('/dashboard?tab=history')} className="w-full">
              View Shipping Analytics
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Create new label button */}
      <div className="mt-8 flex justify-center">
        <Button 
          size="lg" 
          onClick={() => navigate('/create-label')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10"
        >
          <Package className="mr-2 h-5 w-5" />
          Create New Shipping Label
        </Button>
      </div>
    </div>
  );
};

export default Index;
