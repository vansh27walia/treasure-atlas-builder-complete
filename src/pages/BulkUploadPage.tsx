
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, CheckCircle, Download, Info } from 'lucide-react';
import BulkUpload from '@/components/shipping/BulkUpload';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = React.useState("upload");

  const handleDownloadBasicTemplate = () => {
    const csvContent = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight',
      'John Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16',
      'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'basic_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadEnhancedTemplate = () => {
    const csvContent = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight,preferred_carrier,preferred_service',
      'John Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16,USPS,Priority',
      'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8,UPS,Ground',
      'Bob Johnson,Global LLC,789 Pine St,,New York,NY,10001,US,5555551234,15,10,6,25,FedEx,Express'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'enhanced_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Shipping</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="template">
            <FileText className="h-4 w-4 mr-2" />
            Templates & Guide
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <BulkUpload />
        </TabsContent>
        
        <TabsContent value="template">
          <div className="space-y-8">
            {/* Blue information box */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Important:</strong> Make sure you have a pickup address saved in your settings before uploading. 
                Download one of our templates below to ensure proper formatting.
              </AlertDescription>
            </Alert>

            {/* Template Downloads */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Basic Template
                  </CardTitle>
                  <CardDescription>
                    Standard template with essential shipping fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Includes:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Recipient name and address</li>
                        <li>• Package dimensions and weight</li>
                        <li>• Live carrier rate calculation</li>
                        <li>• All required shipping fields</li>
                      </ul>
                    </div>
                    <Button onClick={handleDownloadBasicTemplate} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Basic Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-green-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Enhanced Template
                  </CardTitle>
                  <CardDescription>
                    Advanced template with carrier preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Includes:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• All basic template features</li>
                        <li>• Preferred carrier selection (USPS, UPS, FedEx, DHL)</li>
                        <li>• Service level preferences</li>
                        <li>• Better rate optimization</li>
                      </ul>
                    </div>
                    <Button onClick={handleDownloadEnhancedTemplate} className="w-full bg-green-600 hover:bg-green-700">
                      <Download className="h-4 w-4 mr-2" />
                      Download Enhanced Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step by Step Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Step-by-Step Guide
                </CardTitle>
                <CardDescription>
                  Follow these steps to successfully process your bulk shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">1</div>
                    <div>
                      <h4 className="font-medium">Set Up Pickup Address</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Go to Settings and add your pickup address. This will be used as the origin for all shipments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">2</div>
                    <div>
                      <h4 className="font-medium">Download Template</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Choose between Basic or Enhanced template based on your needs. Enhanced template allows carrier preferences.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">3</div>
                    <div>
                      <h4 className="font-medium">Fill Out Recipient Information</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Add recipient details following the template format. Required fields: name, street1, city, state, zip, country.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">4</div>
                    <div>
                      <h4 className="font-medium">Add Package Details</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Include package dimensions (length, width, height) in inches and weight in pounds for accurate rates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">5</div>
                    <div>
                      <h4 className="font-medium">Upload and Review</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload your CSV file, review the live rates, select your preferred carriers, and process payment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Field Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Field Requirements</CardTitle>
                <CardDescription>
                  Complete list of all available fields and requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3">Required Fields</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">name</span>
                        <span className="text-gray-600">Recipient name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">street1</span>
                        <span className="text-gray-600">Street address</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">city</span>
                        <span className="text-gray-600">City name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">state</span>
                        <span className="text-gray-600">State/Province</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">zip</span>
                        <span className="text-gray-600">ZIP/Postal code</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">country</span>
                        <span className="text-gray-600">Country code (US)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3">Optional Fields</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">company</span>
                        <span className="text-gray-600">Company name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">street2</span>
                        <span className="text-gray-600">Apt/Suite number</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">phone</span>
                        <span className="text-gray-600">Phone number</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">parcel_length</span>
                        <span className="text-gray-600">Length (inches)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">parcel_width</span>
                        <span className="text-gray-600">Width (inches)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">parcel_height</span>
                        <span className="text-gray-600">Height (inches)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">parcel_weight</span>
                        <span className="text-gray-600">Weight (pounds)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">preferred_carrier</span>
                        <span className="text-gray-600">USPS/UPS/FedEx/DHL</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">preferred_service</span>
                        <span className="text-gray-600">Ground/Express/Priority</span>
                      </div>
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
