
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters, { SortField as BulkSortField } from './bulk-upload/BulkShipmentFilters'; // Import SortField type
import StripePaymentModal from './StripePaymentModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, AlertCircle, Download, CreditCard, Eye, Loader2 } from 'lucide-react';
import { SavedAddress, BulkShipment, BulkUploadResult, BatchResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';
import LabelGenerationProgress from './bulk-upload/LabelGenerationProgress';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showIndividualPrintPreview, setShowIndividualPrintPreview] = useState(false);
  const [currentShipmentForPreview, setCurrentShipmentForPreview] = useState<BulkShipment | null>(null);
  
  const {
    isUploading, 
    isPaying,
    uploadStatus, 
    results,    
    progress, 
    searchTerm,
    sortField, // This is from useBulkUpload, should match BulkSortField
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    labelGenerationProgress, 
    setPickupAddress,
    handleUpload,     
    handleCreateLabels,
    downloadBatchPdf, // This one might be for a specific format, PrintPreview is more general
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment, 
    handleRefreshRates,
    handleBulkApplyCarrier,
    setSearchTerm,
    setSortField, // Ensure this setter accepts BulkSortField
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
    setPickupAddress(address); 
    if (address) {
        const now = Date.now();
        if (now - lastToastRef.current > 2000) { // Avoid toast spam
            toast.success(`Selected pickup address: ${address.name || address.street1}`);
            lastToastRef.current = now;
        }
    }
  };

  // Wrapper to match BulkShipmentsList's onEditShipment prop
  const handleEditShipmentWrapper = (shipmentId: string, shipmentDetails: Partial<BulkShipment>) => {
    handleEditShipment(shipmentId, shipmentDetails); // hook's handleEditShipment takes Partial<BulkShipment>
  };


  const processedShipmentsCount = results?.processedShipments?.length || 0;
  const readyToCreateLabelsCount = results?.processedShipments?.filter(s => s.selectedRateId && s.easypost_id).length || 0;
  const successfullyCreatedLabelsCount = results?.processedShipments?.filter(s => s.status === 'completed').length || 0;

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false); // Close modal on success
    toast.success('Payment successful! Labels are being generated.');
    // Label creation should be triggered by the hook after payment, or here if needed
    // For now, assuming hook handles it post-payment.
  };

  const handlePreviewIndividualLabel = (shipment: BulkShipment) => {
    setCurrentShipmentForPreview(shipment);
    setShowIndividualPrintPreview(true);
  };
  
  const onUploadSuccessCallback = (uploadResults: BulkUploadResult) => {
    console.log("File parsing and initial processing complete:", uploadResults);
    // This callback is mostly for the BulkUploadForm, main logic in useBulkUpload hook
  };

  const onUploadFailCallback = (error: string) => {
    console.error("File parsing failed:", error);
    // This callback is mostly for the BulkUploadForm
  };

  const getActionButtonText = () => {
    if (isCreatingLabels) return 'Creating Labels...';
    if (readyToCreateLabelsCount > 0) return `Create ${readyToCreateLabelsCount} Labels`;
    return 'Create Labels';
  };
  
  const isParsingFile = uploadStatus === 'uploading' && progress < 100;

  return (
    <>
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} /> 
        
        {uploadStatus === 'idle' && ( // Show form only when idle
          <BulkUploadForm 
            onUploadSuccess={onUploadSuccessCallback} 
            onUploadFail={onUploadFailCallback}
            onPickupAddressSelect={handlePickupAddressSelect} 
            isUploading={isUploading} // Pass the overall isUploading state from hook
            progress={progress}    
            handleUpload={handleUpload} 
            currentPickupAddress={pickupAddress} // Pass current pickup address
          />
        )}
        
        {/* Combined loading state for uploading (parsing) and processing (fetching rates) */}
        {(uploadStatus === 'uploading' || (uploadStatus === 'processing' && isFetchingRates)) && !isCreatingLabels && (
          <div className="my-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600 mb-4" />
            <h3 className="font-medium text-lg mb-2">
                {isParsingFile ? 'Processing your file...' : 'Fetching shipment rates...'}
            </h3>
            {isParsingFile && (
                <Progress value={progress} className="h-2 w-1/2 mx-auto" />
            )}
            <p className="text-sm text-gray-500 mt-2">
              {isParsingFile 
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
                {(isFetchingRates || results.isFetchingRates) && ( 
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                    Fetching rates...
                  </span>
                )}
              </h2>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                  <UploadCloud className="mr-1 h-4 w-4" /> Template
                </Button>
                <Button onClick={() => window.location.reload()} className="text-sm"> {/* Simpler reset */}
                  <UploadCloud className="mr-1 h-4 w-4" /> Upload Another File
                </Button>
              </div>
            </div>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Review Shipments</AlertTitle>
              <AlertDescription>
                Select carrier and service options for each shipment. You can edit details or remove shipments if needed. Ensure a pickup address is selected above.
              </AlertDescription>
            </Alert>
            
            <BulkShipmentFilters
              searchTerm={searchTerm} onSearchChange={setSearchTerm}
              sortField={sortField as BulkSortField} sortDirection={sortDirection} // Cast sortField
              onSortChange={(field, direction) => { setSortField(field); setSortDirection(direction); }}
              selectedCarrier={selectedCarrierFilter} onCarrierFilterChange={setSelectedCarrierFilter}
              onApplyCarrierToAll={handleBulkApplyCarrier}
            />
            
            <BulkShipmentsList
              shipments={filteredShipments}
              isFetchingRates={isFetchingRates || results.isFetchingRates || false} 
              onSelectRate={handleSelectRate}
              onRemoveShipment={handleRemoveShipment}
              onEditShipment={handleEditShipmentWrapper} // Use the wrapper
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
                    {successfullyCreatedLabelsCount > 0 && results.batchResult ? ( 
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
                  </div>
                </div>
                 {!pickupAddress && <p className="text-red-500 text-xs mt-2">A pickup address must be selected to create labels.</p>}
              </div>
            )}
          </div>
        )}
        
        {uploadStatus === 'success' && results && !isCreatingLabels && (
          <SuccessNotification
            results={results}
            onDownloadAllLabels={downloadBatchPdf} 
            onDownloadSingleLabel={handleDownloadSingleLabel} 
            isPaying={isPaying} 
            isCreatingLabels={isCreatingLabels} 
            onOpenBatchPrintPreview={handleOpenBatchPrintPreview} // Pass prop
            onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
            onEmailLabels={handleEmailLabels}
          />
        )}
        
        {uploadStatus === 'error' && results && !isCreatingLabels && ( // Ensure results object exists for failedShipments
          <UploadError 
            onRetry={() => window.location.reload()} 
            onSelectNewFile={() => window.location.reload()}
            errorMessage={results?.errorMessage || results?.failedShipments?.[0]?.error || "An error occurred. Please check details or try again."}
            failedShipments={results?.failedShipments || []} // Pass prop
          />
        )}
      </Card>

      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={results?.totalCost || 0}
        shipmentCount={readyToCreateLabelsCount} // Pay for labels ready to be created
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Batch Print Preview */}
      {results?.batchResult && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult} 
          isBatchPreview={true}
          scanFormUrl={results.batchResult.scanFormUrl} // Pass scanFormUrl
        />
      )}

      {/* Individual Shipment Print Preview */}
      {currentShipmentForPreview && (
        <PrintPreview
          isOpenProp={showIndividualPrintPreview}
          onOpenChangeProp={(isOpen) => {
            setShowIndividualPrintPreview(isOpen);
            if (!isOpen) setCurrentShipmentForPreview(null); // Clear selection on close
          }}
          labelUrl={currentShipmentForPreview.label_urls?.pdf || currentShipmentForPreview.label_urls?.png || currentShipmentForPreview.label_url || ''}
          labelUrls={currentShipmentForPreview.label_urls}
          trackingCode={currentShipmentForPreview.tracking_code || currentShipmentForPreview.id}
          shipmentId={currentShipmentForPreview.id}
          isBatchPreview={false}
          shipmentDetails={{ 
            fromAddress: pickupAddress ? `${pickupAddress.name || pickupAddress.street1}, ${pickupAddress.city}` : 'N/A',
            toAddress: `${currentShipmentForPreview.customer_name || currentShipmentForPreview.recipient}, ${currentShipmentForPreview.street1}, ${currentShipmentForPreview.city}`,
            weight: `${currentShipmentForPreview.weight} oz`, 
            dimensions: `${currentShipmentForPreview.length}x${currentShipmentForPreview.width}x${currentShipmentForPreview.height} in`,
            service: currentShipmentForPreview.service || 'N/A',
            carrier: currentShipmentForPreview.carrier || 'N/A',
          }}
          scanFormUrl={currentShipmentForPreview.scan_form_url} // If individual scan forms exist
        />
      )}
    </>
  );
};

export default BulkUpload;

