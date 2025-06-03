import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming these paths are correct
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming these paths are correct
import { Package, Truck, ChartBar, Upload, FileArchive } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();

  // Illustrative state for API response - in a real scenario, this would be in the component
  // that actually calls the backend.
  const [exampleApiResponse, setExampleApiResponse] = useState<{ batch_archive_url: string | null } | null>(null);

  // Example function to simulate receiving an API response
  // In a real component, this would be the result of an actual fetch/axios call.
  const simulateApiResponse = () => {
    setExampleApiResponse({
      batch_archive_url: "https://your-supabase-bucket-path/example_batch_archive_timestamp.zip" // Replace with a real example if possible for testing
    });
  };
  const simulateNoArchiveResponse = () => {
    setExampleApiResponse({ batch_archive_url: null });
  };
  const clearApiResponse = () => {
    setExampleApiResponse(null);
  };

  // Quick action buttons for main shipping tasks
  const quickActions = [
    {
      title: "Create Shipping Label",
      description: "Generate a new shipping label for a package. Output provided as a ZIP archive.",
      icon: <Package className="h-6 w-6" />,
      action: () => navigate('/create-label') // This page would handle the API call and ZIP download
    },
    {
      title: "Track Packages",
      description: "View and track shipment status",
      icon: <Truck className="h-6 w-6" />,
      action: () => navigate('/dashboard?tab=tracking')
    },
    {
      title: "Bulk Shipping",
      description: "Upload CSV for multiple shipments. Download a ZIP archive with all labels.", // Updated description
      icon: <Upload className="h-6 w-6" />,
      action: () => navigate('/dashboard?tab=bulk') // This page would handle the API call and ZIP download
    },
    {
      title: "Shipping History",
      description: "View past shipments and analytics. Label sets available as ZIP archives.", // Potentially updated description
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
        {quickActions.map((actionItem, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-gray-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-md text-blue-600">
                  {actionItem.icon}
                </div>
                <CardTitle className="text-lg">{actionItem.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{actionItem.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                onClick={actionItem.action}
                className="w-full"
                variant="outline"
              >
                {actionItem.title}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Illustrative Section: How to handle the backend's ZIP archive response */}
      <Card className="mb-10 border-2 border-dashed border-amber-400 bg-amber-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileArchive className="h-6 w-6 text-amber-700" />
            <CardTitle className="text-amber-800">Example: Handling Label Generation Output</CardTitle>
          </div>
          <CardDescription className="text-amber-700">
            After your backend generates labels, it now returns a <code>batch_archive_url</code>.
            Your frontend component responsible for that action (e.g., on the Bulk Shipping or Create Label page) should provide a download link for this ZIP file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exampleApiResponse && exampleApiResponse.batch_archive_url ? (
            <div>
              <p className="font-medium text-green-700 mb-2">Labels generated successfully!</p>
              <a
                href={exampleApiResponse.batch_archive_url}
                download={`shipping_labels_${new Date().toISOString().split('T')[0]}.zip`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileArchive className="mr-2 h-5 w-5" />
                Download Label Archive (ZIP)
              </a>
              <p className="text-sm text-gray-600 mt-3">
                This ZIP file contains all individual PNG labels, the EasyPost consolidated label (if applicable),
                and a multi-page PDF of all individual labels. You will need to extract the ZIP to access these files.
              </p>
            </div>
          ) : exampleApiResponse && !exampleApiResponse.batch_archive_url ? (
            <p className="font-medium text-red-700">Label generation process simulated, but no archive URL was returned in this example.</p>
          ) : (
            <p className="text-gray-500">No label generation process simulated yet. Click buttons below to see example outputs within this illustrative section.</p>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-2"> {/* Added flex-wrap for better responsiveness of buttons */}
          <Button onClick={simulateApiResponse} variant="default" size="sm">Simulate Successful ZIP URL</Button>
          <Button onClick={simulateNoArchiveResponse} variant="outline" size="sm">Simulate No ZIP URL</Button>
          {exampleApiResponse && <Button onClick={clearApiResponse} variant="ghost" size="sm">Clear Simulation</Button>}
        </CardFooter>
      </Card>

      {/* Shipping summary and recent activity section (Original content) */}
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
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>Track</Button>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium">FedEx - EZ1000000002</p>
                  <p className="text-sm text-green-600">Delivered</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>Details</Button>
              </div>
              <div className="flex justify-between items-center p-3 border border-gray-200 rounded-md">
                <div>
                  <p className="font-medium">UPS - EZ1000000003</p>
                  <p className="text-sm text-purple-600">Out for Delivery</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=tracking')}>Track</Button>
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
