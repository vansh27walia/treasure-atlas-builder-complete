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
import BatchPrintPreviewModal from './bulk-upload/BatchPrintPreviewModal'; // Import BatchPrintPreviewModal
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, AlertCircle, Download, CreditCard, Printer } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, LabelFormat } from '@/types/shipping'; // Ensure LabelFormat is imported

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
    // isCreatingLabels, // This specific one might come from labelGenerationProgress.isGenerating
    uploadStatus,
    results,
    progress,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    labelGenerationProgress, // Get this from useBulkUpload
    batchPrintPreviewModalOpen, // Get this
    setPickupAddress,
    handleUpload,
    handleCreateLabels, // This is the primary label creation trigger
    handleDownloadLabelsWithFormat, // For downloading specific formats
    handleDownloadSingleLabel, // For individual downloads from tables
    handleEmailLabels, // If still used
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleOpenBatchPrintPreview, // For opening the print preview
    setBatchPrintPreviewModalOpen, // For closing the print preview
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  const isCreatingLabels = labelGenerationProgress.isGenerating; // Derive from labelGenerationProgress

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

  const handleUploadSuccess = (uploadResults: any) => {
    console.log("Upload success in BulkUpload component:", uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in BulkUpload component:", error);
  };

  // Wrapper function to match expected signature
  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
    if (shipment) {
      handleEditShipment(shipment);
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

    // The complex progress simulation inside BulkUpload component can be simplified
    // if labelGenerationProgress from useBulkUpload provides enough detail.
    // For now, we keep it if it provides a different UI experience.
    // If labelGenerationProgress from the hook is sufficient, this local progress logic can be removed.

    setLabelProgress({ // This is local UI progress for the overlay
      isCreating: true,
      progress: 0,
      currentStep: 'Initializing label creation...',
      completed: 0,
      failed: 0
    });

    try {
      // Simulate some initial steps if desired before calling the main hook
      // This is mostly for the UI overlay if it shows more granular steps than the hook's progress
      const totalShipments = results.processedShipments.filter(s => s.selectedRateId).length;
      
      const updateLocalProgress = (step: string, progressValue: number, completed: number = labelProgress.completed, failed: number = labelProgress.failed) => {
        setLabelProgress({
          isCreating: true, // Keep overlay visible
          progress: progressValue,
          currentStep: step,
          completed,
          failed
        });
      };

      updateLocalProgress('Preparing to create labels...', 10);
      
      // Call the actual label creation from the hook
      // This will set its own labelGenerationProgress state
      await handleCreateLabels(); 
      
      // After handleCreateLabels completes, its own progress (labelGenerationProgress)
      // will reflect the outcome. The local setLabelProgress here might become redundant
      // if the overlay directly uses labelGenerationProgress from the hook.
      // For now, assume this updates the overlay after the hook finishes.
      updateLocalProgress('Label creation process finished.', 100, 
        results.successful || labelGenerationProgress.successfulShipments, 
        results.failed || labelGenerationProgress.failedShipments
      );
      
      setTimeout(() => {
        setLabelProgress(prev => ({ ...prev, isCreating: false })); // Close local overlay
        // Toast for overall success/failure is handled by useBulkUpload or here based on results
        if ((results.successful || 0) > 0) {
             toast.success('Labels processed. Check results.');
        } else if ((results.failed || 0) > 0) {
            toast.error('Label creation failed for some shipments.');
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error in UI layer calling handleCreateLabels:', error);
      setLabelProgress(prev => ({ 
        ...prev, 
        isCreating: false, 
        currentStep: 'Error occurred during label creation call',
      }));
      toast.error('Failed to initiate label creation process.');
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Labels are now available for download.');
    // You can trigger automatic label download here if needed
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
        
        {uploadStatus === 'editing' && results && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Bulk Shipment Options
                {(isFetchingRates || labelGenerationProgress.isGenerating) && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    {isFetchingRates ? 'Fetching rates...' : labelGenerationProgress.currentStep || 'Processing...'}
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
                      onClick={handleDownloadAndCreateLabelsClick} // Changed to this handler
                      disabled={isPaying || isCreatingLabels || results.processedShipments?.filter(s => s.selectedRateId).length === 0 || !pickupAddress}
                      className="px-6 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {isCreatingLabels ? (labelGenerationProgress.currentStep || 'Creating...') : 'Create & Get Labels'}
                    </Button>
                    
                    {/* Pay Labels Button - only if not using auto-pay or if payment is a separate step */}
                    {/* <Button
                      onClick={() => setShowPaymentModal(true)}
                      disabled={isPaying || isCreatingLabels || results.processedShipments?.filter(s => s.selectedRateId).length === 0 || !pickupAddress}
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="mr-1 h-4 w-4" />
                      Pay Labels
                    </Button> */}

                    {/* New "Print/Download Batch" button, active after labels are created */}
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
            onCreateLabels={handleCreateLabels} // Or handleDownloadAndCreateLabelsClick if re-creation is an option
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
            onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat} // Pass this
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview} // Pass this
          />
        )}
        
        {uploadStatus === 'error' && (
          <UploadError 
            onRetry={() => window.location.reload()}
            onSelectNewFile={() => {
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
              }
            }}
            errorMessage="Upload failed. Please check your file format and try again."
          />
        )}
      </Card>

      {/* Label Creation Overlay - Potentially use labelGenerationProgress from hook */}
      <LabelCreationOverlay
        isVisible={labelProgress.isCreating || labelGenerationProgress.isGenerating}
        progress={labelGenerationProgress.isGenerating ? (labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments * 100) : labelProgress.progress}
        currentStep={labelGenerationProgress.isGenerating ? labelGenerationProgress.currentStep : labelProgress.currentStep}
        totalLabels={labelGenerationProgress.totalShipments || results?.processedShipments?.length || 0}
        completedLabels={labelGenerationProgress.successfulShipments || labelProgress.completed}
        failedLabels={labelGenerationProgress.failedShipments || labelProgress.failed}
        onClose={() => {
          setLabelProgress(prev => ({ ...prev, isCreating: false }));
          // Also consider resetting labelGenerationProgress if appropriate, or let the hook manage it
        }}
      />

      {/* Batch Print Preview Modal */}
      {results && (
        <BatchPrintPreviewModal
          isOpen={batchPrintPreviewModalOpen}
          onClose={() => setBatchPrintPreviewModalOpen(false)}
          batchResult={results.batchResult}
          shipments={results.processedShipments || []}
          onDownloadFormat={handleDownloadLabelsWithFormat} // Pass the handler
          pickupAddress={pickupAddress}
        />
      )}

      {/* Stripe Payment Modal */}
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
