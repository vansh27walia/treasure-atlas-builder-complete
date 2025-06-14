
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
// import LabelCreationOverlay from './LabelCreationOverlay'; // Replaced by LabelGenerationProgress
import StripePaymentModal from './StripePaymentModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, AlertCircle, Download, CreditCard, Eye, Loader2 } from 'lucide-react';
import { SavedAddress, BulkShipment, BulkUploadResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import LabelGenerationProgress from './bulk-upload/LabelGenerationProgress';


const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showIndividualPrintPreview, setShowIndividualPrintPreview] = useState(false);
  const [currentShipmentForPreview, setCurrentShipmentForPreview] = useState<BulkShipment | null>(null);
  
  const {
    // file, // Not directly used in UI rendering here, but part of hook
    isUploading, 
    isPaying,
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
    setPickupAddress,
    // handleFileChange, 
    handleUpload,     
    handleCreateLabels,
    downloadBatchPdf,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    handleOpenBatchPrintPreview,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadTemplate, 
    handleDownloadSingleLabel, 
    handleDownloadLabelsWithFormat, 
    handleEmailLabels, 
    isFetchingRates, 
  } = useBulkUpload();

  const isCreatingLabels = labelGenerationProgress.isGenerating;

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    // The hook's setPickupAddress should handle this.
    // The AddressSelector should pass SavedAddress with string ID.
    setPickupAddress(address); 
    if (address) {
        const now = Date.now();
        if (typeof lastToastRef.current === 'number' && now - lastToastRef.current > 2000) {
            toast.success(`Selected pickup address: ${address.name || address.street1}`);
            lastToastRef.current = now;
        }
    }
  };

  const handleEditShipmentWrapper = (shipmentId: string, shipmentDetails: BulkShipment) => {
    handleEditShipment(shipmentId, shipmentDetails);
  };

  const processedShipmentsCount = results?.processedShipments?.length || 0;
  const readyToCreateLabelsCount = results?.processedShipments?.filter(s => s.selectedRateId && s.easypost_id).length || 0;
  const successfullyCreatedLabelsCount = results?.processedShipments?.filter(s => s.status === 'completed').length || 0;

  const handlePaymentSuccess = () => {
    toast.success('Payment successful!');
  };

  const handlePreviewIndividualLabel = (shipment: BulkShipment) => {
    setCurrentShipmentForPreview(shipment);
    setShowIndividualPrintPreview(true);
  };
  
  const onUploadSuccessCallback = (uploadResults: BulkUploadResult) => {
    console.log("Form upload success (client parsing done):", uploadResults);
  };

  const onUploadFailCallback = (error: string) => {
    console.error("Form upload failed (client parsing):", error);
  };

  const getActionButtonText = () => {
    if (isCreatingLabels) return 'Creating Labels...';
    if (readyToCreateLabelsCount > 0) return `Create ${readyToCreateLabelsCount} Labels`;
    return 'Create Labels';
  };

  return (
    <>
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} /> 
        
        {uploadStatus === 'idle' && (
          <BulkUploadForm 
            onUploadSuccess={onUploadSuccessCallback} 
            onUploadFail={onUploadFailCallback}
            onPickupAddressSelect={handlePickupAddressSelect} 
            isUploading={isUploading && uploadStatus === 'uploading'} // Specific to client parsing
            progress={progress}    
            handleUpload={handleUpload} 
            currentPickupAddress={pickupAddress}
          />
        )}
        
        {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
          <div className="my-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600 mb-4" />
            <h3 className="font-medium text-lg mb-2">
                {uploadStatus === 'uploading' ? 'Processing your file...' : 'Fetching shipment rates...'}
            </h3>
            {uploadStatus === 'uploading' && progress < 100 && (
                <Progress value={progress} className="h-2 w-1/2 mx-auto" />
            )}
            <p className="text-sm text-gray-500 mt-2">
              {uploadStatus === 'uploading' && progress < 100 
                ? `Parsing file (${progress}%)...` 
                : uploadStatus === 'uploading' ? 'File parsed, preparing to fetch rates...' : 'Please wait...'}
            </p>
          </div>
        )}

        <LabelGenerationProgress
            isGenerating={labelGenerationProgress.isGenerating}
            totalShipments={labelGenerationProgress.totalShipments}
            processedShipments={labelGenerationProgress.processedShipments}
            successfulShipments={labelGenerationProgress.successfulShipments}
            failedShipments={labelGenerationProgress.failedShipments}
            currentStep={labelGenerationProgress.currentStep}
            estimatedTimeRemaining={labelGenerationProgress.estimatedTimeRemaining}
        />
        
        {uploadStatus === 'editing' && results && !isCreatingLabels && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Bulk Shipment Options
                {isFetchingRates && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    Fetching rates...
                  </span>
                )}
              </h2>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                  <UploadCloud className="mr-1 h-4 w-4" /> Template
                </Button>
                <Button onClick={() => window.location.reload()} className="text-sm">
                  <UploadCloud className="mr-1 h-4 w-4" /> Upload Another File
                </Button>
              </div>
            </div>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Review Shipments</AlertTitle>
              <AlertDescription>
                Select carrier and service options. Edit details or remove shipments. Ensure pickup address is selected.
              </AlertDescription>
            </Alert>
            
            <BulkShipmentFilters
              searchTerm={searchTerm} onSearchChange={setSearchTerm}
              sortField={sortField} sortDirection={sortDirection}
              onSortChange={(field, direction) => { setSortField(field as any); setSortDirection(direction as any); }}
              selectedCarrier={selectedCarrierFilter} onCarrierFilterChange={setSelectedCarrierFilter}
              onApplyCarrierToAll={handleBulkApplyCarrier}
            />
            
            <BulkShipmentsList
              shipments={filteredShipments}
              isFetchingRates={isFetchingRates || false} 
              onSelectRate={handleSelectRate}
              onRemoveShipment={handleRemoveShipment}
              onEditShipment={handleEditShipmentWrapper}
              onRefreshRates={handleRefreshRates}
              onPreviewLabel={handlePreviewIndividualLabel}
            />
            
            {processedShipmentsCount > 0 && (
              <div className="mt-8 p-4 border rounded-lg bg-gray-50">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Order Summary</h3>
                    <p className="text-gray-600">
                      {processedShipmentsCount} shipments loaded. {readyToCreateLabelsCount} ready for labels.
                      Total cost for selected rates: ${results.totalCost?.toFixed(2) || '0.00'}
                    </p>
                    {pickupAddress && (
                      <p className="text-sm text-blue-600 mt-1">
                        <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4 lg:mt-0">
                    {results.batchResult && successfullyCreatedLabelsCount > 0 ? ( 
                       <Button 
                        onClick={handleOpenBatchPrintPreview}
                        disabled={isPaying || isCreatingLabels}
                        className="px-6 bg-purple-600 hover:bg-purple-700"
                       > <Eye className="mr-1 h-4 w-4" /> Batch Print/Download </Button>
                    ) : (
                       <Button 
                        onClick={handleCreateLabels} 
                        disabled={isPaying || isCreatingLabels || readyToCreateLabelsCount === 0 || !pickupAddress}
                        className="px-6 bg-green-600 hover:bg-green-700"
                       > <Download className="mr-1 h-4 w-4" /> {getActionButtonText()} </Button>
                    )}
                    {/* Payment button is optional and depends on workflow */}
                    {/* <Button onClick={() => setShowPaymentModal(true)} ... > Pay Labels </Button> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {uploadStatus === 'success' && results && !isCreatingLabels && (
          <SuccessNotification
            results={results}
            onDownloadAllLabels={() => { 
                if (results.batchResult?.consolidatedLabelUrls?.pdf) downloadBatchPdf();
                else if (handleOpenBatchPrintPreview) handleOpenBatchPrintPreview();
                else toast.error("No batch PDF or preview available.");
            }}
            onDownloadSingleLabel={handleDownloadSingleLabel} 
            isPaying={isPaying} 
            isCreatingLabels={isCreatingLabels} 
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview}
            onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
            onEmailLabels={handleEmailLabels}
          />
        )}
        
        {uploadStatus === 'error' && !isCreatingLabels && ( // Don't show if error happened during label creation if progress shows it
          <UploadError 
            onRetry={() => window.location.reload()} 
            onSelectNewFile={() => { 
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) { fileInput.value = ''; fileInput.click(); }
              else { window.location.reload(); }
            }}
            errorMessage={results?.failedShipments?.[0]?.error || "An error occurred. Please check details or try again."}
            failedShipments={results?.failedShipments}
          />
        )}
      </Card>

      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={results?.totalCost || 0}
        shipmentCount={processedShipmentsCount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {results?.batchResult && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult} 
          isBatchPreview={true}
        />
      )}

      {currentShipmentForPreview && (
        <PrintPreview
          isOpenProp={showIndividualPrintPreview}
          onOpenChangeProp={setShowIndividualPrintPreview}
          labelUrl={currentShipmentForPreview.label_urls?.pdf || currentShipmentForPreview.label_urls?.png || currentShipmentForPreview.label_url || ''}
          labelUrls={currentShipmentForPreview.label_urls}
          trackingCode={currentShipmentForPreview.tracking_code || currentShipmentForPreview.id}
          shipmentId={currentShipmentForPreview.id}
          isBatchPreview={false}
        />
      )}
    </>
  );
};

export default BulkUpload;

