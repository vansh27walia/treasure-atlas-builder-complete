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
import PrintPreview from '@/components/shipping/PrintPreview';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, AlertCircle, Download, Printer } from 'lucide-react';
import { SavedAddress, BulkUploadResult, LabelFormat, BulkShipment, BatchResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import { Dispatch, SetStateAction } from 'react';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const {
    file,
    isUploading,
    isPaying,
    isFetchingRates,
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

  const isCreatingLabels = labelGenerationProgress.isGenerating;

  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]);

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    let addrToSet = null;
    if (address) {
      addrToSet = typeof address.id === 'number' ? { ...address, id: String(address.id) } : address;
    }
    
    if (addrToSet && addrToSet.id !== pickupAddress?.id) {
      console.log("Selected pickup address in BulkUpload:", addrToSet);
      setPickupAddress(addrToSet);
      
      const now = Date.now();
      if (now - lastToastRef.current > 2000) {
        toast.success(`Selected pickup address: ${addrToSet.name || addrToSet.street1}`);
        lastToastRef.current = now;
      }
    } else if (!address && pickupAddress) { // Handle de-selecting
      setPickupAddress(null);
    }
  };

  const handleUploadSuccess = (uploadResults: BulkUploadResult) => {
    console.log("Upload success in BulkUpload component:", uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in BulkUpload component:", error);
  };

  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    handleEditShipment(shipmentId, details);
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
  
  const processedShipmentsCount = results?.processedShipments?.length || 0;

  const handleDownloadAndCreateLabelsClick = async () => {
    if (!results?.processedShipments?.length) {
      toast.error('No shipments available for label creation');
      return;
    }
    if (!pickupAddress) {
      toast.error('Pickup address not selected. Cannot create labels.');
      return;
    }

    updateLabelGenerationProgress({ 
      isGenerating: true,
      currentStep: 'Initializing label creation...',
      // totalShipments, processedShipments, etc., will be updated by the hook itself.
    });

    try {
      await handleCreateLabels(); 
      // Progress is now managed by labelGenerationProgress within the hook.
      // Toasts for success/failure are typically handled within useBulkUpload or its sub-hooks.
    } catch (error) {
      console.error('Error in UI layer calling handleCreateLabels:', error);
      updateLabelGenerationProgress({isGenerating: false, currentStep: 'Error in UI call'});
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
              isCreatingLabels={isCreatingLabels}
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
            isCreatingLabels={isCreatingLabels}
            onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview}
          />
        )}
        
        {uploadStatus === 'error' && (
          <UploadError 
            onRetry={resetUpload}
            onSelectNewFile={selectNewFile}
            errorMessage="Upload failed. Please check your file format and try again."
          />
        )}
      </Card>

      <LabelCreationOverlay
        isVisible={labelGenerationProgress.isGenerating}
        progress={labelGenerationProgress.totalShipments > 0 ? (labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments * 100) : 0}
        currentStep={labelGenerationProgress.currentStep}
        totalLabels={labelGenerationProgress.totalShipments}
        completedLabels={labelGenerationProgress.successfulShipments}
        failedLabels={labelGenerationProgress.failedShipments}
        onClose={() => updateLabelGenerationProgress({ isGenerating: false })}
      />

      {results && (results.batchResult || (uploadStatus === 'success' && results.processedShipments?.some(s => s.label_url || s.label_urls))) && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult}
          processedShipments={results.processedShipments || []}
          isBatchPreview={true}
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
