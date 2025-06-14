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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, ChevronRight, AlertCircle, Download, CreditCard, Eye } from 'lucide-react';
import { SavedAddress, BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import PrintPreview from '@/components/shipping/PrintPreview';

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
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [currentShipmentForPreview, setCurrentShipmentForPreview] = useState<BulkShipment | null>(null);
  
  const {
    file,
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
  } = useBulkUpload();

  const isCreatingLabels = labelGenerationProgress.isGenerating;

  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]);

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    if (address && address.id !== pickupAddress?.id) {
      console.log("Selected pickup address in BulkUpload:", address);
      setPickupAddress(address);
      
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

  const processedShipmentsCount = results?.processedShipments?.length || 0;

  const handleDownloadLabelsClick = async () => {
    if (!results?.processedShipments?.length) {
      toast.error('No shipments available for label creation');
      return;
    }

    setLabelProgress({
      isCreating: true,
      progress: 0,
      currentStep: 'Initializing label creation...',
      completed: 0,
      failed: 0
    });

    try {
      const totalShipments = results.processedShipments.length;
      
      const updateProgress = (step: string, progressVal: number, completed: number, failed: number = 0) => {
        setLabelProgress({
          isCreating: true,
          progress: progressVal,
          currentStep: step,
          completed,
          failed
        });
      };

      updateProgress('Requesting label generation...', 10, 0);
      await handleCreateLabels();
      
      updateProgress('Processing complete!', 100, totalShipments, 0);
      
      setTimeout(() => {
        setLabelProgress(prev => ({ ...prev, isCreating: false }));
        toast.success('All labels downloaded successfully!');
      }, 2000);
      
    } catch (error) {
      console.error('Error during label creation trigger:', error);
      setLabelProgress(prev => ({ 
        ...prev, 
        isCreating: false, 
        currentStep: 'Error occurred during label creation trigger',
        failed: prev.failed + (results?.processedShipments.length || 0) 
      }));
      toast.error('Failed to initiate label creation');
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Labels are now available for download.');
  };

  const handlePreviewIndividualLabel = (shipment: BulkShipment) => {
    setCurrentShipmentForPreview(shipment);
    setShowPrintPreview(true);
  };

  return (
    <>
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
        
        {uploadStatus === 'idle' && (
          <BulkUploadForm 
            onUploadSuccess={() => console.log('Upload success')}
            onUploadFail={(error) => console.error('Upload failed:', error)}
            onPickupAddressSelect={(address) => {
              if (address && address.id !== pickupAddress?.id) {
                setPickupAddress(address);
                const now = Date.now();
                if (now - lastToastRef.current > 2000) {
                  toast.success(`Selected pickup address: ${address.name || address.street1}`);
                  lastToastRef.current = now;
                }
              }
            }}
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
        
        {uploadStatus === 'editing' && results && !labelGenerationProgress.isGenerating && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Bulk Shipment Options
                {results.isFetchingRates && (
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
              isFetchingRates={results.isFetchingRates || false}
              onSelectRate={handleSelectRate}
              onRemoveShipment={handleRemoveShipment}
              onEditShipment={(shipmentId: string, details: any) => {
                handleEditShipment(details as BulkShipment);
              }}
              onRefreshRates={handleRefreshRates}
              onPreviewLabel={handlePreviewIndividualLabel}
            />
            
            {processedShipmentsCount > 0 && (
              <div className="mt-8 p-4 border rounded-lg bg-gray-50">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Order Summary</h3>
                    <p className="text-gray-600">
                      {processedShipmentsCount} shipments selected with a total cost of ${results.totalCost?.toFixed(2) || '0.00'}
                    </p>
                    {pickupAddress && (
                      <p className="text-sm text-blue-600 mt-1">
                        <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3 mt-4 lg:mt-0">
                    {results.batchResult ? (
                       <Button 
                        onClick={handleOpenBatchPrintPreview}
                        disabled={isPaying || isCreatingLabels}
                        className="px-6 bg-purple-600 hover:bg-purple-700"
                       >
                        <Eye className="mr-1 h-4 w-4" />
                        Batch Print/Download
                       </Button>
                    ) : (
                       <Button 
                        onClick={handleDownloadLabelsClick}
                        disabled={isPaying || isCreatingLabels || processedShipmentsCount === 0 || !pickupAddress || !results.processedShipments.every(s => s.selectedRateId)}
                        className="px-6 bg-green-600 hover:bg-green-700"
                       >
                        <Download className="mr-1 h-4 w-4" />
                        {isCreatingLabels ? 'Creating Labels...' : 'Create & Download Labels'}
                       </Button>
                    )}
                    
                    <Button
                      onClick={() => setShowPaymentModal(true)}
                      disabled={isPaying || processedShipmentsCount === 0 || !pickupAddress || isCreatingLabels}
                      className="px-6 bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="mr-1 h-4 w-4" />
                      Pay Labels
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
          <SuccessNotification
            results={results}
            onDownloadAllLabels={() => {
              if (results.batchResult?.consolidatedLabelUrls?.pdf) {
                downloadBatchPdf();
              } else {
                toast.info('Batch PDF not available. Open Batch Print/Download for other options.');
                if (handleOpenBatchPrintPreview) handleOpenBatchPrintPreview();
              }
            }}
            onDownloadSingleLabel={handleDownloadSingleLabel}
            onCreateLabels={handleCreateLabels}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
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

      {/* Label Creation Overlay (local progress for initial trigger) */}
      <LabelCreationOverlay
        isVisible={labelProgress.isCreating && !labelGenerationProgress.isGenerating}
        progress={labelProgress.progress}
        currentStep={labelProgress.currentStep}
        totalLabels={processedShipmentsCount}
        completedLabels={labelProgress.completed}
        failedLabels={labelProgress.failed}
        onClose={() => setLabelProgress(prev => ({ ...prev, isCreating: false }))}
      />

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={results?.totalCost || 0}
        shipmentCount={processedShipmentsCount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Main Batch Print Preview Modal */}
      {results?.batchResult && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          labelUrl=""
          trackingCode={null}
          batchResult={results.batchResult}
          isBatchPreview={true}
        />
      )}

      {/* Individual Print Preview Modal */}
      {currentShipmentForPreview && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={currentShipmentForPreview.label_urls?.png || currentShipmentForPreview.label_url || ''}
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
