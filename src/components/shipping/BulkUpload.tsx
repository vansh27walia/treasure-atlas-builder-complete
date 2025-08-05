import React from 'react';
import { BulkUploadHeader } from './bulk-upload/BulkUploadHeader';
import { BulkUploadForm } from './bulk-upload/BulkUploadForm';
import { BulkUploadProgressBar } from './bulk-upload/BulkUploadProgressBar';
import { OrderSummary } from './bulk-upload/OrderSummary';
import { BulkShipmentFilters } from './bulk-upload/BulkShipmentFilters';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import { BulkLabelDownloadOptions } from './bulk-upload/BulkLabelDownloadOptions';
import { BatchPrintPreviewModal } from './bulk-upload/BatchPrintPreviewModal';
import { LabelGenerationProgress } from './bulk-upload/LabelGenerationProgress';
import { useBulkUpload } from '@/hooks/useBulkUpload';

export const BulkUpload = () => {
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
    batchError,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    handleFileChange,
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
    handleClearBatchError,
    handleOpenBatchPrintPreview,
    handlePaymentSuccess
  } = useBulkUpload();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BulkUploadHeader 
        uploadStatus={uploadStatus}
        results={results}
        onDownloadTemplate={handleDownloadTemplate}
      />

      <div className="space-y-8">
        {uploadStatus === 'idle' && (
          <BulkUploadForm
            file={file}
            pickupAddress={pickupAddress}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            onAddressChange={setPickupAddress}
          />
        )}

        {uploadStatus === 'uploading' && (
          <BulkUploadProgressBar progress={progress} />
        )}

        {(uploadStatus === 'editing' || uploadStatus === 'creating-labels' || uploadStatus === 'success') && results && (
          <>
            <OrderSummary
              results={results}
              onCreateLabels={handleCreateLabels}
              isCreatingLabels={isCreatingLabels}
              uploadStatus={uploadStatus}
              onPaymentSuccess={handlePaymentSuccess}
            />

            <BulkShipmentFilters
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
              onBulkApply={handleBulkApplyCarrier}
              shipments={results.processedShipments}
            />

            <BulkShipmentsList
              shipments={filteredShipments}
              onSelectRate={handleSelectRate}
              onRemoveShipment={handleRemoveShipment}
              onEditShipment={handleEditShipment}
              pickupCountry={pickupAddress?.country || 'US'}
            />
          </>
        )}

        {results && results.batchResult && (
          <BulkLabelDownloadOptions
            batchResult={results.batchResult}
            onDownloadLabels={handleDownloadLabelsWithFormat}
            onEmailLabels={handleEmailLabels}
            onOpenPrintPreview={handleOpenBatchPrintPreview}
          />
        )}
      </div>

      <BatchPrintPreviewModal
        isOpen={batchPrintPreviewModalOpen}
        onClose={() => setBatchPrintPreviewModalOpen(false)}
        labelUrls={results?.processedShipments?.map(s => s.label_url).filter(Boolean) || []}
        batchResult={results?.batchResult}
      />

      {labelGenerationProgress.isGenerating && (
        <LabelGenerationProgress progress={labelGenerationProgress} />
      )}
    </div>
  );
};
