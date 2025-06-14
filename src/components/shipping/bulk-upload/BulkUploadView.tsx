import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, PrinterIcon, XCircle } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import LabelResultsTable from './LabelResultsTable';
import PrintPreview from '@/components/shipping/PrintPreview';
import { useBulkUpload } from './useBulkUpload';
import { BulkUploadResult } from '@/types/shipping';

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
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
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

  const handleUploadSuccess = (uploadResults: BulkUploadResult) => {
    console.log('Upload successful in BulkUploadView:', uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed in BulkUploadView:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    // Ensure address.id is string if needed by setPickupAddress
    if (address && typeof address.id === 'number') {
      setPickupAddress({ ...address, id: String(address.id) });
    } else {
      setPickupAddress(address);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Upload className="mr-3 h-8 w-8 text-blue-600" />
          Bulk Shipping Upload
        </h1>
        
        <div className="flex gap-2">
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

      {uploadStatus === 'idle' && !isUploading && (
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

      {(isUploading || (uploadStatus === 'uploading' && progress < 100)) && (
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">
              {uploadStatus === 'uploading' ? 'Uploading & Processing File...' : 'Processing Your Upload'}
            </h3>
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
             {progress === 100 && uploadStatus === 'uploading' && (
                <p className="text-sm text-green-600 mt-2">File processed, preparing shipments...</p>
            )}
          </div>
        </Card>
      )}

      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <BulkShipmentsList
          shipments={filteredShipments}
          isFetchingRates={isFetchingRates}
          isCreatingLabels={isCreatingLabels}
          onSelectRate={handleSelectRate}
          onRemoveShipment={handleRemoveShipment}
          onEditShipment={(shipmentId: string, details: any) => {
            handleEditShipment(shipmentId, details);
          }}
          onRefreshRates={handleRefreshRates}
        />
      )}

      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="space-y-6">
          {results.processedShipments && results.processedShipments.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Processed Shipments & Labels</h3>
              <LabelResultsTable
                shipments={results.processedShipments || []}
                onDownloadLabel={(_shipmentId, url, format) => handleDownloadSingleLabel(url, format)}
              />
            </Card>
          )}
        </div>
      )}

      {uploadStatus === 'error' && !isUploading && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center text-red-700">
            <XCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Failed</h3>
            <p>There was an error processing your file. Please check the file and try again, or download the template for guidance.</p>
          </div>
        </Card>
      )}

      {results?.batchResult && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult}
          processedShipments={results.processedShipments || []}
          isBatchPreview={true}
          onDownloadFormat={handleDownloadLabelsWithFormat}
          pickupAddress={pickupAddress}
        />
      )}
    </div>
  );
};

export default BulkUploadView;
