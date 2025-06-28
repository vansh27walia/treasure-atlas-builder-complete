
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import ProgressTracker from './ProgressTracker';
import CsvHeaderMapper from './CsvHeaderMapper';
import RateSelectionPage from './RateSelectionPage';
import SuccessNotification from './SuccessNotification';
import LabelGenerationProgress from './LabelGenerationProgress';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import { useBulkUpload } from './useBulkUpload';

const BulkUploadView: React.FC = () => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [showHeaderMapper, setShowHeaderMapper] = useState(false);
  
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
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleCreateLabels,
    handleClearBatchError,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setPickupAddress
  } = useBulkUpload();

  const [showPrintPreview, setShowPrintPreview] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);

  // Get current step for progress tracker
  const getCurrentStep = () => {
    if (showHeaderMapper) return 'processing';
    if (uploadStatus === 'idle') return 'upload';
    if (uploadStatus === 'uploading' || isUploading) return 'processing';
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
    if (uploadStatus !== 'idle' || showHeaderMapper) completed.push('upload');
    if (uploadStatus === 'editing' || uploadStatus === 'success') {
      completed.push('processing');
      if (!isFetchingRates) completed.push('rates');
    }
    if (uploadStatus === 'success') {
      completed.push('selection', 'labels');
    }
    return completed;
  };

  const handleFileUpload = async (file: File, pickupAddress: any) => {
    try {
      const text = await file.text();
      setCsvContent(text);
      
      // Check if headers need mapping
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const requiredFields = ['to_name', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country', 'weight', 'length', 'width', 'height'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        // Show header mapper for non-standard CSV
        setShowHeaderMapper(true);
      } else {
        // Direct upload for standard CSV
        handleUpload(file);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleMappingComplete = (convertedCsv: string) => {
    // Create a new file from converted CSV
    const blob = new Blob([convertedCsv], { type: 'text/csv' });
    const file = new File([blob], 'converted.csv', { type: 'text/csv' });
    
    setShowHeaderMapper(false);
    handleUpload(file);
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
      {(uploadStatus !== 'idle' || showHeaderMapper) && (
        <div className="w-full bg-white border-b border-gray-200 py-4">
          <div className="max-w-4xl mx-auto px-6">
            <ProgressTracker
              currentStep={getCurrentStep()}
              isProcessing={isUploading || isFetchingRates || isCreatingLabels || showHeaderMapper}
              completedSteps={getCompletedSteps()}
            />
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {uploadStatus === 'idle' && !showHeaderMapper && (
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
                handleUpload={handleFileUpload}
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

      {/* AI Header Mapping Section */}
      {showHeaderMapper && csvContent && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <CsvHeaderMapper
            csvContent={csvContent}
            onMappingComplete={handleMappingComplete}
            onCancel={() => {
              setShowHeaderMapper(false);
              setCsvContent('');
            }}
          />
        </div>
      )}

      {/* Processing Section */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && (
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
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <RateSelectionPage
          shipments={filteredShipments}
          isFetchingRates={isFetchingRates}
          batchError={batchError}
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
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-6">
            <SuccessNotification
              results={results}
              onDownloadAllLabels={() => {
                if (results.batchResult?.consolidatedLabelUrls?.pdf) {
                  handleDownloadSingleLabel(results.batchResult.consolidatedLabelUrls.pdf);
                }
              }}
              onDownloadSingleLabel={handleDownloadSingleLabel}
              onCreateLabels={handleCreateLabels}
              isPaying={false}
              isCreatingLabels={isCreatingLabels}
            />
          </div>
        </div>
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
