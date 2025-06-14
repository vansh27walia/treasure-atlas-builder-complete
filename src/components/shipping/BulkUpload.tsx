import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters, { SortField } from './bulk-upload/BulkShipmentFilters';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import LabelGenerationProgress from './bulk-upload/LabelGenerationProgress';
import { BulkUploadResult } from '@/types/shipping';

const BulkUpload: React.FC = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isPaying,
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
    console.log('Upload successful:', uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupAddress(address);
  };

  const handleSortChange = (field: SortField, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    console.log('Edit shipment:', shipmentId, details);
    handleEditShipment(shipmentId, details);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Upload className="mr-3 h-8 w-8 text-blue-600" />
            Bulk Shipping Upload
          </h1>
          <p className="text-gray-600 mt-2">Upload a CSV file to create multiple shipping labels at once</p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center space-x-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span>Download Template</span>
        </Button>
      </div>

      {/* File Upload Section */}
      {uploadStatus === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Shipment Data</CardTitle>
            <CardDescription>
              Upload a CSV file containing your shipment information. 
              <Button variant="link" className="p-0 h-auto text-blue-600 ml-1" onClick={handleDownloadTemplate}>
                Download our template
              </Button> to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BulkUploadForm
              onUploadSuccess={handleUploadSuccess}
              onUploadFail={handleUploadFail}
              onPickupAddressSelect={handlePickupAddressSelect}
              isUploading={isUploading}
              progress={progress}
              handleUpload={handleUpload}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {uploadStatus === 'uploading' ? 'Processing File...' : 'Fetching Shipping Rates...'}
                </h3>
                <p className="text-gray-600">
                  {uploadStatus === 'uploading' 
                    ? 'Reading and validating your shipment data'
                    : 'Getting the best rates from multiple carriers'
                  }
                </p>
                {progress > 0 && (
                  <div className="mt-4 w-64 mx-auto">
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
            </div>
          </CardContent>
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

      {/* Review and Edit Shipments */}
      {uploadStatus === 'editing' && results && filteredShipments && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                Review Shipments ({results.successful} processed)
              </CardTitle>
              <CardDescription>
                Review your shipments and rates below. You can edit details or select different rates before creating labels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkShipmentFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                selectedCarrier={selectedCarrierFilter}
                onCarrierFilterChange={setSelectedCarrierFilter}
                onApplyCarrierToAll={handleBulkApplyCarrier}
              />
            </CardContent>
          </Card>

          <BulkShipmentsList
            shipments={filteredShipments}
            isFetchingRates={isFetchingRates}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={handleEditShipmentWrapper}
            onRefreshRates={handleRefreshRates}
          />

          {results.processedShipments.some(s => s.selectedRateId) && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Ready to Create Labels</h3>
                    <p className="text-gray-600">
                      {results.processedShipments.filter(s => s.selectedRateId).length} shipments ready
                    </p>
                  </div>
                  <Button 
                    onClick={handleCreateLabels}
                    disabled={isCreatingLabels || isPaying}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isCreatingLabels ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Labels...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create All Labels
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Success Results */}
      {uploadStatus === 'success' && results && (
        <SuccessNotification
          results={results}
          onDownloadSingleLabel={handleDownloadSingleLabel}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
          onDownloadLabelsWithFormat={handleDownloadLabelsWithFormat}
          onEmailLabels={handleEmailLabels}
        />
      )}

      {/* Error State */}
      {uploadStatus === 'error' && results && (
        <UploadError
          onRetry={() => window.location.reload()}
          onSelectNewFile={() => window.location.reload()}
          errorMessage={results.errorMessage || 'An error occurred during upload'}
        />
      )}
    </div>
  );
};

export default BulkUpload;
