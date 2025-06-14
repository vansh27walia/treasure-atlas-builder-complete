import React, { useEffect, useRef, useState, Dispatch, SetStateAction } from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import LabelCreationOverlay from './LabelCreationOverlay';
import StripePaymentModal from './StripePaymentModal';
import PrintPreview from '@/components/shipping/PrintPreview';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, AlertCircle, Download, Printer, XCircleIcon } from 'lucide-react';
import { SavedAddress, BulkUploadResult, LabelFormat, BulkShipment, BatchResult, ShipmentDetails } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

// Define a type for the address that might come from AddressService
type PotentiallyNumericIdAddress = Omit<SavedAddress, 'id'> & { id: string | number };

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [shipmentToPreview, setShipmentToPreview] = useState<BulkShipment | null>(null);
  const [singlePreviewModalOpen, setSinglePreviewModalOpen] = useState(false);

  const {
    file,
    isUploading,
    isPaying,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setPickupAddress,
    handleUpload,
    handleCreateLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleOpenBatchPrintPreview,
    setBatchPrintPreviewModalOpen,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    updateLabelGenerationProgress,
  } = useBulkUpload();

  const isCreatingLabels = labelGenerationProgress.isGenerating;

  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]);

  const handlePickupAddressSelect = (address: PotentiallyNumericIdAddress | null) => {
    if (address) {
      // Ensure the address passed to the hook has a string ID
      const addressWithStringId: SavedAddress = { ...address, id: String(address.id) };
      if (addressWithStringId.id !== pickupAddress?.id) { // Compare with current pickupAddress from hook
        console.log("Selected pickup address in BulkUpload (processed):", addressWithStringId);
        setPickupAddress(addressWithStringId); // Call hook's setter
        
        const now = Date.now();
        if (now - lastToastRef.current > 2000) {
          toast.success(`Selected pickup address: ${addressWithStringId.name || addressWithStringId.street1}`);
          lastToastRef.current = now;
        }
      }
    } else {
      setPickupAddress(null); // Handle de-selecting
    }
  };
  

  const handleUploadSuccess = (uploadResults: BulkUploadResult) => {
    console.log("Upload success in BulkUpload component:", uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in BulkUpload component:", error);
  };

  const handleEditShipmentWrapper = (shipmentId: string, details: Partial<ShipmentDetails>) => {
    handleEditShipment(shipmentId, details); 
  };

  const resetUpload = () => {
    // More graceful reset might be needed, e.g., calling a reset function from useBulkUpload
    window.location.reload(); 
  };

  const selectNewFile = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; // Clear previous file selection
      fileInput.click();
    }
  };
  
  const processedShipmentsCount = results?.processedShipments?.filter(s => s.selectedRateId).length || 0;

  const handleDownloadAndCreateLabelsClick = async () => {
    if (!results?.processedShipments?.length) {
      toast.error('No shipments available for label creation');
      return;
    }
    if (!pickupAddress) {
      toast.error('Pickup address not selected. Cannot create labels.');
      return;
    }

    // Progress is primarily managed by labelGenerationProgress from useBulkUpload
    // updateLabelGenerationProgress({ 
    //   isGenerating: true,
    //   currentStep: 'Initializing label creation...',
    //   // Other progress fields are updated by the hook
    // });

    try {
      await handleCreateLabels(); 
      // Toasts for success/failure are handled within useBulkUpload or its sub-hooks.
    } catch (error) {
      console.error('Error in UI layer calling handleCreateLabels:', error);
      // updateLabelGenerationProgress({isGenerating: false, currentStep: 'Error in UI call'}); // Hook should manage this
      toast.error('Failed to initiate label creation process.');
    }
  };
  
  const handlePreviewSingleShipment = (shipment: BulkShipment) => {
    // This function is passed to SuccessNotification -> LabelResultsTable
    // and also used by BulkUploadView's LabelResultsTable
    setShipmentToPreview(shipment);
    setSinglePreviewModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Labels are now available for download.');
  };

  return (
    <>
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
        
        {uploadStatus === 'idle' && (
          <BulkUploadForm 
            onUploadSuccess={handleUploadSuccess}
            onUploadFail={handleUploadFail}
            onPickupAddressSelect={handlePickupAddressSelect} // Correctly typed parameter now
            isUploading={isUploading}
            progress={progress}
            handleUpload={handleUpload} 
          />
        )}
        
        {isUploading && uploadStatus === 'uploading' && (
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
        
        {(isCreatingLabels || labelGenerationProgress.isGenerating) && (
            <div className="my-6 p-4 border rounded-lg bg-blue-50">
                <h3 className="font-semibold text-lg text-blue-700 mb-2">
                    {labelGenerationProgress.currentStep || "Generating Labels..."}
                </h3>
                <Progress 
                    value={(labelGenerationProgress.totalShipments > 0 ? (labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments) * 100 : 0)} 
                    className="h-3 mb-1" 
                />
                <div className="text-xs text-gray-600 flex justify-between">
                    <span>Processed: {labelGenerationProgress.processedShipments}/{labelGenerationProgress.totalShipments}</span>
                    <span>Successful: {labelGenerationProgress.successfulShipments}</span>
                    <span>Failed: {labelGenerationProgress.failedShipments}</span>
                </div>
                {labelGenerationProgress.estimatedTimeRemaining > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Est. time remaining: {Math.ceil(labelGenerationProgress.estimatedTimeRemaining / 60000)} min</p>
                )}
            </div>
        )}

        {uploadStatus === 'editing' && results && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Bulk Shipment Options
                {(isFetchingRates || isCreatingLabels) && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    {isFetchingRates ? 'Fetching rates...' : (labelGenerationProgress.currentStep || 'Processing labels...')}
                  </span>
                )}
              </h2>
              
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                  <Download className="mr-1 h-4 w-4" /> {/* Changed icon to Download */}
                  Template
                </Button>
                
                <Button onClick={resetUpload} className="text-sm"> {/* Changed to resetUpload */}
                  <UploadCloud className="mr-1 h-4 w-4" />
                  Upload Another File
                </Button>
              </div>
            </div>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Select carrier and service options for each shipment. You can edit address details or remove shipments before proceeding.
              </AlertDescription>
            </Alert>
            
            <BulkShipmentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => {
                setSortField(field as any); // Cast as any if type conflict, or ensure correct types
                setSortDirection(direction as any); // Cast as any if type conflict, or ensure correct types
              }}
              selectedCarrier={selectedCarrierFilter}
              onCarrierFilterChange={setSelectedCarrierFilter}
              onApplyCarrierToAll={handleBulkApplyCarrier}
            />
            
            <BulkShipmentsList
              shipments={filteredShipments}
              isFetchingRates={isFetchingRates}
              isCreatingLabels={isCreatingLabels} // This is labelGenerationProgress.isGenerating
              onSelectRate={handleSelectRate}
              onRemoveShipment={handleRemoveShipment}
              onEditShipment={handleEditShipmentWrapper}
              onRefreshRates={handleRefreshRates}
            />
            
            {filteredShipments.length > 0 && (
              <div className="mt-8 p-4 border rounded-lg bg-gray-50">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Order Summary</h3>
                    <p className="text-gray-600">
                      {processedShipmentsCount} shipments ready with a total cost of ${results.totalCost?.toFixed(2) || '0.00'}
                    </p>
                    {pickupAddress && (
                      <p className="text-sm text-blue-600 mt-1">
                        <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}, {pickupAddress.city}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4 lg:mt-0">
                    <Button 
                      onClick={handleDownloadAndCreateLabelsClick}
                      disabled={isPaying || isCreatingLabels || processedShipmentsCount === 0 || !pickupAddress}
                      className="px-6 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {isCreatingLabels ? (labelGenerationProgress.currentStep || 'Creating...') : 'Create & Get Labels'}
                    </Button>
                    
                    {/* This button for batch output is now in BulkUploadView or can be triggered via handleOpenBatchPrintPreview */}
                    {results.batchResult && results.batchResult.batchId && (
                        <Button
                            onClick={handleOpenBatchPrintPreview} // Use hook function
                            variant="outline"
                            className="px-6"
                        >
                            <Printer className="mr-1 h-4 w-4" />
                            Print/View Batch Output
                        </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {uploadStatus === 'success' && results && (
          <SuccessNotification
            results={results}
            onDownloadSingleLabel={(shipmentId, url, format) => handleDownloadSingleLabel(url, format as LabelFormat, shipmentId)}
            onCreateLabels={handleCreateLabels} 
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels} 
            onDownloadLabelsWithFormat={(format) => handleDownloadLabelsWithFormat(format as LabelFormat, results?.batchResult?.batchId)} 
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview}
            onPreviewLabel={handlePreviewSingleShipment} // Pass the handler here
          />
        )}
        
        {uploadStatus === 'error' && (
          <UploadError 
            onRetry={resetUpload}
            onSelectNewFile={selectNewFile} // Pass the new handler
            errorMessage={results?.failedShipments?.[0]?.error || "Upload failed. Please check your file format and try again."}
          />
        )}
      </Card>

      <LabelCreationOverlay
        isVisible={labelGenerationProgress.isGenerating}
        progress={labelGenerationProgress.totalShipments > 0 ? (labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments * 100) : 0}
        currentStep={labelGenerationProgress.currentStep || "Processing labels..."}
        totalLabels={labelGenerationProgress.totalShipments}
        completedLabels={labelGenerationProgress.successfulShipments}
        failedLabels={labelGenerationProgress.failedShipments}
        estimatedTimeRemaining={labelGenerationProgress.estimatedTimeRemaining}
        onClose={() => updateLabelGenerationProgress({ isGenerating: false, currentStep: "Closed by user" })}
      />
      
      {results && pickupAddress && (results.batchResult || (uploadStatus === 'success' && results.processedShipments?.some(s => s.label_url || s.label_urls))) && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult}
          processedShipments={results.processedShipments || []}
          isBatchPreview={true}
          onDownloadFormat={(format, shipmentId) => handleDownloadLabelsWithFormat(format as LabelFormat, shipmentId)}
          pickupAddress={pickupAddress}
        />
      )}
      
      {shipmentToPreview && pickupAddress && (
         <PrintPreview
          isOpenProp={singlePreviewModalOpen}
          onOpenChangeProp={setSinglePreviewModalOpen}
          singleShipmentPreview={{ // Construct the SingleShipmentDataForPreview object
            id: shipmentToPreview.id,
            label_url: shipmentToPreview.label_url,
            label_urls: shipmentToPreview.label_urls,
            tracking_code: shipmentToPreview.tracking_code,
            tracking_number: shipmentToPreview.tracking_number,
            carrier: shipmentToPreview.carrier,
            service: shipmentToPreview.service,
            details: shipmentToPreview.details,
            customer_name: shipmentToPreview.customer_name,
          }}
          isBatchPreview={false}
          onDownloadFormat={(format, shipmentId) => handleDownloadLabelsWithFormat(format as LabelFormat, shipmentId)}
          pickupAddress={pickupAddress}
        />
      )}

      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={results?.totalCost || 0}
        shipmentCount={processedShipmentsCount}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};
export default BulkUpload;
