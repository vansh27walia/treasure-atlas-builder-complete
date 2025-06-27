
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, PrinterIcon, AlertTriangle, X, Mail } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import LabelResultsTable from './LabelResultsTable';
import LabelGenerationProgress from './LabelGenerationProgress';
import BatchLabelCreationPage from './BatchLabelCreationPage';
import PrintPreview from '@/components/shipping/PrintPreview';
import BatchLabelControls from '@/components/shipping/BatchLabelControls';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import BulkLabelDownloadOptions from './BulkLabelDownloadOptions';
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

  const handleUploadSuccess = (uploadResults: any) => {
    console.log('Upload successful:', uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupAddress(address);
  };

  const handleBatchProcessed = (batchResult: any) => {
    console.log('Batch processed:', batchResult);
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handleDownloadConsolidated = (format: 'pdf' | 'zpl' | 'epl', url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `consolidated_labels_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadManifest = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `pickup_manifest_${Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadIndividualLabel = (labelUrl: string, format: string) => {
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `individual_label_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailConsolidated = () => {
    setShowEmailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* File Upload Section - Only show when idle */}
      {uploadStatus === 'idle' && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
              <Upload className="mr-3 h-8 w-8 text-blue-600" />
              Bulk Shipping Upload
            </h1>
            <p className="text-gray-600 mt-2">Upload your CSV file to create multiple shipping labels</p>
          </div>
          
          <Card className="p-6">
            <BulkUploadForm
              onUploadSuccess={handleUploadSuccess}
              onUploadFail={handleUploadFail}
              onPickupAddressSelect={handlePickupAddressSelect}
              isUploading={isUploading}
              progress={progress}
              handleUpload={handleUpload}
            />
          </Card>
          
          <div className="mt-6 text-center">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Download Template</span>
            </Button>
          </div>
        </div>
      )}

      {/* Processing Section */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Your Upload</h3>
              <p className="text-gray-600">Please wait while we process your shipment data...</p>
              {progress > 0 && progress < 100 && (
                <div className="mt-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
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

      {/* Rate Selection Full Screen */}
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <div className="min-h-screen bg-white">
          {/* Batch Error Alert */}
          {batchError && (
            <div className="bg-red-50 border-b border-red-200 p-4">
              <Alert className="border-red-200 bg-red-50 max-w-6xl mx-auto">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>Batch halted.</strong> Package #{batchError.packageNumber} couldn't be processed with the selected carrier. 
                    Please select a different carrier or fix the label details to proceed.
                    <div className="mt-1 text-sm text-red-700">
                      Error: {batchError.error}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearBatchError}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="font-semibold text-lg text-blue-800 mb-4">Rate Selection & Label Creation</h1>
              <p className="text-gray-600">Review shipping rates, configure insurance, and create your labels with AI assistance.</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border">
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
            </div>
            
            {/* Create Labels Button */}
            <div className="mt-6 flex justify-end">
              <div className="flex gap-4 items-center">
                <BatchLabelControls
                  selectedShipments={filteredShipments.filter(s => s.selectedRateId)}
                  pickupAddress={pickupAddress}
                  onBatchProcessed={handleBatchProcessed}
                />
                
                <Button
                  onClick={handleCreateLabels}
                  disabled={isCreatingLabels || !filteredShipments.some(s => s.selectedRateId)}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  {isCreatingLabels ? 'Creating Labels...' : 'Create Labels'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen with Batch Label Download Options */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-green-800 mb-4 flex items-center">
                <Package className="mr-3 h-8 w-8" />
                Labels Created Successfully!
              </h1>
              <p className="text-gray-600">Your shipping labels have been created. Choose from the download options below.</p>
            </div>

            {/* Batch Label Download Options */}
            <BulkLabelDownloadOptions
              batchResult={results.batchResult}
              processedLabels={results.processedShipments || []}
              onDownloadBatch={handleDownloadConsolidated}
              onDownloadManifest={handleDownloadManifest}
              onDownloadIndividual={handleDownloadIndividualLabel}
              onPrintPreview={handlePrintPreview}
              onEmailLabels={handleEmailConsolidated}
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
