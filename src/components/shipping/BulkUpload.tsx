
import React from 'react';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkUploadProgressBar from './bulk-upload/BulkUploadProgressBar';
import OrderSummary from './bulk-upload/OrderSummary';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkLabelDownloadOptions from './bulk-upload/BulkLabelDownloadOptions';
import LabelGenerationProgress from './bulk-upload/LabelGenerationProgress';
import { useBulkUpload } from '@/hooks/useBulkUpload';

export const BulkUpload = () => {
  const {
    // Upload state
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    
    // Filters and sorting
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    
    // Address
    pickupAddress,
    
    // Setters
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    
    // Handlers
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
            pickupAddress={pickupAddress}
            onUpload={handleUpload}
            onAddressChange={setPickupAddress}
          />
        )}

        {uploadStatus === 'uploading' && (
          <BulkUploadProgressBar progress={progress} />
        )}

        {(uploadStatus === 'editing' || uploadStatus === 'success') && results && (
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
          />
        )}
      </div>

      {isCreatingLabels && (
        <LabelGenerationProgress />
      )}
    </div>
  );
};

export default BulkUpload;
