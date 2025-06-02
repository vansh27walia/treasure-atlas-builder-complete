
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import EnhancedSuccessNotification from './bulk-upload/EnhancedSuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import LabelOptionsModal from './bulk-upload/LabelOptionsModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, ChevronRight, AlertCircle } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [currentBatchLabelUrl, setCurrentBatchLabelUrl] = useState<string | null>(null);
  
  console.log('BulkUpload component rendering');
  
  const {
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    showLabelOptions,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress,
    handleUpload,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    setShowLabelOptions,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  console.log('BulkUpload hook data:', {
    uploadStatus,
    results: results ? { ...results, processedShipments: results.processedShipments?.length } : null,
    isCreatingLabels,
    currentBatchId,
    currentBatchLabelUrl
  });

  // Generate batch ID when labels are created successfully
  useEffect(() => {
    console.log('BulkUpload useEffect - checking for batch info:', {
      uploadStatus,
      resultsLength: results?.processedShipments?.length,
      currentBatchId
    });
    
    if (uploadStatus === 'success' && results && results.processedShipments && results.processedShipments.length > 0) {
      // Check if batch info is already available from the results
      const firstShipment = results.processedShipments[0];
      if (firstShipment && firstShipment.batch_id) {
        console.log('Using batch ID from results:', firstShipment.batch_id);
        setCurrentBatchId(firstShipment.batch_id);
        
        // Set batch label URL if available
        if (firstShipment.batch_label_url) {
          setCurrentBatchLabelUrl(firstShipment.batch_label_url);
        }
      } else if (!currentBatchId) {
        // Generate a fallback batch ID based on timestamp and first tracking code
        const firstTrackingCode = results.processedShipments[0]?.tracking_code || 'unknown';
        const batchId = `batch_${Date.now()}_${firstTrackingCode.substring(0, 8)}`;
        console.log('Generated fallback batch ID:', batchId);
        setCurrentBatchId(batchId);
      }
    }
  }, [uploadStatus, results, currentBatchId]);

  // Log pickup address on mount and when it changes (less frequently)
  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]); // Only log when ID changes

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    console.log("handlePickupAddressSelect called with:", address);
    if (address && address.id !== pickupAddress?.id) {
      console.log("Selected pickup address in BulkUpload:", address);
      setPickupAddress(address);
      
      // Prevent duplicate toasts
      const now = Date.now();
      if (now - lastToastRef.current > 2000) {
        toast.success(`Selected pickup address: ${address.name || address.street1}`);
        lastToastRef.current = now;
      }
    }
  };

  const handleUploadSuccess = (uploadResults: any) => {
    console.log("Upload success in BulkUpload component:", uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in BulkUpload component:", error);
  };

  // Wrapper function to match expected signature
  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    console.log("handleEditShipmentWrapper called with:", shipmentId, details);
    const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
    if (shipment) {
      handleEditShipment(shipment);
    }
  };

  // Create a proper event handler wrapper for handleCreateLabels
  const handleCreateLabelsClick = () => {
    console.log("handleCreateLabelsClick called");
    try {
      handleCreateLabels();
    } catch (error) {
      console.error("Error in handleCreateLabelsClick:", error);
      toast.error("Failed to create labels. Please try again.");
    }
  };

  const resetUpload = () => {
    console.log("resetUpload called");
    setCurrentBatchId(null);
    setCurrentBatchLabelUrl(null);
    window.location.reload();
  };

  const selectNewFile = () => {
    console.log("selectNewFile called");
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Fix the sort handler to properly handle the sort field types
  const handleSortChange = (field: string, direction: string) => {
    // Map the field to match the expected type from useShipmentFiltering
    let mappedField = field;
    if (field === "address") {
      mappedField = "recipient";
    }
    setSortField(mappedField as "recipient" | "carrier" | "rate");
    setSortDirection(direction as "asc" | "desc");
  };

  console.log('Rendering BulkUpload with status:', uploadStatus);
  
  return (
    <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
      <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
      
      {uploadStatus === 'idle' && (
        <BulkUploadForm 
          onUploadSuccess={handleUploadSuccess}
          onUploadFail={handleUploadFail}
          onPickupAddressSelect={handlePickupAddressSelect}
          isUploading={isUploading}
          progress={progress}
          handleUpload={handleUpload}
        />
      )}
      
      {isUploading && (
        <div className="my-6">
          <h3 className="font-medium mb-2">Processing your shipments</h3>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 mt-2">
            {progress < 100 
              ? `Processing shipments (${progress}%)...` 
              : 'Processing complete! Preparing shipment options...'}
          </p>
        </div>
      )}
      
      {uploadStatus === 'editing' && results && results.processedShipments && Array.isArray(results.processedShipments) && (
        <div className="mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              Enhanced Bulk Shipment Options
              {isFetchingRates && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                  Fetching rates...
                </span>
              )}
            </h2>
            
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                <UploadCloud className="mr-1 h-4 w-4" />
                Template
              </Button>
              
              <Button onClick={resetUpload} className="text-sm">
                <UploadCloud className="mr-1 h-4 w-4" />
                Upload Another File
              </Button>
            </div>
          </div>
          
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Enhanced Batch Label Generation</AlertTitle>
            <AlertDescription>
              Select carrier and service options for each shipment. Labels will be generated using EasyPost's API for optimal processing and consolidated batch labels.
            </AlertDescription>
          </Alert>
          
          <BulkShipmentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortField={sortField === "recipient" ? "recipient" : sortField as "recipient" | "rate" | "carrier"}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            selectedCarrier={selectedCarrierFilter}
            onCarrierFilterChange={setSelectedCarrierFilter}
            onApplyCarrierToAll={handleBulkApplyCarrier}
          />
          
          <BulkShipmentsList
            shipments={filteredShipments}
            isFetchingRates={isFetchingRates}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={handleEditShipmentWrapper}
            onRefreshRates={handleRefreshRates}
          />
          
          {results.processedShipments.length > 0 && (
            <div className="mt-8 p-4 border rounded-lg bg-gray-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div>
                  <h3 className="font-semibold text-lg">Enhanced Batch Order Summary</h3>
                  <p className="text-gray-600">
                    {results.processedShipments.length} shipments selected with a total cost of ${results.totalCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Labels will be generated using EasyPost API in PDF, PNG, and ZPL formats
                  </p>
                  {pickupAddress && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <Button 
                    variant="outline" 
                    className="px-6"
                    onClick={handleDownloadAllLabels}
                    disabled={isPaying || isCreatingLabels}
                  >
                    Download All Labels
                  </Button>
                  
                  <Button
                    onClick={handleCreateLabelsClick}
                    disabled={isCreatingLabels || results.processedShipments.length === 0 || !pickupAddress}
                    className="px-6 bg-green-600 hover:bg-green-700"
                  >
                    {isCreatingLabels ? 'Creating Labels...' : 'Create Batch Labels'} 
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {uploadStatus === 'success' && results && (
        <EnhancedSuccessNotification
          results={results}
          batchId={currentBatchId || undefined}
          batchLabelUrl={currentBatchLabelUrl || undefined}
        />
      )}
      
      {uploadStatus === 'error' && (
        <UploadError 
          onRetry={resetUpload}
          onSelectNewFile={selectNewFile}
          errorMessage="Upload failed. Please check your file format and try again."
        />
      )}
      
      <LabelOptionsModal 
        open={showLabelOptions}
        onOpenChange={setShowLabelOptions}
        onFormatSelect={handleDownloadLabelsWithFormat}
        onEmailLabels={() => handleEmailLabels("")}
        shipmentCount={results?.processedShipments?.length || 0}
      />
    </Card>
  );
};

export default BulkUpload;
