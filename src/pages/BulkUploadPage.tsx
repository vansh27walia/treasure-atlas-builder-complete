
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload } from 'lucide-react';
import BulkUpload from '@/components/shipping/BulkUpload';

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = React.useState("upload");
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Shipping</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger value="help">
            <FileText className="h-4 w-4 mr-2" />
            Help & Format Guide
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <BulkUpload />
        </TabsContent>
        
        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>CSV Format Guide</CardTitle>
              <CardDescription>
                Follow these guidelines to ensure your CSV file is processed correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-3 text-green-700">✓ Correct Format</h3>
                    <div className="text-xs font-mono bg-white p-2 rounded border">
                      <div>name,street1,city,state,zip,country</div>
                      <div>John Doe,123 Main St,San Francisco,CA,94105,US</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="font-semibold mb-3 text-red-700">✗ Common Errors</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Missing required columns</li>
                      <li>• Extra spaces in headers</li>
                      <li>• Special characters in addresses</li>
                      <li>• Empty rows</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Required vs Optional Fields</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-red-600 mb-2">Required Fields:</h5>
                      <ul className="space-y-1">
                        <li><code className="bg-gray-100 px-1 rounded">name</code> - Full recipient name</li>
                        <li><code className="bg-gray-100 px-1 rounded">street1</code> - Primary address</li>
                        <li><code className="bg-gray-100 px-1 rounded">city</code> - City name</li>
                        <li><code className="bg-gray-100 px-1 rounded">state</code> - State/Province</li>
                        <li><code className="bg-gray-100 px-1 rounded">zip</code> - Postal code</li>
                        <li><code className="bg-gray-100 px-1 rounded">country</code> - Country code</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-600 mb-2">Optional Fields:</h5>
                      <ul className="space-y-1">
                        <li><code className="bg-gray-100 px-1 rounded">company</code> - Company name</li>
                        <li><code className="bg-gray-100 px-1 rounded">street2</code> - Suite/Apt</li>
                        <li><code className="bg-gray-100 px-1 rounded">phone</code> - Phone number</li>
                        <li><code className="bg-gray-100 px-1 rounded">parcel_*</code> - Package details</li>
                        <li><code className="bg-gray-100 px-1 rounded">preferred_*</code> - Carrier preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUploadPage;
