
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import ProgressTracker from './ProgressTracker';
import RateSelectionPage from './RateSelectionPage';
import SuccessPage from './SuccessPage';
import LabelGenerationProgress from './LabelGenerationProgress';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import CsvHeaderMapper from './CsvHeaderMapper';
import { useBulkUpload } from './useBulkUpload';

const BulkUploadView: React.FC = () => {
  const {
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isCreatingLabels,
    filteredShipments,
    pickupAddress,
    batchError,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    csvContent,
    showCsvMapper,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleCreateLabels,
    handleClearBatchError,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    handleCsvMappingComplete,
    handleCancelCsvMapping,
    setPickupAddress
  } = useBulkUpload();

  const [showPrintPreview, setShowPrintPreview] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);

  // Get current step for progress tracker
  const getCurrentStep = () => {
    if (uploadStatus === 'idle') return 'upload';
    if (uploadStatus === 'uploading' || isUploading) return 'processing';
    if (showCsvMapper) return 'processing'; // AI header mapping is part of processing
    if (uploadStatus === 'editing') {
      if (isFetchingRates) return 'rates';
      return 'selection';
    }
    if (isCreatingLabels || labelGenerationProgress.isGenerating) return 'labels';
    if (uploadStatus === 'success') return 'labels';
    return 'upload';
  };

  const getCompletedSteps = () => {
    const completed = [];
    if (uploadStatus !== 'idle') completed.push('upload');
    if (uploadStatus === 'editing' || uploadStatus === 'success') {
      completed.push('processing');
      if (!isFetchingRates) completed.push('rates');
    }
    if (uploadStatus === 'success') {
      completed.push('selection', 'labels');
    }
    return completed;
  };

  const handleDownloadConsolidated = (format: string) => {
    const batchId = results?.batchResult?.batchId;
    if (!batchId) return;
    
    const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/batch_labels';
    const url = `${baseUrl}/batch_label_${batchId}.${format}`;
    handleDownloadSingleLabel(url);
  };

  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    const shipment = filteredShipments.find(s => s.id === shipmentId);
    if (shipment) {
      const updatedShipment = { ...shipment, ...details };
      handleEditShipment(updatedShipment);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Tracker - Always visible when not idle */}
      {uploadStatus !== 'idle' && (
        <ProgressTracker
          currentStep={getCurrentStep()}
          isProcessing={isUploading || isFetchingRates || isCreatingLabels || showCsvMapper}
          completedSteps={getCompletedSteps()}
        />
      )}

      {/* File Upload Section */}
      {uploadStatus === 'idle' && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-3xl w-full">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <Upload className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Bulk Shipping Upload
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Upload your CSV file to create multiple shipping labels with advanced rate selection and batch processing
              </p>
            </div>
            
            <Card className="p-10 shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
              <BulkUploadForm
                onUploadSuccess={() => {}}
                onUploadFail={() => {}}
                onPickupAddressSelect={setPickupAddress}
                isUploading={isUploading}
                progress={progress}
                handleUpload={handleUpload}
              />
            </Card>
            
            <div className="mt-10 text-center">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="bg-white/90 backdrop-blur-lg border-gray-200 hover:bg-white shadow-lg"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AI CSV Header Mapping Section */}
      {showCsvMapper && csvContent && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <CsvHeaderMapper
            csvContent={csvContent}
            onMappingComplete={handleCsvMappingComplete}
            onCancel={handleCancelCsvMapping}
          />
        </div>
      )}

      {/* Processing Section */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && !showCsvMapper && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-12 max-w-xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-r-4 border-purple-600 animate-spin animate-reverse"></div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Processing Your Upload</h3>
              <p className="text-gray-600 mb-6 text-base">We're analyzing your shipment data and fetching the best rates...</p>
              {progress > 0 && progress < 100 && (
                <div className="space-y-3">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-3 rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-base font-semibold text-blue-600">{progress}% Complete</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Label Generation Progress */}
      <LabelGenerationProgress
        isGenerating={labelGenerationProgress.isGenerating}
        totalShipments={labelGenerationProgress.totalShipments}
        processedShipments={labelGenerationProgress.processedShipments}
        successfulShipments={labelGenerationProgress.successfulShipments}
        failedShipments={labelGenerationProgress.failedShipments}
        currentStep={labelGenerationProgress.currentStep}
        estimatedTimeRemaining={labelGenerationProgress.estimatedTimeRemaining}
      />

      {/* Rate Selection Page */}
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && !showCsvMapper && (
        <RateSelectionPage
          shipments={filteredShipments}
          isFetchingRates={isFetchingRates}
          batchError={typeof batchError === 'string' ? null : batchError}
          onSelectRate={handleSelectRate}
          onRemoveShipment={handleRemoveShipment}
          onEditShipment={handleEditShipmentWrapper}
          onRefreshRates={() => {}}
          onCreateLabels={handleCreateLabels}
          onClearBatchError={handleClearBatchError}
          isCreatingLabels={isCreatingLabels}
        />
      )}

      {/* Success Page */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <SuccessPage
          results={results}
          onDownloadPDF={() => {
            if (results.batchResult?.consolidatedLabelUrls?.pdf) {
              handleDownloadSingleLabel(results.batchResult.consolidatedLabelUrls.pdf);
            }
          }}
          onPrintPreview={() => setShowPrintPreview(true)}
          onEmailLabels={() => setShowEmailModal(true)}
          onDownloadConsolidated={handleDownloadConsolidated}
        />
      )}

      {/* Print Preview Modal */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={results?.batchResult || null}
      />

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={results?.batchResult || null}
      />
    </div>
  );
};

export default BulkUploadView;
