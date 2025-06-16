
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, CheckCircle, Download, Info, Star, Package } from 'lucide-react';
import BulkUpload from '@/components/shipping/BulkUpload';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BulkUploadPage = () => {
  const [activeTab, setActiveTab] = React.useState("upload");

  const handleDownloadVvapTemplate = () => {
    const csvContent = [
      'to_name,to_company,to_street1,to_street2,to_city,to_state,to_zip,to_country,to_phone,to_email,weight,length,width,height,reference',
      'John Doe,VVAP Global Solutions,123 Business Ave,Suite 200,San Francisco,CA,94105,US,555-123-4567,orders@vvapglobal.com,2.5,12,8,4,VVAP-ORDER-001',
      'Jane Smith,VVAP Enterprises,456 Commerce Blvd,,Los Angeles,CA,90210,US,555-987-6543,shipping@vvapglobal.com,1.8,10,6,3,VVAP-ORDER-002',
      'Mike Johnson,VVAP Logistics,789 Trade Center Dr,Floor 3,Chicago,IL,60601,US,555-456-7890,logistics@vvapglobal.com,3.2,14,9,5,VVAP-ORDER-003'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'vvap_global_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">VVAP Global Bulk Shipping</h1>
        <Star className="h-6 w-6 text-yellow-500" />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload & Process
          </TabsTrigger>
          <TabsTrigger value="template">
            <FileText className="h-4 w-4 mr-2" />
            VVAP Global Templates & Guide
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <BulkUpload />
        </TabsContent>
        
        <TabsContent value="template">
          <div className="space-y-8">
            {/* VVAP Global Integration Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <Package className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>VVAP Global Professional Integration:</strong> Our templates are optimized for enterprise-level shipping operations with EasyPost API integration. 
                Professional order management with automated pickup address selection and real-time rate comparison across all major carriers.
              </AlertDescription>
            </Alert>

            {/* VVAP Global Professional Template */}
            <Card className="border-2 hover:border-blue-300 transition-colors bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="h-6 w-6 mr-3 text-blue-600" />
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  VVAP Global Professional CSV Template
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Enterprise-grade template with VVAP Global branding and best practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold mb-3 text-blue-800">🚀 Professional Features:</h4>
                      <ul className="text-sm space-y-2">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Complete recipient details (company + personal)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Package dimensions (length, width, height)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Weight in pounds for accurate pricing</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Professional reference tracking system</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Direct EasyPost API compatibility</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>Sample data from VVAP Global entities</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h5 className="font-medium text-green-800 mb-2">💼 VVAP Global Entities:</h5>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>• VVAP Global Solutions (Main Office)</p>
                        <p>• VVAP Enterprises (West Coast)</p>
                        <p>• VVAP Logistics (Distribution Hub)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2">📦 Template Sample Data:</h5>
                      <div className="text-xs font-mono bg-gray-50 p-3 rounded border overflow-x-auto">
                        <div className="whitespace-nowrap">
                          <strong>Company:</strong> VVAP Global Solutions<br/>
                          <strong>Address:</strong> 123 Business Ave, Suite 200<br/>
                          <strong>Reference:</strong> VVAP-ORDER-001<br/>
                          <strong>Contact:</strong> orders@vvapglobal.com
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleDownloadVvapTemplate} 
                      className="w-full bg-blue-600 hover:bg-blue-700 h-12"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Download VVAP Global Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VVAP Global Professional Workflow Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  VVAP Global Professional Shipping Workflow
                </CardTitle>
                <CardDescription>
                  Follow our enterprise-grade process for optimal shipping operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Configure VVAP Global Pickup Addresses</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Setup your pickup/from addresses in Settings. Configure multiple VVAP Global locations for optimal shipping efficiency.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Prepare Professional CSV Data</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Use our VVAP Global template or upload any CSV format. Our AI will intelligently map headers to ensure compatibility.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Enterprise Rate Comparison</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        System fetches live rates from UPS, USPS, FedEx, and DHL through EasyPost API. Compare pricing with professional-grade inflated vs. actual rate display.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">4</div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Bulk Carrier Management</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Apply carrier preferences across all shipments with professional service-level selections. Filter and sort for optimal decision making.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">5</div>
                    <div>
                      <h4 className="font-semibold text-blue-800">Professional Label Generation</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Generate professional shipping labels with VVAP Global branding. Batch download capabilities with multiple format options.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VVAP Global CSV Field Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>VVAP Global CSV Field Specifications</CardTitle>
                <CardDescription>
                  Professional field requirements for enterprise shipping operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3">Required Enterprise Fields</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_name</span>
                        <span className="text-gray-600">Recipient full name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_street1</span>
                        <span className="text-gray-600">Primary street address</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_city</span>
                        <span className="text-gray-600">Destination city</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_state</span>
                        <span className="text-gray-600">State/Province code</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_zip</span>
                        <span className="text-gray-600">ZIP/Postal code</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_country</span>
                        <span className="text-gray-600">Country code (US)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">weight</span>
                        <span className="text-gray-600">Package weight (lbs)</span>
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
                    <h4 className="font-semibold text-blue-600 mb-3">Professional Optional Fields</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_company</span>
                        <span className="text-gray-600">Business name</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_street2</span>
                        <span className="text-gray-600">Suite/Apt number</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_phone</span>
                        <span className="text-gray-600">Contact phone</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">to_email</span>
                        <span className="text-gray-600">Email address</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="font-medium">reference</span>
                        <span className="text-gray-600">Order/Tracking ref</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2">🏢 VVAP Global Note:</h5>
                      <p className="text-sm text-blue-700">
                        Pickup addresses are managed through your VVAP Global Settings. 
                        CSV files contain only recipient information for streamlined processing.
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
