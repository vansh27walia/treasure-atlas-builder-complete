
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, CheckCircle, Download, Info } from 'lucide-react';
import CompactBulkUploadView from '@/components/shipping/bulk-upload/CompactBulkUploadView';
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
    <div className="h-screen bg-gray-50">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold">Bulk Shipping</h1>
                <p className="text-gray-600 text-lg">Create multiple shipping labels efficiently</p>
              </div>
            </div>
            
            <TabsList>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </TabsTrigger>
              <TabsTrigger value="template">
                <FileText className="h-4 w-4 mr-2" />
                Template & Guide
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="upload" className="mt-0 h-full">
          <CompactBulkUploadView />
        </TabsContent>
        
        <TabsContent value="template">
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* EasyPost Integration Notice */}
              <Alert className="border-green-200 bg-green-50">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>EasyPost Integration:</strong> This template follows EasyPost's recommended CSV format for bulk shipping. 
                  Pickup addresses are selected from your saved addresses - only recipient details go in the CSV.
                </AlertDescription>
              </Alert>

              {/* Template Download */}
              <Card className="border-2 hover:border-green-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <FileText className="h-6 w-6 mr-3 text-green-600" />
                    EasyPost CSV Template
                  </CardTitle>
                  <CardDescription className="text-base">
                    Official EasyPost format for bulk shipping uploads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h4 className="font-medium text-lg mb-3">Template includes:</h4>
                      <ul className="text-base space-y-2 text-gray-700">
                        <li>• Recipient address fields (to_name, to_street1, etc.)</li>
                        <li>• Package dimensions (length, width, height)</li>
                        <li>• Weight in pounds</li>
                        <li>• Reference field for order tracking</li>
                        <li>• Sample data for testing</li>
                      </ul>
                    </div>
                    <Button onClick={handleDownloadEasyPostTemplate} className="w-full bg-green-600 hover:bg-green-700 text-lg py-6">
                      <Download className="h-5 w-5 mr-2" />
                      Download CSV Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Guide */}
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Required Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-base">
                      {[
                        { field: 'to_name', desc: 'Recipient name' },
                        { field: 'to_street1', desc: 'Street address' },
                        { field: 'to_city', desc: 'City name' },
                        { field: 'to_state', desc: 'State/Province' },
                        { field: 'to_zip', desc: 'ZIP/Postal code' },
                        { field: 'weight', desc: 'Weight (pounds)' }
                      ].map((item) => (
                        <div key={item.field} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.field}</code>
                          <span className="text-gray-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Optional Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-base">
                      {[
                        { field: 'to_street2', desc: 'Apt/Suite number' },
                        { field: 'reference', desc: 'Order/Reference #' },
                        { field: 'length', desc: 'Length (inches)' },
                        { field: 'width', desc: 'Width (inches)' },
                        { field: 'height', desc: 'Height (inches)' }
                      ].map((item) => (
                        <div key={item.field} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                          <code className="text-sm bg-blue-100 px-2 py-1 rounded">{item.field}</code>
                          <span className="text-gray-600">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-700">
                        <strong>Note:</strong> Pickup address is selected from your saved addresses. 
                        Only include recipient details in the CSV.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUploadPage;
