
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
import { SavedAddress, BulkUploadResult, LabelFormat, BulkShipment, BatchResult, ShipmentDetails, ShippingOption } from '@/types/shipping';
import { toast as sonnerToast } from '@/components/ui/sonner';
import type { BulkShipmentFilterField } from './bulk-upload/BulkShipmentFilters';

type PotentiallyNumericIdAddress = Omit<SavedAddress, 'id'> & { id: string | number };

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [shipmentToPreview, setShipmentToPreview] = useState<BulkShipment | null>(null);
  const [singlePreviewModalOpen, setSinglePreviewModalOpen] = useState(false);

  const hookApi = useBulkUpload();
  const {
    file,
    isUploading,
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
    isPaying,
    error,
  } = hookApi;

  const isCreatingLabels = labelGenerationProgress.isGenerating;

  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]);

  const handlePickupAddressSelect = (address: PotentiallyNumericIdAddress | null) => {
    if (address) {
      const addressWithStringId: SavedAddress = { ...address, id: String(address.id) };
      if (addressWithStringId.id !== pickupAddress?.id) {
        console.log("Selected pickup address in BulkUpload (processed):", addressWithStringId);
        setPickupAddress(addressWithStringId);
        
        const now = Date.now();
        if (now - lastToastRef.current > 2000) {
          sonnerToast.success(`Selected pickup address: ${addressWithStringId.name || addressWithStringId.street1}`);
          lastToastRef.current = now;
        }
      }
    } else {
      setPickupAddress(null); 
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
    hookApi.handleFileChange(null);
  };

  const selectNewFile = () => {
    resetUpload();
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ''; 
      fileInput.click();
    } else {
        sonnerToast.info("Please use the 'Select CSV File' button in the form to choose a new file after reset.");
    }
  };
  
  const processedShipmentsCount = results?.processedShipments?.filter(s => s.selectedRateId).length || 0;

  const handleDownloadAndCreateLabelsClick = async () => {
    if (!results?.processedShipments?.length) {
      sonnerToast.error('No shipments available for label creation');
      return;
    }
    if (!pickupAddress) {
      sonnerToast.error('Pickup address not selected. Cannot create labels.');
      return;
    }
    try {
      await hookApi.handleCreateLabels(); 
    } catch (error) {
      console.error('Error in UI layer calling handleCreateLabels:', error);
      sonnerToast.error('Failed to initiate label creation process.');
    }
  };
  
  const handlePreviewSingleShipment = (shipment: BulkShipment) => {
    setShipmentToPreview(shipment);
    setSinglePreviewModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    sonnerToast.success('Payment successful! Labels are now available for download.');
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
          />
        )}
        
        {isUploading && (uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="my-6">
            <h3 className="font-medium mb-2">Processing your shipments</h3>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-500 mt-2">
              {progress < 100 
                ? `${uploadStatus === 'uploading' ? 'Uploading file' : 'Processing shipments'} (${progress}%)...` 
                : 'Processing complete! Preparing shipment options...'}
            </p>
          </div>
        )}
        
        {labelGenerationProgress.isGenerating && (
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
                {labelGenerationProgress.estimatedTimeRemaining != null && labelGenerationProgress.estimatedTimeRemaining > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Est. time remaining: {Math.ceil(labelGenerationProgress.estimatedTimeRemaining / 60)} seconds</p>
                )}
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
                    {isFetchingRates ? 'Fetching rates...' : (labelGenerationProgress.currentStep || 'Processing labels...')}
                  </span>
                )}
              </h2>
              
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                  <Download className="mr-1 h-4 w-4" />
                  Template
                </Button>
                
                <Button onClick={selectNewFile} className="text-sm"> 
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
                Rates are mock data for now.
              </AlertDescription>
            </Alert>
            
            <BulkShipmentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortField={sortField as BulkShipmentFilterField}
              sortDirection={sortDirection}
              onSortChange={(field, direction) => {
                setSortField(field as BulkShipmentFilterField); 
                setSortDirection(direction);
              }}
              selectedCarrier={selectedCarrierFilter}
              onCarrierFilterChange={setSelectedCarrierFilter}
              onApplyCarrierToAll={handleBulkApplyCarrier}
            />
            
            <BulkShipmentsList
              shipments={filteredShipments}
              isFetchingRates={isFetchingRates}
              isCreatingLabels={labelGenerationProgress.isGenerating} 
              onSelectRate={(shipmentId: string, rateId: string) => handleSelectRate(shipmentId, rateId)}
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
                      onClick={hookApi.handleFetchRatesForAllShipments}
                      disabled={isFetchingRates || labelGenerationProgress.isGenerating || !results?.processedShipments?.length || !pickupAddress}
                      variant="outline"
                    >
                      Fetch All Rates
                    </Button>
                    <Button 
                      onClick={handleDownloadAndCreateLabelsClick}
                      disabled={isPaying || labelGenerationProgress.isGenerating || processedShipmentsCount === 0 || !pickupAddress}
                      className="px-6 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {labelGenerationProgress.isGenerating ? (labelGenerationProgress.currentStep || 'Creating...') : 'Create & Get Labels'}
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
        
        {uploadStatus === 'completed' && results && (
          <SuccessNotification
            results={results}
            onDownloadSingleLabel={(shipmentId, url, format) => handleDownloadSingleLabel(url, format as LabelFormat, shipmentId)}
            onCreateLabels={hookApi.handleCreateLabels} 
            isPaying={isPaying}
            isCreatingLabels={labelGenerationProgress.isGenerating} 
            onDownloadLabelsWithFormat={(format) => handleDownloadLabelsWithFormat(format as LabelFormat, results?.batchResult?.batchId)} 
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview}
            onPreviewLabel={handlePreviewSingleShipment} 
          />
        )}
        
        {uploadStatus === 'error' && (
           <UploadError 
            onRetry={resetUpload}
            onSelectNewFile={selectNewFile} 
            errorMessage={error || results?.failedShipments?.[0]?.error || "Upload failed. Please check your file format and try again."}
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
      
      {results && pickupAddress && (results.batchResult || (uploadStatus === 'completed' && results.processedShipments?.some(s => s.label_url || s.label_urls))) && (
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
          singleShipmentPreview={{ 
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
