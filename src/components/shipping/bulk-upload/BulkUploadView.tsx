
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import LabelGenerationProgress from './LabelGenerationProgress';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import AdvancedProgressTracker from './AdvancedProgressTracker';
import { useBulkUpload } from './useBulkUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BulkUploadView: React.FC = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isCreatingLabels,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    batchError,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    handleClearBatchError,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    setPickupAddress
  } = useBulkUpload();

  const [showPrintPreview, setShowPrintPreview] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);

  // Get current step for progress tracker
  const getCurrentStep = () => {
    if (uploadStatus === 'idle') return 'upload';
    if (uploadStatus === 'uploading' || isUploading) return 'processing';
    if (uploadStatus === 'editing') {
      if (isFetchingRates) return 'rates';
      return 'selection';
    }
    if (isCreatingLabels || labelGenerationProgress.isGenerating) return 'labels';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Advanced Progress Tracker - Always visible when not idle */}
      {uploadStatus !== 'idle' && (
        <AdvancedProgressTracker
          currentStep={getCurrentStep()}
          isProcessing={isUploading || isFetchingRates || isCreatingLabels}
          completedSteps={getCompletedSteps()}
        />
      )}

      {/* File Upload Section - Clean, centered design */}
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
                onUploadSuccess={(uploadResults) => console.log('Upload successful:', uploadResults)}
                onUploadFail={(error) => console.error('Upload failed:', error)}
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

      {/* Processing Section - Enhanced with better visuals */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-16 max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur-lg">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-r-4 border-purple-600 animate-spin animate-reverse"></div>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-gray-900">Processing Your Upload</h3>
              <p className="text-gray-600 mb-8 text-lg">We're analyzing your shipment data and fetching the best rates...</p>
              {progress > 0 && progress < 100 && (
                <div className="space-y-4">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-4 rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{progress}% Complete</p>
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

      {/* Rate Selection Section - Clean layout without dev containers */}
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <div className="min-h-screen bg-white">
          {/* Batch Error Alert */}
          {batchError && (
            <div className="bg-red-50 border-b border-red-200 p-4">
              <Alert className="border-red-200 bg-red-50 max-w-6xl mx-auto">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>Batch Processing Error:</strong> Package #{batchError.packageNumber} encountered an issue. 
                    Please review and adjust the settings to continue.
                    <div className="mt-1 text-sm text-red-700">
                      {batchError.error}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearBatchError}
                    className="text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="max-w-7xl mx-auto p-8">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Rate Selection & Configuration</h1>
              <p className="text-xl text-gray-600">Review and select shipping rates for your shipments</p>
            </div>
            
            {isFetchingRates && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-4"></div>
                  <span className="text-blue-800 font-semibold text-lg">Fetching latest shipping rates...</span>
                </div>
              </div>
            )}
            
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <BulkShipmentsList
                shipments={filteredShipments}
                isFetchingRates={isFetchingRates}
                onSelectRate={handleSelectRate}
                onRemoveShipment={handleRemoveShipment}
                onEditShipment={(shipmentId: string, details: any) => {
                  console.log('Edit shipment:', shipmentId, details);
                }}
                onRefreshRates={() => {}}
              />
            </Card>
            
            {/* Create Labels Button - Prominent placement */}
            <div className="mt-10 flex justify-center">
              <Button
                onClick={handleCreateLabels}
                disabled={isCreatingLabels || !filteredShipments.some(s => s.selectedRateId)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-16 py-6 text-2xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                {isCreatingLabels ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-4"></div>
                    Creating Labels...
                  </>
                ) : (
                  <>
                    <Package className="mr-4 h-8 w-8" />
                    Create All Labels ({filteredShipments.filter(s => s.selectedRateId).length})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen - Consolidated actions */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="max-w-6xl mx-auto p-8">
            <div className="text-center mb-12">
              <div className="w-28 h-28 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <CheckCircle className="h-14 w-14 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Labels Created Successfully!
              </h1>
              <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
                Your shipping labels are ready. Choose your preferred action below.
              </p>
            </div>

            {/* Consolidated Action Buttons - Only 2 main options */}
            <div className="flex justify-center gap-8 mb-12">
              <Button
                onClick={() => {
                  if (results.batchResult?.consolidatedLabelUrls?.pdf) {
                    handleDownloadSingleLabel(results.batchResult.consolidatedLabelUrls.pdf);
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-8 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <Package className="mr-4 h-8 w-8" />
                Download PDF Labels
              </Button>

              <Button
                onClick={() => setShowPrintPreview(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-12 py-8 text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <FileText className="mr-4 h-8 w-8" />
                Print Preview & Options
              </Button>
            </div>

            {/* Success Summary */}
            <Card className="p-8 bg-white/80 backdrop-blur-lg shadow-xl border-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {results.processedShipments?.length || 0}
                  </div>
                  <div className="text-gray-600 font-medium">Labels Created</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    ${results.totalCost?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-gray-600 font-medium">Total Cost</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {results.batchResult ? 'Ready' : 'Processing'}
                  </div>
                  <div className="text-gray-600 font-medium">Batch Status</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Enhanced Print Preview Modal with all options */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={results?.batchResult || null}
      />

      {/* Enhanced Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={results?.batchResult || null}
      />
    </div>
  );
};

export default BulkUploadView;
