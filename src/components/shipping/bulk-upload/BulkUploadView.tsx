
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, ArrowLeft, Loader2, ShoppingCart, Package, CheckCircle } from 'lucide-react';
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
  const [shopifyOrderCount, setShopifyOrderCount] = useState(0);
  
  const { 
    isProcessing, 
    results, 
    processBulkShipping,
    fetchSavedShipments 
  } = useBulkShippingProcessor();
  
  const { 
    handleUpload, 
    uploadStatus, 
    results: uploadResults 
  } = useShipmentUpload();
  
  const { addresses } = usePickupAddresses();

  // Check if we're coming from Shopify bulk shipping
  useEffect(() => {
    const savedCsvContent = sessionStorage.getItem('csvContent');
    const savedFilename = sessionStorage.getItem('csvFilename');
    const savedFromAddress = sessionStorage.getItem('fromAddress');
    const fromShopify = sessionStorage.getItem('isFromShopify') === 'true';
    const orderCount = parseInt(sessionStorage.getItem('shopifyOrderCount') || '0');
    
    if (savedCsvContent && savedFilename && fromShopify) {
      console.log('Detected Shopify bulk shipping data, starting auto-processing...');
      
      setCsvContent(savedCsvContent);
      setFilename(savedFilename);
      setIsFromShopify(true);
      setShopifyOrderCount(orderCount);
      
      // Use saved from address or default pickup address
      let pickupAddress = null;
      if (savedFromAddress) {
        pickupAddress = JSON.parse(savedFromAddress);
      } else if (addresses.length > 0) {
        pickupAddress = addresses[0];
      }
      
      setFromAddress(pickupAddress);
      
      // Auto-start the processing with EasyPost upload
      if (pickupAddress) {
        console.log('Auto-starting Shopify bulk processing with EasyPost...');
        autoStartShopifyProcessing(savedCsvContent, savedFilename, pickupAddress);
      } else {
        toast.error('No pickup address found. Please set a pickup address in settings.');
      }
    }
  }, [addresses]);

  const autoStartShopifyProcessing = async (csvContent: string, filename: string, pickupAddress: any) => {
    try {
      console.log('Starting Shopify auto-processing with EasyPost CSV...');
      
      // Show processing status
      const processingToastId = toast.loading('Processing Shopify orders and fetching live rates from EasyPost...', {
        duration: 0
      });
      
      // Create a File object from the CSV content
      const csvFile = new File([csvContent], filename, { type: 'text/csv' });
      
      // Use the existing upload logic to process the EasyPost CSV
      await handleUpload(csvFile, pickupAddress);
      
      // Update processing status
      toast.success('Shopify orders processed and rates fetched successfully!', {
        id: processingToastId
      });
      
      // Move to results view
      setShowResults(true);
      
    } catch (error) {
      console.error('Error in Shopify auto-processing:', error);
      toast.error('Failed to process Shopify orders: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
    sessionStorage.removeItem('isFromShopify');
    sessionStorage.removeItem('shopifyOrderCount');
  };

  const handleRateSelection = (shipmentId: string, rateId: string) => {
    console.log('Rate selected:', { shipmentId, rateId });
  };

  // Convert BulkUploadResult to BulkProcessingResult format for compatibility
  const convertToProcessingResult = (uploadResult: any) => {
    return {
      success: true,
      total: uploadResult.total,
      successful: uploadResult.successful,
      failed: uploadResult.failed,
      totalCost: uploadResult.totalCost,
      processedShipments: uploadResult.processedShipments.map((shipment: any) => ({
        id: shipment.id,
        shipment_data: shipment.details || shipment,
        rates: shipment.availableRates || [],
        selected_rate_id: shipment.selectedRate?.id,
        insurance_amount: shipment.insuranceAmount,
        insurance_cost: shipment.insuranceCost,
        total_cost: shipment.totalCost || 0,
        status: shipment.status === 'completed' ? 'rates_fetched' : shipment.status,
        error_message: shipment.error
      })),
      message: 'Bulk processing completed successfully'
    };
  };

  // Show results if we have them from either hook
  if (showResults || (uploadStatus === 'editing' && uploadResults)) {
    const displayResults = uploadResults ? convertToProcessingResult(uploadResults) : results;
    
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
            {isFromShopify ? `Shopify Bulk Shipping Results (${shopifyOrderCount} orders)` : 'Bulk Shipping Results'}
          </h2>
        </div>
        
        {isFromShopify && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Shopify Orders Processed Successfully!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {shopifyOrderCount} orders converted to EasyPost format and rates fetched automatically
            </p>
          </div>
        )}
        
        <BulkResults 
          results={displayResults}
          onRateChange={handleRateSelection}
        />
      </div>
    );
  }

  // Show processing screen for Shopify orders
  if (isFromShopify && (uploadStatus === 'uploading' || uploadStatus === 'creating-labels')) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Processing Shopify Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                <Package className="h-8 w-8 absolute top-4 left-1/2 transform -translate-x-1/2 text-blue-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold mb-3">🚀 Processing Your Shopify Orders</h3>
              <p className="text-gray-600 mb-6">
                Converting Shopify data to EasyPost format and fetching live shipping rates...
              </p>
              <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-800">
                    📁 Processing: {filename}
                  </p>
                  <p className="text-sm text-blue-600">
                    📦 Orders: {shopifyOrderCount} orders being processed
                  </p>
                  <p className="text-sm text-blue-600">
                    🔄 Status: Converting headers and fetching rates
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>This may take a few moments...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show regular upload interface
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
