
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, CheckCircle, Download, Info } from 'lucide-react';
import BulkUpload from '@/components/shipping/BulkUpload';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = React.useState("upload");

  const handleDownloadEasyPostTemplate = () => {
    const csvContent = [
      'to_name,to_street1,to_street2,to_city,to_state,to_zip,to_country,weight,length,width,height,reference',
      'John Doe,123 Main St,,San Francisco,CA,94105,US,1.5,12,8,4,Order #1234',
      'Jane Smith,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,2.0,10,6,3,Order #1235',
      'Bob Johnson,789 Pine St,,New York,NY,10001,US,3.0,15,10,6,Order #1236'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'easypost_bulk_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">EasyPost Bulk Shipping</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="template">
            <FileText className="h-4 w-4 mr-2" />
            EasyPost Template & Guide
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <BulkUpload />
        </TabsContent>
        
        <TabsContent value="template">
          <div className="space-y-8">
            {/* EasyPost Integration Notice */}
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>EasyPost Integration:</strong> This template follows EasyPost's recommended CSV format for bulk shipping. 
                Pickup addresses are selected from your saved addresses - only recipient details go in the CSV.
              </AlertDescription>
            </Alert>

            {/* EasyPost Template Download */}
            <Card className="border-2 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  EasyPost CSV Template
                </CardTitle>
                <CardDescription>
                  Official EasyPost format for bulk shipping uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Includes:</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Recipient address (to_address) fields</li>
                      <li>• Package dimensions (length, width, height)</li>
                      <li>• Weight in pounds</li>
                      <li>• Reference field for order tracking</li>
                      <li>• EasyPost API compatibility</li>
                    </ul>
                  </div>
                  <Button onClick={handleDownloadEasyPostTemplate} className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download EasyPost Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* EasyPost Workflow Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  EasyPost Bulk Shipping Workflow
                </CardTitle>
                <CardDescription>
                  Follow EasyPost's recommended API workflow for optimal results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">1</div>
                    <div>
                      <h4 className="font-medium">Setup Pickup Address</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Save your pickup/from address in Settings. This will be used for all shipments in the batch.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">2</div>
                    <div>
                      <h4 className="font-medium">Prepare CSV Data</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Use our EasyPost template. Include only recipient addresses - pickup address comes from your settings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">3</div>
                    <div>
                      <h4 className="font-medium">Create Shipments & Fetch Rates</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        System creates EasyPost shipments and fetches live rates from multiple carriers (UPS, USPS, FedEx, DHL).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">4</div>
                    <div>
                      <h4 className="font-medium">Select Carriers & Services</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Review and select preferred carriers/services for each shipment. Change rates dynamically as needed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">5</div>
                    <div>
                      <h4 className="font-medium">Purchase & Generate Labels</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Confirm selections and purchase labels via EasyPost. Download labels individually or as a batch.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EasyPost CSV Field Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>EasyPost CSV Field Requirements</CardTitle>
                <CardDescription>
                  Required and optional fields following EasyPost's format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">Required Fields</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_name</span>
                        <span className="text-gray-600">Recipient name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_street1</span>
                        <span className="text-gray-600">Street address</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_city</span>
                        <span className="text-gray-600">City name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_state</span>
                        <span className="text-gray-600">State/Province</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_zip</span>
                        <span className="text-gray-600">ZIP/Postal code</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_country</span>
                        <span className="text-gray-600">Country (US)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">weight</span>
                        <span className="text-gray-600">Weight (pounds)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">length</span>
                        <span className="text-gray-600">Length (inches)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">width</span>
                        <span className="text-gray-600">Width (inches)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">height</span>
                        <span className="text-gray-600">Height (inches)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3">Optional Fields</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_street2</span>
                        <span className="text-gray-600">Apt/Suite number</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">reference</span>
                        <span className="text-gray-600">Order/Reference #</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Note:</h5>
                      <p className="text-sm text-blue-700">
                        Pickup address (from_address) is selected from your saved addresses in Settings. 
                        Do not include pickup details in the CSV file.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUploadPage;
