
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Download, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkUploadView from '@/components/shipping/bulk-upload/BulkUploadView';
import { useAuth } from '@/contexts/AuthContext';

const BulkUploadPage = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [shopifyData, setShopifyData] = useState<string | null>(null);
  const [shopifyOrderCount, setShopifyOrderCount] = useState<number>(0);

  useEffect(() => {
    // Check if we have Shopify data from the import page
    const shopifyCSV = sessionStorage.getItem('shopify_csv_data');
    const orderCount = sessionStorage.getItem('shopify_order_count');
    
    if (shopifyCSV) {
      setShopifyData(shopifyCSV);
      setShopifyOrderCount(parseInt(orderCount || '0'));
      setShowResults(true);
      
      // Clear the session storage
      sessionStorage.removeItem('shopify_csv_data');
      sessionStorage.removeItem('shopify_order_count');
      
      toast.success(`Loaded ${orderCount} Shopify orders for bulk processing`);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Store the CSV content in session storage for the BulkUploadView to access
        sessionStorage.setItem('uploaded_csv_data', content);
        sessionStorage.setItem('uploaded_filename', selectedFile.name);
        setShowResults(true);
      };
      reader.readAsText(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'to_name',
      'to_company',
      'to_street1',
      'to_street2',
      'to_city',
      'to_state',
      'to_zip',
      'to_country',
      'to_phone',
      'to_email',
      'weight',
      'length',
      'width',
      'height',
      'reference'
    ];
    
    const sampleData = [
      'John Doe',
      'ABC Company',
      '123 Main St',
      'Apt 4B',
      'New York',
      'NY',
      '10001',
      'US',
      '555-123-4567',
      'john@example.com',
      '2.5',
      '12',
      '8',
      '6',
      'Order #1001'
    ];
    
    const csvContent = [
      templateHeaders.join(','),
      sampleData.map(field => `"${field}"`).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shipping_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to use bulk upload functionality.</p>
          <Button onClick={() => window.location.href = '/auth'} className="w-full">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (showResults) {
    return (
      <BulkUploadView />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Upload</h1>
          <p className="text-gray-600">Upload a CSV file to create multiple shipping labels at once</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="p-8">
            <div className="text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload CSV File</h3>
              <p className="text-gray-600 mb-6">Choose a CSV file with your shipping data</p>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <FileText className="w-10 h-10 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to select a CSV file
                    </span>
                  </label>
                </div>
                
                {file && (
                  <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                    <strong>Selected file:</strong> {file.name}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Template Section */}
          <Card className="p-8">
            <div className="text-center">
              <Download className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Download Template</h3>
              <p className="text-gray-600 mb-6">Get the correct CSV format for bulk shipping</p>
              
              <Button onClick={downloadTemplate} className="w-full mb-4">
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
              
              <div className="text-left space-y-2">
                <h4 className="font-medium text-gray-900">Required Fields:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• to_name - Recipient name</div>
                  <div>• to_street1 - Street address</div>
                  <div>• to_city - City</div>
                  <div>• to_state - State/Province</div>
                  <div>• to_zip - Postal code</div>
                  <div>• to_country - Country (US, CA, etc.)</div>
                  <div>• weight - Package weight (lbs)</div>
                  <div>• length - Package length (inches)</div>
                  <div>• width - Package width (inches)</div>
                  <div>• height - Package height (inches)</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="p-6 mt-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tips for bulk upload:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ensure your CSV file follows the template format exactly</li>
                <li>• All address fields should be complete and valid</li>
                <li>• Weight should be in pounds, dimensions in inches</li>
                <li>• Use country codes (US, CA, GB, etc.) for international shipping</li>
                <li>• Maximum 1000 shipments per upload</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BulkUploadPage;
