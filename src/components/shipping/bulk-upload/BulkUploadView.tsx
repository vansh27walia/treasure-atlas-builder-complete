
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkShippingProcessor } from '@/hooks/useBulkShippingProcessor';
import CSVUploader from './CSVUploader';
import BulkResults from './BulkResults';

const BulkUploadView: React.FC = () => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  
  const { 
    isProcessing, 
    results, 
    processBulkShipping,
    fetchSavedShipments 
  } = useBulkShippingProcessor();

  // Load CSV content and from address from session storage
  useEffect(() => {
    const savedCsvContent = sessionStorage.getItem('csvContent');
    const savedFilename = sessionStorage.getItem('csvFilename');
    const savedFromAddress = sessionStorage.getItem('fromAddress');
    
    if (savedCsvContent) {
      setCsvContent(savedCsvContent);
    }
    if (savedFilename) {
      setFilename(savedFilename);
    }
    if (savedFromAddress) {
      setFromAddress(JSON.parse(savedFromAddress));
    }
  }, []);

  const handleFileUpload = (content: string, name: string) => {
    setCsvContent(content);
    setFilename(name);
    setShowResults(false);
    
    // Save to session storage
    sessionStorage.setItem('csvContent', content);
    sessionStorage.setItem('csvFilename', name);
    
    toast.success('CSV file uploaded successfully');
  };

  const handleProcessBulkShipping = async () => {
    if (!csvContent) {
      toast.error('Please upload a CSV file first');
      return;
    }

    if (!fromAddress) {
      toast.error('Please set a pickup address in settings');
      return;
    }

    try {
      await processBulkShipping(csvContent, fromAddress, {
        insuranceOptions: {
          declaredValue: 100, // Default insurance value
          requireInsurance: false
        }
      });
      setShowResults(true);
    } catch (error) {
      console.error('Error processing bulk shipping:', error);
    }
  };

  const handleBack = () => {
    setShowResults(false);
    setCsvContent('');
    setFilename('');
    sessionStorage.removeItem('csvContent');
    sessionStorage.removeItem('csvFilename');
  };

  const handleRateSelection = (shipmentId: string, rateId: string) => {
    console.log('Rate selected:', { shipmentId, rateId });
    // This will be handled by the BulkResults component
  };

  if (showResults && results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Button>
          <h2 className="text-xl font-semibold">Bulk Shipping Results</h2>
        </div>
        
        <BulkResults 
          results={results}
          onRateChange={handleRateSelection}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk CSV Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CSVUploader onFileUpload={handleFileUpload} />
          
          {csvContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>File: {filename}</span>
                <span>({csvContent.split('\n').length - 1} rows)</span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">CSV Preview:</h4>
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {csvContent.split('\n').slice(0, 5).join('\n')}
                  {csvContent.split('\n').length > 5 && '\n...'}
                </pre>
              </div>
              
              <Button 
                onClick={handleProcessBulkShipping}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Shipments...
                  </>
                ) : (
                  'Process Bulk Shipping'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkUploadView;
