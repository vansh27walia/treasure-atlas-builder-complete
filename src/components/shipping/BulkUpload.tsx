import React, { useEffect, useRef, useState } from 'react';
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
import PrintPreview from '@/components/shipping/PrintPreview'; // Corrected import
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, AlertCircle, Download, Printer, CreditCard } from 'lucide-react';
import { SavedAddress, BulkUploadResult, LabelFormat } from '@/types/shipping'; // LabelFormat import
import { toast } from '@/components/ui/sonner';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [labelProgress, setLabelProgress] = useState({
    isCreating: false,
    progress: 0,
    currentStep: '',
    completed: 0,
    failed: 0
  });

  const {
    file,
    isUploading,
    isPaying,
    isCreatingLabels, // This is from useBulkUpload (aliased managementIsCreatingLabels)
    isFetchingRates, // Added this
    uploadStatus,
    results,
    progress,
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
    handleEmailLabels,
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
    updateLabelGenerationProgress
  } = useBulkUpload();

  // const isCreatingLabels = labelGenerationProgress.isGenerating; // This can also be used if more granular control is needed from labelGenerationProgress

  // Log pickup address on mount and when it changes (less frequently)
  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]); // Only log when ID changes

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
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

  const handleUploadSuccess = (uploadResults: BulkUploadResult) => {
    console.log("Upload success in BulkUpload component:", uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in BulkUpload component:", error);
  };

  // Wrapper function to match expected signature
  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
    if (shipment) {
      // Ensure 'details' passed to handleEditShipment matches expected type
      // The 'details' here comes from BulkShipmentsList's onEditShipment which passes ShipmentDetails
      handleEditShipment(shipment.id, details); 
    }
  };

  const resetUpload = () => {
    window.location.reload();
  };

  const selectNewFile = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };
  
  // Safely get processed shipments count
  const processedShipmentsCount = results?.processedShipments?.length || 0;

  const handleDownloadAndCreateLabelsClick = async () => { // Renamed to reflect its primary action
    if (!results?.processedShipments?.length) {
      toast.error('No shipments available for label creation');
      return;
    }
    if (!pickupAddress) {
      toast.error('Pickup address not selected. Cannot create labels.');
      return;
    }

    // Update local UI progress; labelGenerationProgress from hook will reflect actual progress.
    setLabelProgress({ 
      isCreating: true,
      progress: 0,
      currentStep: 'Initializing label creation...',
      completed: 0,
      failed: 0
    });
    // updateLabelGenerationProgress can also be used here if preferred.

    try {
      await handleCreateLabels(); 
      // After handleCreateLabels, labelGenerationProgress in the hook will be updated.
      // The local setLabelProgress can be removed if LabelCreationOverlay directly uses hook's progress.
      // For now, update local progress as a final step.
      setLabelProgress(prev => ({ 
        ...prev, 
        isCreating: true, // Keep it true until timeout if needed
        progress: 100,
        currentStep: 'Label creation process finished by hook.',
        // Use results from the hook after it completes
        completed: results?.successful || labelGenerationProgress.successfulShipments, 
        failed: results?.failed || labelGenerationProgress.failedShipments
      }));
      
      setTimeout(() => {
        setLabelProgress(prev => ({ ...prev, isCreating: false }));
        // Toasts for success/failure are typically handled within useBulkUpload or its sub-hooks.
      }, 2000);
      
    } catch (error) {
      console.error('Error in UI layer calling handleCreateLabels:', error);
      setLabelProgress(prev => ({ 
        ...prev, 
        isCreating: false, 
        currentStep: 'Error occurred during label creation call',
      }));
      updateLabelGenerationProgress({isCreating: false, currentStep: 'Error in UI call'});
      toast.error('Failed to initiate label creation process.');
    }
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
            onPickupAddressSelect={handlePickupAddressSelect}
            isUploading={isUploading}
            progress={progress}
            handleUpload={handleUpload} // This handleUpload is from useBulkUpload, expects 1 arg (file)
          />
        )}
        
        {isUploading && uploadStatus === 'uploading' && ( // More specific condition for this progress bar
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
        
        {/* Label Generation Progress (uses labelGenerationProgress from hook) */}
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
                {(isFetchingRates || isCreatingLabels) && ( // Use isCreatingLabels from hook
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    {isFetchingRates ? 'Fetching rates...' : (labelGenerationProgress.currentStep || 'Processing labels...')}
                  </span>
                )}
              </h2>
              
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                  <UploadCloud className="mr-1 h-4 w-4" />
                  Template
                </Button>
                
                <Button onClick={() => window.location.reload()} className="text-sm">
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
                setSortField(field as any);
                setSortDirection(direction as any);
              }}
              selectedCarrier={selectedCarrierFilter}
              onCarrierFilterChange={setSelectedCarrierFilter}
              onApplyCarrierToAll={handleBulkApplyCarrier}
            />
            
            <BulkShipmentsList
              shipments={filteredShipments}
              isFetchingRates={isFetchingRates}
              isCreatingLabels={isCreatingLabels} // Pass isCreatingLabels
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
                      {results.processedShipments?.filter(s => s.selectedRateId).length || 0} shipments ready with a total cost of ${results.totalCost?.toFixed(2) || '0.00'}
                    </p>
                    {pickupAddress && (
                      <p className="text-sm text-blue-600 mt-1">
                        <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4 lg:mt-0">
                    <Button 
                      onClick={handleDownloadAndCreateLabelsClick}
                      disabled={isPaying || isCreatingLabels || results.processedShipments?.filter(s => s.selectedRateId).length === 0 || !pickupAddress}
                      className="px-6 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {isCreatingLabels ? (labelGenerationProgress.currentStep || 'Creating...') : 'Create & Get Labels'}
                    </Button>
                    
                    {/* Optional Pay Labels Button */}
                    {/* <Button
                      onClick={() => setShowPaymentModal(true)}
                      // ... (disabled conditions)
                    >
                      <CreditCard className="mr-1 h-4 w-4" /> Pay Labels
                    </Button> */}

                    {results.batchResult && results.batchResult.batchId && (
                        <Button
                            onClick={handleOpenBatchPrintPreview}
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
            onDownloadSingleLabel={handleDownloadSingleLabel}
            onCreateLabels={handleCreateLabels}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels} // Pass this
            onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview}
          />
        )}
        
        {uploadStatus === 'error' && (
          <UploadError 
            onRetry={resetUpload} // Corrected
            onSelectNewFile={selectNewFile} // Corrected
            errorMessage="Upload failed. Please check your file format and try again."
          />
        )}
      </Card>

      {/* Label Creation Overlay: Now primarily driven by labelGenerationProgress from the hook */}
      <LabelCreationOverlay
        isVisible={labelGenerationProgress.isGenerating}
        progress={labelGenerationProgress.totalShipments > 0 ? (labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments * 100) : 0}
        currentStep={labelGenerationProgress.currentStep}
        totalLabels={labelGenerationProgress.totalShipments}
        completedLabels={labelGenerationProgress.successfulShipments}
        failedLabels={labelGenerationProgress.failedShipments}
        onClose={() => updateLabelGenerationProgress({ isGenerating: false })} // Use updater from hook
      />

      {/* Batch Print Preview Modal - using PrintPreview component */}
      {results && (results.batchResult || (uploadStatus === 'success' && results.processedShipments?.some(s => s.label_url || s.label_urls))) && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult} // Pass batchResult
          shipments={results.processedShipments || []} // Pass shipments for manifest/list
          isBatchPreview={true} // Indicate it's for batch
          onDownloadFormat={handleDownloadLabelsWithFormat}
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
