
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
    
    // Progress and modals
    labelGenerationProgress,
    
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
        onDownloadTemplate={handleDownloadTemplate}
      />

      <div className="space-y-8">
        {uploadStatus === 'idle' && (
          <BulkUploadForm
            handleUpload={handleUpload}
            onUploadSuccess={() => {}}
            onUploadFail={() => {}}
            onPickupAddressSelect={setPickupAddress}
          />
        )}

        {uploadStatus === 'uploading' && (
          <BulkUploadProgressBar 
            currentStep="upload"
            completedSteps={[]}
          />
        )}

        {(uploadStatus === 'editing' || uploadStatus === 'success') && results && (
          <>
            <OrderSummary
              successfulCount={results.processedShipments.length}
              totalCost={results.totalCost}
              totalInsurance={0}
              onDownloadAllLabels={handleDownloadAllLabels}
              onProceedToPayment={handlePaymentSuccess}
              isPaying={isPaying}
              isCreatingLabels={isCreatingLabels}
            />

            <BulkShipmentFilters
              searchTerm={searchTerm}
              sortField={sortField as 'recipient' | 'carrier' | 'rate'}
              sortDirection={sortDirection}
              selectedCarrier={selectedCarrierFilter}
              onSearchChange={setSearchTerm}
              onSortChange={(field: 'recipient' | 'carrier' | 'rate', direction) => {
                setSortField(field as any);
                setSortDirection(direction);
              }}
              onCarrierFilterChange={setSelectedCarrierFilter}
              onApplyCarrierToAll={handleBulkApplyCarrier}
            />

            <BulkShipmentsList
              shipments={filteredShipments}
              onSelectRate={handleSelectRate}
              onRemoveShipment={handleRemoveShipment}
              onEditShipment={(shipmentId: string, details: any) => handleEditShipment({ id: shipmentId, ...details })}
              pickupCountry={pickupAddress?.country || 'US'}
            />
          </>
        )}

        {results && results.batchResult && (
          <BulkLabelDownloadOptions
            batchResult={results.batchResult}
            processedLabels={results.processedShipments || []}
            onDownloadBatch={(format: string, url: string) => window.open(url, '_blank')}
            onDownloadManifest={(url: string) => window.open(url, '_blank')}
            onDownloadIndividual={(labelUrl: string) => window.open(labelUrl, '_blank')}
            onPrintPreview={() => {}}
            onEmailLabels={() => handleEmailLabels('admin@example.com')}
          />
        )}
      </div>

      {isCreatingLabels && labelGenerationProgress && (
        <LabelGenerationProgress 
          isGenerating={labelGenerationProgress.isGenerating}
          totalShipments={labelGenerationProgress.totalShipments}
          processedShipments={labelGenerationProgress.processedShipments}
          successfulShipments={labelGenerationProgress.successfulShipments}
          failedShipments={labelGenerationProgress.failedShipments}
          currentStep={labelGenerationProgress.currentStep}
          estimatedTimeRemaining={labelGenerationProgress.estimatedTimeRemaining}
        />
      )}
    </div>
  );
};

export default BulkUpload;
