
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
      <h1 className="text-3xl font-bold mb-6">Bulk Shipping & Label Creation</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload & Create Labels
          </TabsTrigger>
          <TabsTrigger value="template">
            <FileText className="h-4 w-4 mr-2" />
            CSV Template
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <BulkUpload />
        </TabsContent>
        
        <TabsContent value="template">
          <div className="space-y-8">
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>EasyPost Integration:</strong> Download the CSV template, fill it with your shipment data, 
                then upload to automatically create shipping labels.
              </AlertDescription>
            </Alert>

            <Card className="border-2 hover:border-green-300 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  CSV Template Download
                </CardTitle>
                <CardDescription>
                  Official template for bulk shipping uploads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleDownloadEasyPostTemplate} className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUploadPage;
