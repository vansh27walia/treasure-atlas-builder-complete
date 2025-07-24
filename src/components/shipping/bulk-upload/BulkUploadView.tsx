
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowLeft, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkShippingProcessor } from '@/hooks/useBulkShippingProcessor';
import { useLocation } from 'react-router-dom';
import CSVUploader from './CSVUploader';
import BulkResults from './BulkResults';

const BulkUploadView: React.FC = () => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [isShopifyMode, setIsShopifyMode] = useState(false);
  
  const location = useLocation();
  const { 
    isProcessing, 
    results, 
    processBulkShipping,
    fetchSavedShipments 
  } = useBulkShippingProcessor();

  // Check if we're coming from Shopify bulk shipping
  useEffect(() => {
    const bulkShippingResults = location.state?.bulkShippingResults;
    const mode = location.state?.mode;
    
    if (bulkShippingResults && mode === 'shopify-bulk') {
      setIsShopifyMode(true);
      setShowResults(true);
      
      // Convert Shopify results to our format
      const convertedResults = {
        success: true,
        total: bulkShippingResults.summary.total,
        successful: bulkShippingResults.summary.successful,
        failed: bulkShippingResults.summary.failed,
        totalCost: bulkShippingResults.processed.reduce((sum: number, item: any) => sum + item.selectedRate.rate, 0),
        processedShipments: bulkShippingResults.processed.map((item: any) => ({
          id: item.shipmentId,
          shipment_data: item.toAddress,
          rates: [{
            id: item.selectedRate.id,
            carrier: item.selectedRate.carrier,
            service: item.selectedRate.service,
            rate: item.selectedRate.rate.toString(),
            currency: 'USD',
            delivery_days: 3,
            delivery_date: null,
            shipment_id: item.shipmentId
          }],
          selected_rate_id: item.selectedRate.id,
          total_cost: item.selectedRate.rate,
          status: 'rates_fetched'
        })),
        message: `Processed ${bulkShippingResults.summary.successful} Shopify orders successfully`
      };
      
      // Set the converted results (this would normally come from useBulkShippingProcessor)
      // For now, we'll just show the success message
      toast.success(convertedResults.message);
    }
  }, [location.state]);

  // Load CSV content and from address from session storage
  useEffect(() => {
    if (!isShopifyMode) {
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
    }
  }, [isShopifyMode]);

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
    setIsShopifyMode(false);
    setCsvContent('');
    setFilename('');
    sessionStorage.removeItem('csvContent');
    sessionStorage.removeItem('csvFilename');
  };

  const handleRateSelection = (shipmentId: string, rateId: string) => {
    console.log('Rate selected:', { shipmentId, rateId });
    // This will be handled by the BulkResults component
  };

  if (showResults && (results || isShopifyMode)) {
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
            {isShopifyMode ? 'Shopify Bulk Shipping Results' : 'Bulk Shipping Results'}
          </h2>
        </div>
        
        {isShopifyMode ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopify Orders Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="text-green-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Orders Ready for Label Creation</h3>
                <p className="text-gray-600 mb-4">
                  Your Shopify orders have been processed and are ready for batch label creation.
                </p>
                <Button onClick={() => toast.success('Batch label creation coming soon!')}>
                  Create Batch Labels
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <BulkResults 
            results={results}
            onRateChange={handleRateSelection}
          />
        )}
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
