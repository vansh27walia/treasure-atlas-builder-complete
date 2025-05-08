
import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const BulkUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processedResults, setProcessedResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload");
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is a CSV or Excel file
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please upload a CSV or Excel file');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      // Read file contents
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        if (e.target?.result) {
          // Process the file with our serverless function
          const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
            body: {
              fileName: selectedFile.name,
              fileContent: e.target.result
            }
          });
          
          if (error) {
            throw new Error(`Error processing file: ${error.message}`);
          }
          
          // Clear interval and set upload as complete
          clearInterval(interval);
          setUploadProgress(100);
          
          setProcessedResults(data);
          toast.success('File processed successfully');
          
          // Switch to results tab
          setActiveTab("results");
        }
      };
      
      reader.onerror = () => {
        throw new Error('Error reading file');
      };
      
      // Start reading the file
      reader.readAsDataURL(selectedFile);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    // Provide a template download
    const templateUrl = '/bulk_upload_template.csv';
    const link = document.createElement('a');
    link.href = templateUrl;
    link.setAttribute('download', 'bulk_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
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
          <TabsTrigger value="results" disabled={!processedResults}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Shipping File</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with your shipping information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">Drag and drop your file here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <Input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".csv,.xlsx,.xls"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700 transition"
                  >
                    Browse files
                  </label>
                  {selectedFile && (
                    <div className="mt-4 text-left bg-gray-50 p-3 rounded">
                      <p className="font-medium">Selected file:</p>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    </div>
                  )}
                </div>
                
                {selectedFile && !isUploading && uploadProgress === 0 && (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleUpload}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload and Process
                  </Button>
                )}
                
                {uploadProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center">
                      {uploadProgress < 100 ? 'Processing...' : 'Processing complete!'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                    <li>All required fields must be filled in</li>
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
        
        <TabsContent value="results">
          {processedResults ? (
            <Card>
              <CardHeader>
                <CardTitle>Processing Results</CardTitle>
                <CardDescription>
                  Summary of your uploaded shipping data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                      <h3 className="font-medium">Successful</h3>
                      <p className="text-2xl font-bold">{processedResults?.success || 0}</p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <AlertCircle className="h-6 w-6 text-amber-600 mb-2" />
                      <h3 className="font-medium">Warnings</h3>
                      <p className="text-2xl font-bold">{processedResults?.warnings || 0}</p>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <AlertCircle className="h-6 w-6 text-red-600 mb-2" />
                      <h3 className="font-medium">Errors</h3>
                      <p className="text-2xl font-bold">{processedResults?.errors || 0}</p>
                    </div>
                  </div>
                  
                  {processedResults?.shipments && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Processed Shipments</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {processedResults.shipments.map((shipment: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{shipment.reference || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{shipment.destination || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{shipment.service || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    shipment.status === 'success' ? 'bg-green-100 text-green-800' :
                                    shipment.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {shipment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={() => setActiveTab("upload")}>
                      Upload Another File
                    </Button>
                    <Button>
                      Create Labels
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No results to display. Please upload a file first.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUploadPage;
