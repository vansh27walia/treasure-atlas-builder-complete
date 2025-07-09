
import React, { useEffect, useRef, useState } from 'react';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import BulkUploadProgressTracker from './BulkUploadProgressTracker';
import EnhancedBulkUploadForm from './EnhancedBulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import BulkShipmentFilters from './BulkShipmentFilters';
import SuccessNotification from './SuccessNotification';
import UploadError from './UploadError';
import LabelCreationOverlay from '../LabelCreationOverlay';
import StripePaymentModal from '../StripePaymentModal';
import PrintPreview from '@/components/shipping/PrintPreview';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, Download, CreditCard, PrinterIcon, ArrowLeft } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

const FullScreenBulkUpload: React.FC = () => {
  const navigate = useNavigate();
  const lastToastRef = useRef<number>(0);
  const [currentProgressStep, setCurrentProgressStep] = useState<'upload' | 'mapping' | 'rates' | 'labels' | 'complete'>('upload');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
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
    isCreatingLabels,
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
    setPickupAddress,
    handleUpload,
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
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  // Update progress step based on upload status
  useEffect(() => {
    switch (uploadStatus) {
      case 'idle':
      case 'uploading':
        setCurrentProgressStep('upload');
        break;
      case 'editing':
        setCurrentProgressStep('rates');
        break;
      case 'success':
        setCurrentProgressStep('complete');
        break;
      default:
        setCurrentProgressStep('upload');
    }
  }, [uploadStatus]);

  // Log pickup address on mount and when it changes (less frequently)
  useEffect(() => {
    console.log("Current pickup address in FullScreenBulkUpload:", pickupAddress);
  }, [pickupAddress?.id]); // Only log when ID changes

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    if (address && address.id !== pickupAddress?.id) {
      console.log("Selected pickup address in FullScreenBulkUpload:", address);
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
    console.log("Upload success in FullScreenBulkUpload component:", uploadResults);
    setCurrentProgressStep('rates');
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in FullScreenBulkUpload component:", error);
    setCurrentProgressStep('upload');
  };

  const handleStepChange = (step: 'upload' | 'mapping' | 'rates' | 'labels' | 'complete') => {
    setCurrentProgressStep(step);
  };

  // Safely get processed shipments count
  const processedShipmentsCount = results?.processedShipments?.length || 0;

  const handleDownloadLabelsClick = async () => {
    if (!results?.processedShipments?.length) {
      toast.error('No shipments available for label creation');
      return;
    }

    setCurrentProgressStep('labels');
    setLabelProgress({
      isCreating: true,
      progress: 0,
      currentStep: 'Initializing label creation...',
      completed: 0,
      failed: 0
    });

    try {
      const totalShipments = results.processedShipments.length;
      
      // Simulate progress updates
      const updateProgress = (step: string, progress: number, completed: number, failed: number = 0) => {
        setLabelProgress({
          isCreating: true,
          progress,
          currentStep: step,
          completed,
          failed
        });
      };

      updateProgress('Creating shipments...', 20, 0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProgress('Generating labels...', 40, 0);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updateProgress('Converting to PDF...', 60, Math.floor(totalShipments * 0.6));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProgress('Creating batch files...', 80, Math.floor(totalShipments * 0.8));
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateProgress('Finalizing downloads...', 95, totalShipments - 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Call the actual label creation
      await handleCreateLabels();
      
      updateProgress('Download complete!', 100, totalShipments, 0);
      setCurrentProgressStep('complete');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setLabelProgress(prev => ({ ...prev, isCreating: false }));
        toast.success('All labels downloaded successfully!');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating labels:', error);
      setLabelProgress(prev => ({ 
        ...prev, 
        isCreating: false, 
        currentStep: 'Error occurred during label creation',
        failed: prev.failed + 1
      }));
      toast.error('Failed to create labels');
      setCurrentProgressStep('rates');
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Labels are now available for download.');
    setCurrentProgressStep('complete');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk Label Creation</h1>
              <p className="text-gray-600">Create multiple shipping labels at once</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      {/* Progress Tracker */}
      <BulkUploadProgressTracker 
        currentStep={currentProgressStep}
        isProcessing={isUploading || isFetchingRates || isCreatingLabels}
      />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Upload and Mapping Steps */}
        {(uploadStatus === 'idle' || uploadStatus === 'uploading') && (
          <EnhancedBulkUploadForm 
            onUploadSuccess={handleUploadSuccess}
            onUploadFail={handleUploadFail}
            onPickupAddressSelect={handlePickupAddressSelect}
            onStepChange={handleStepChange}
            isUploading={isUploading}
            progress={progress}
            handleUpload={handleUpload}
          />
        )}
        
        {/* Rate Selection and Review */}
        {uploadStatus === 'editing' && results && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <FileText className="mr-3 h-6 w-6 text-blue-600" />
                Review & Configure Shipments
                {isFetchingRates && (
                  <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full animate-pulse">
                    Fetching rates...
                  </span>
                )}
              </h2>
              <p className="text-gray-600">
                Review your shipments, select carriers and services, then create labels
              </p>
            </div>
            
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-800">Review Your Shipments</AlertTitle>
              <AlertDescription className="text-blue-700">
                Select carrier and service options for each shipment. You can edit address details or remove shipments before proceeding.
              </AlertDescription>
            </Alert>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
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
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              <BulkShipmentsList
                shipments={filteredShipments}
                isFetchingRates={isFetchingRates}
                onSelectRate={handleSelectRate}
                onRemoveShipment={handleRemoveShipment}
                onEditShipment={(shipmentId: string, details: any) => {
                  const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
                  if (shipment) {
                    handleEditShipment(shipment);
                  }
                }}
                onRefreshRates={handleRefreshRates}
              />
            </div>
            
            {processedShipmentsCount > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Order Summary</h3>
                    <p className="text-gray-600 mt-1">
                      {processedShipmentsCount} shipments selected with a total cost of ${results.totalCost?.toFixed(2) || '0.00'}
                    </p>
                    {pickupAddress && (
                      <p className="text-sm text-blue-600 mt-2">
                        <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-4 mt-4 lg:mt-0">
                    <Button 
                      onClick={handleDownloadLabelsClick}
                      disabled={isPaying || isCreatingLabels || processedShipmentsCount === 0 || !pickupAddress}
                      size="lg"
                      className="px-8 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      {isCreatingLabels ? 'Creating...' : 'Download Labels'}
                    </Button>
                    
                    <Button
                      onClick={() => setShowPaymentModal(true)}
                      disabled={isPaying || processedShipmentsCount === 0 || !pickupAddress}
                      size="lg"
                      className="px-8 bg-blue-600 hover:bg-blue-700"
                    >
                      <CreditCard className="mr-2 h-5 w-5" />
                      Pay for Labels
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Success State */}
        {uploadStatus === 'success' && results && (
          <div className="max-w-4xl mx-auto">
            {results.bulk_label_pdf_url && (
              <div className="flex justify-end mb-6">
                <Button onClick={() => setShowPrintPreview(true)} size="lg">
                  <PrinterIcon className="mr-2 h-5 w-5" />
                  Preview All Labels
                </Button>
              </div>
            )}
            <SuccessNotification
              results={results}
              onDownloadAllLabels={handleDownloadAllLabels}
              onDownloadSingleLabel={handleDownloadSingleLabel}
              onCreateLabels={handleCreateLabels}
              isPaying={isPaying}
              isCreatingLabels={isCreatingLabels}
            />
          </div>
        )}
        
        {/* Error State */}
        {uploadStatus === 'error' && (
          <div className="max-w-2xl mx-auto">
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
          </div>
        )}
      </div>

      {/* Modals and Overlays */}
      <LabelCreationOverlay
        isVisible={labelProgress.isCreating}
        progress={labelProgress.progress}
        currentStep={labelProgress.currentStep}
        totalLabels={processedShipmentsCount}
        completedLabels={labelProgress.completed}
        failedLabels={labelProgress.failed}
        onClose={() => setLabelProgress(prev => ({ ...prev, isCreating: false }))}
      />

      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={results?.totalCost || 0}
        shipmentCount={processedShipmentsCount}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {results?.bulk_label_pdf_url && results.batchResult && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={results.bulk_label_pdf_url}
          trackingCode={null}
          isBatchPreview={true}
          batchResult={results.batchResult}
        />
      )}
    </div>
  );
};

export default FullScreenBulkUpload;
