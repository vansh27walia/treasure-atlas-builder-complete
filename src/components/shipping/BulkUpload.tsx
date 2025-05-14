
import React from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import LabelOptionsModal from './bulk-upload/LabelOptionsModal';
import LabelPreviewModal from './bulk-upload/LabelPreviewModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, ChevronRight, AlertCircle } from 'lucide-react';

const BulkUpload: React.FC = () => {
  const {
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    showLabelOptions,
    showLabelPreview,
    labelPreviewUrl,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    handleUpload,
    handleProceedToPayment,
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
    setShowLabelOptions,
    setShowLabelPreview,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  return (
    <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
      <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
      
      {uploadStatus === 'idle' && (
        <BulkUploadForm 
          onUpload={handleUpload}
          isUploading={isUploading}
          progress={progress}
        />
      )}
      
      {isUploading && (
        <div className="my-6">
          <h3 className="font-medium mb-2">Processing your shipments</h3>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 mt-2">
            {progress < 100 
              ? `Processing shipments (${progress}%)...` 
              : 'Processing complete! Preparing shipment options...'}
          </p>
        </div>
      )}
      
      {uploadStatus === 'editing' && results && (
        <div className="mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              Bulk Shipment Options
              {isFetchingRates && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full animate-pulse">
                  Fetching rates...
                </span>
              )}
            </h2>
            
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button variant="outline" onClick={handleDownloadTemplate} className="text-sm">
                <UploadCloud className="mr-1 h-4 w-4" />
                Template
              </Button>
              
              <Button onClick={() => handleUpload} className="text-sm">
                <UploadCloud className="mr-1 h-4 w-4" />
                Upload Another File
              </Button>
            </div>
          </div>
          
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Select carrier and service options for each shipment. You can edit address details or remove shipments before proceeding.
            </AlertDescription>
          </Alert>
          
          <BulkShipmentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={(field, direction) => {
              setSortField(field);
              setSortDirection(direction);
            }}
            selectedCarrier={selectedCarrierFilter}
            onCarrierFilterChange={setSelectedCarrierFilter}
            onApplyCarrierToAll={handleBulkApplyCarrier}
          />
          
          <BulkShipmentsList
            shipments={filteredShipments}
            isFetchingRates={isFetchingRates}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={handleEditShipment}
            onRefreshRates={handleRefreshRates}
            onPreviewLabel={handleDownloadSingleLabel}
          />
          
          {results.processedShipments.length > 0 && (
            <div className="mt-8 p-4 border rounded-lg bg-gray-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div>
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  <p className="text-gray-600">
                    {results.processedShipments.length} shipments selected with a total cost of ${results.totalCost.toFixed(2)}
                  </p>
                </div>
                
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <Button 
                    variant="outline" 
                    className="px-6"
                    onClick={handleDownloadAllLabels}
                    disabled={isPaying || isCreatingLabels}
                  >
                    Download All Labels
                  </Button>
                  
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={isPaying || results.processedShipments.length === 0}
                    className="px-6 bg-green-600 hover:bg-green-700"
                  >
                    {isPaying ? 'Processing...' : 'Process Payment'} 
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {uploadStatus === 'success' && results && (
        <SuccessNotification
          results={results}
          onDownloadAllLabels={handleDownloadAllLabels}
          onDownloadSingleLabel={handleDownloadSingleLabel}
          onProceedToPayment={handleProceedToPayment}
          onCreateLabels={handleCreateLabels}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
        />
      )}
      
      {uploadStatus === 'error' && (
        <UploadError />
      )}
      
      {/* Label download options modal */}
      <LabelOptionsModal 
        open={showLabelOptions}
        onOpenChange={setShowLabelOptions}
        onFormatSelect={handleDownloadLabelsWithFormat}
        onEmailLabels={handleEmailLabels}
        shipmentCount={results?.processedShipments.length || 0}
      />
      
      {/* Label preview modal */}
      <LabelPreviewModal
        open={showLabelPreview}
        onOpenChange={setShowLabelPreview}
        labelUrl={labelPreviewUrl}
        onPrint={() => {
          window.open(labelPreviewUrl || '', '_blank');
          setShowLabelPreview(false);
        }}
        onDownload={() => {
          if (labelPreviewUrl) {
            const a = document.createElement('a');
            a.href = labelPreviewUrl;
            a.download = `shipping-label-${Date.now()}.${labelPreviewUrl.endsWith('.pdf') ? 'pdf' : 'png'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setShowLabelPreview(false);
          }
        }}
      />
    </Card>
  );
};

export default BulkUpload;
