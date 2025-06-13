
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download } from 'lucide-react';
import FileUploadArea from './FileUploadArea';
import ShipmentRatesList from './ShipmentRatesList';
import LabelResultsTable from './LabelResultsTable';
import LabelGenerationProgress from './LabelGenerationProgress';
import BulkLabelDownloadOptions from './BulkLabelDownloadOptions';
import { useBulkUpload } from './useBulkUpload';

const BulkUploadView: React.FC = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isCreatingLabels,
    showLabelOptions,
    downloadFormat,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    labelGenerationProgress,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setShowLabelOptions,
    setDownloadFormat,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Upload className="mr-3 h-8 w-8 text-blue-600" />
          Bulk Shipping Upload
        </h1>
        
        <Button
          onClick={handleDownloadTemplate}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Download Template</span>
        </Button>
      </div>

      {/* File Upload Section */}
      {uploadStatus === 'idle' && (
        <Card className="p-6">
          <FileUploadArea
            file={file}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
          />
        </Card>
      )}

      {/* Progress Section */}
      {(uploadStatus === 'uploading' || uploadStatus === 'editing') && (
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Your Upload</h3>
            <p className="text-gray-600">Please wait while we process your shipment data...</p>
            {progress && (
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

      {/* Shipment Rates Section */}
      {uploadStatus === 'editing' && results && (
        <ShipmentRatesList
          shipments={filteredShipments}
          isLoading={isFetchingRates}
          searchTerm={searchTerm}
          sortField={sortField}
          sortDirection={sortDirection}
          selectedCarrierFilter={selectedCarrierFilter}
          onSearchChange={setSearchTerm}
          onSortChange={(field, direction) => {
            setSortField(field);
            setSortDirection(direction);
          }}
          onCarrierFilterChange={setSelectedCarrierFilter}
          onSelectRate={handleSelectRate}
          onRemoveShipment={handleRemoveShipment}
          onEditShipment={handleEditShipment}
          onRefreshRates={handleRefreshRates}
          onBulkApplyCarrier={handleBulkApplyCarrier}
          onCreateLabels={handleCreateLabels}
          isCreatingLabels={isCreatingLabels || labelGenerationProgress.isGenerating}
        />
      )}

      {/* Results Section */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="space-y-6">
          {/* Bulk Download Options */}
          {results.batchResult && (
            <BulkLabelDownloadOptions
              batchResult={results.batchResult}
              onDownloadBatch={handleDownloadLabelsWithFormat}
              onDownloadManifest={(url) => window.open(url, '_blank')}
            />
          )}

          {/* Individual Labels */}
          <LabelResultsTable
            shipments={results.processedShipments || []}
            onDownloadLabel={handleDownloadSingleLabel}
          />
        </div>
      )}
    </div>
  );
};

export default BulkUploadView;
