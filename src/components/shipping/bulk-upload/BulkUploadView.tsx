
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkShippingProcessor } from '@/hooks/useBulkShippingProcessor';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import CSVUploader from './CSVUploader';
import BulkResults from './BulkResults';

const BulkUploadView: React.FC = () => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isFromShopify, setIsFromShopify] = useState(false);
  
  const { 
    isProcessing, 
    results, 
    processBulkShipping,
    fetchSavedShipments 
  } = useBulkShippingProcessor();
  
  const { handleUpload } = useShipmentUpload();
  const { addresses } = usePickupAddresses();

  // Check if we're coming from Shopify bulk shipping and auto-start the process
  useEffect(() => {
    const savedCsvContent = sessionStorage.getItem('csvContent');
    const savedFilename = sessionStorage.getItem('csvFilename');
    const savedFromAddress = sessionStorage.getItem('fromAddress');
    
    if (savedCsvContent && savedFilename) {
      console.log('Found CSV content from Shopify, auto-starting upload process...');
      
      setCsvContent(savedCsvContent);
      setFilename(savedFilename);
      setIsFromShopify(true);
      
      // Use saved from address or default pickup address
      let pickupAddress = null;
      if (savedFromAddress) {
        pickupAddress = JSON.parse(savedFromAddress);
      } else if (addresses.length > 0) {
        pickupAddress = addresses[0];
      }
      
      setFromAddress(pickupAddress);
      
      // Auto-start the upload process
      if (pickupAddress) {
        console.log('Auto-starting bulk upload process with pickup address:', pickupAddress);
        autoStartUpload(savedCsvContent, savedFilename, pickupAddress);
      } else {
        toast.error('No pickup address found. Please set a pickup address in settings.');
      }
    }
  }, [addresses]);

  const autoStartUpload = async (csvContent: string, filename: string, pickupAddress: any) => {
    try {
      console.log('Starting auto-upload process...');
      
      // Create a File object from the CSV content
      const csvFile = new File([csvContent], filename, { type: 'text/csv' });
      
      // Use the existing upload logic from useShipmentUpload
      await handleUpload(csvFile, pickupAddress);
      
      toast.success('Shopify orders processed successfully! Fetching rates...');
      
    } catch (error) {
      console.error('Error in auto-upload:', error);
      toast.error('Failed to process Shopify orders');
    }
  };

  const handleFileUpload = (content: string, name: string) => {
    setCsvContent(content);
    setFilename(name);
    setShowResults(false);
    setIsFromShopify(false);
    
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
          declaredValue: 100,
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
    setIsFromShopify(false);
    setCsvContent('');
    setFilename('');
    sessionStorage.removeItem('csvContent');
    sessionStorage.removeItem('csvFilename');
    sessionStorage.removeItem('fromAddress');
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
          <h2 className="text-xl font-semibold">
            {isFromShopify ? 'Shopify Bulk Shipping Results' : 'Bulk Shipping Results'}
          </h2>
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
            {isFromShopify ? (
              <>
                <ShoppingCart className="h-5 w-5" />
                Shopify Bulk Processing
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Bulk CSV Upload
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFromShopify ? (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">Processing Shopify Orders</h3>
                <p className="text-gray-600">
                  Converting Shopify data to EasyPost format and fetching rates...
                </p>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkUploadView;
