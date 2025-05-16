
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import BulkUpload from '@/components/shipping/BulkUpload';
import { Button } from '@/components/ui/button';
import { CARRIER_OPTIONS } from '@/types/shipping';

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = React.useState("upload");

  const handleDownloadTemplate = () => {
    // Create headers with carrier and service choice columns
    const headers = 'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight,carrier,service';
    
    // Add sample data with carrier and service choices
    // Format: name,company,street1,street2,city,state,zip,country,phone,length,width,height,weight,carrier,service
    const sampleData = 'John Doe,ACME Inc.,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16,USPS,Priority';
    
    // Add dropdown options as comments in the CSV
    let carrierOptions = '# Available carrier options (copy and paste into the carrier column):\n';
    CARRIER_OPTIONS.forEach(carrier => {
      carrierOptions += `# ${carrier.name}\n`;
    });
    
    // Add available services as comments
    let serviceOptions = '# Available service options by carrier (copy and paste into the service column):\n';
    CARRIER_OPTIONS.forEach(carrier => {
      serviceOptions += `# ${carrier.name}: ${carrier.services.map(s => s.name).join(', ')}\n`;
    });
    
    // Add carrier dropdown options - this makes it easier for users to select carriers
    let carrierDropdownOptions = '# CARRIER DROPDOWN OPTIONS\n';
    carrierDropdownOptions += '# You can select from these carriers:\n';
    CARRIER_OPTIONS.forEach(carrier => {
      carrierDropdownOptions += `# ${carrier.name}\n`;
    });
    
    // Service dropdown options by carrier
    let serviceDropdownOptions = '# SERVICE DROPDOWN OPTIONS\n';
    serviceDropdownOptions += '# Services available by carrier:\n';
    CARRIER_OPTIONS.forEach(carrier => {
      serviceDropdownOptions += `# ${carrier.name} services:\n`;
      carrier.services.forEach(service => {
        serviceDropdownOptions += `#   - ${service.name}\n`;
      });
    });
    
    // Combine all content with instructions
    const csvContent = `${headers}\n${sampleData}\n\n${carrierOptions}\n${serviceOptions}\n${carrierDropdownOptions}\n${serviceDropdownOptions}\n# Note: If carrier or service is left blank, the system will automatically select the best option based on cost and delivery time.`;

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'shipping_template.csv');
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
            Template
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <BulkUpload />
        </TabsContent>
        
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Download Template</CardTitle>
              <CardDescription>
                Download our template file to ensure your data is formatted correctly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <FileText className="h-10 w-10 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-medium text-center mb-2">Bulk Upload Template</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Our template contains all necessary fields for processing multiple shipments at once
                  </p>
                  <Button onClick={handleDownloadTemplate} className="w-full">
                    Download Template
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Template Instructions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li><strong>Required fields:</strong> name, street1, city, state, zip, country</li>
                    <li><strong>Optional fields:</strong> company, street2, phone, parcel_length, parcel_width, parcel_height, parcel_weight</li>
                    <li><strong>Carrier options:</strong> USPS, UPS, FedEx, DHL (leave blank for best rate)</li>
                    <li><strong>Service options:</strong> Choose from available services for each carrier (listed in the template)</li>
                    <li>Format addresses according to the template example</li>
                    <li>Dimensions must be in inches (Length x Width x Height)</li>
                    <li>Weight must be in pounds</li>
                    <li>Save the file as CSV for best results</li>
                  </ul>
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
