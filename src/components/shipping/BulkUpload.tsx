import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import LabelOptionsModal from './bulk-upload/LabelOptionsModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, ChevronRight, AlertCircle, X } from 'lucide-react'; // Added X for the cancel icon
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);

  const {
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    // --- CHANGE #1: Add new state and handler from your hook ---
    // NOTE: You must implement this logic in your useBulkUpload hook.
    uploadStatusMessage,
    handleCancelUpload,
    // ---------------------------------------------------------
    showLabelOptions,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress,
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
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useBulkUpload();

  // Log pickup address on mount and when it changes (less frequently)
  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]); // Only log when ID changes

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    if (address && address.id !== pickupAddress?.id) {
      console.log("Selected pickup address in BulkUpload:", address);
      setPickupAddress(address);
      
      // Prevent duplicate toasts
      const now = Date.now();
      if (now - lastToastRef.current > 2000) {
        toast.success(`Selected pickup address: ${address.name || address.street1}`);
        lastToastRef.current = now;
      }
    }
  };

  const handleUploadSuccess = (uploadResults: any) => {
    console.log("Upload success in BulkUpload component:", uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed in BulkUpload component:", error);
  };

  // Wrapper function to match expected signature
  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
    if (shipment) {
      handleEditShipment(shipment);
    }
  };

  const resetUpload = () => {
    window.location.reload();
  };

  const selectNewFile = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  // Safely get processed shipments count
  const processedShipmentsCount = results?.processedShipments?.length || 0;

  return (
    <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
      <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
      
      {uploadStatus === 'idle' && (
        <BulkUploadForm 
          onUploadSuccess={handleUploadSuccess}
          onUploadFail={handleUploadFail}
          onPickupAddressSelect={handlePickupAddressSelect}
          isUploading={isUploading}
          progress={progress}
          handleUpload={handleUpload}
        />
      )}
      
      {/* --- CHANGE #2: Replaced the old loading UI with the new, improved component --- */}
      {isUploading && (
        <div className="my-6 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-800">Processing Your Shipments</h3>
            <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-600">
              {uploadStatusMessage || (progress < 100 ? 'Processing...' : 'Finalizing...')}
            </p>
            {handleCancelUpload && ( // Only show button if the function exists
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-600 hover:bg-red-100 hover:text-red-700"
                onClick={handleCancelUpload}
              >
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
      {/* ----------------------------------------------------------------------------- */}
      
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
              
              <Button onClick={resetUpload} className="text-sm">
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
              setSortField(field as any);
              setSortDirection(direction as any);
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
            onEditShipment={handleEditShipmentWrapper}
            onRefreshRates={handleRefreshRates}
          />
          
          {processedShipmentsCount > 0 && (
            <div className="mt-8 p-4 border rounded-lg bg-gray-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div>
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  <p className="text-gray-600">
                    {processedShipmentsCount} shipments selected with a total cost of ${results.totalCost?.toFixed(2) || '0.00'}
                  </p>
                  {pickupAddress && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                    </p>
                  )}
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
                    disabled={isPaying || processedShipmentsCount === 0 || !pickupAddress}
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
        <UploadError 
          onRetry={resetUpload}
          onSelectNewFile={selectNewFile}
          errorMessage="Upload failed. Please check your file format and try again."
        />
      )}
      
      <LabelOptionsModal 
        open={showLabelOptions}
        onOpenChange={setShowLabelOptions}
        onFormatSelect={handleDownloadLabelsWithFormat}
        onEmailLabels={() => handleEmailLabels("")}
        shipmentCount={processedShipmentsCount}
      />
    </Card>
  );
};

export default BulkUpload;
