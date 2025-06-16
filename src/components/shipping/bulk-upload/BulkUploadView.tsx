
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, PrinterIcon, AlertTriangle, X } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import LabelResultsTable from './LabelResultsTable';
import LabelGenerationProgress from './LabelGenerationProgress';
import PrintPreview from '@/components/shipping/PrintPreview';
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

  const handleUploadSuccess = (uploadResults: any) => {
    console.log('Upload successful:', uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupAddress(address);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Upload className="mr-3 h-8 w-8 text-blue-600" />
          Bulk Shipping Upload
        </h1>
        
        <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
          {uploadStatus === 'success' && results?.batchResult?.consolidatedLabelUrls?.pdf && !labelGenerationProgress.isGenerating && (
            <Button
              onClick={() => handleDownloadSingleLabel(results.batchResult!.consolidatedLabelUrls.pdf!)}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Batch PDF
            </Button>
          )}
          {uploadStatus === 'success' && results?.batchResult && !labelGenerationProgress.isGenerating && (
            <Button
              onClick={handleOpenBatchPrintPreview}
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print/Download Batch Output
            </Button>
          )}
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

      {/* Batch Error Alert */}
      {batchError && (
        <Alert className="border-red-200 bg-red-50">
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
      )}

      {/* File Upload Section */}
      {uploadStatus === 'idle' && (
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
      )}

      {/* Progress Section */}
      {(uploadStatus === 'uploading' || uploadStatus === 'editing' && !results?.processedShipments?.length) && (
        <Card className="p-6">
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

      {/* Shipment Rates Section - Now shows as full page instead of modal */}
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <div className="w-full">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Selection & Label Creation</h2>
              <p className="text-gray-600">Review shipping rates, configure insurance, and create your labels with AI assistance.</p>
            </div>
            
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
            
            {/* Create Labels Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleCreateLabels}
                disabled={isCreatingLabels || !filteredShipments.some(s => s.selectedRateId)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                {isCreatingLabels ? 'Creating Labels...' : 'Create Selected Labels'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Results Section */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="space-y-6">
          {results.processedShipments && results.processedShipments.length > 0 && (
            <LabelResultsTable
              shipments={results.processedShipments || []}
              onDownloadLabel={handleDownloadSingleLabel}
            />
          )}
        </div>
      )}

      {/* Batch Print Preview Modal */}
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
    </div>
  );
};

export default BulkUploadView;
