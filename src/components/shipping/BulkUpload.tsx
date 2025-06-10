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
import { FileText, UploadCloud, ChevronRight, AlertCircle } from 'lucide-react';
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
    showLabelOptions,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress,
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

  const handleCreateLabels = async () => {
    console.log("Starting label creation process...");
    
    if (!results?.processedShipments || results.processedShipments.length === 0) {
      toast.error("No shipments available for label creation");
      return;
    }

    if (!pickupAddress) {
      toast.error("Please select a pickup address before creating labels");
      return;
    }

    // Validate that ALL shipments have selected rates
    const shipmentsWithoutRates = results.processedShipments.filter(shipment => 
      !shipment.selectedRateId || !shipment.easypost_id
    );

    if (shipmentsWithoutRates.length > 0) {
      toast.error(`${shipmentsWithoutRates.length} shipment(s) don't have rates selected. Please select rates for all shipments before creating labels.`);
      console.log("Shipments without rates:", shipmentsWithoutRates);
      return;
    }

    // Ensure exactly the same number of labels will be created as shipments with rates
    const totalShipments = results.processedShipments.length;
    console.log(`Creating labels for ALL ${totalShipments} shipments - no gaps allowed`);

    try {
      await handleCreateLabels();
    } catch (error) {
      console.error("Label creation failed:", error);
      toast.error("Label creation failed. Please try again.");
    }
  };

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
                    onClick={handleCreateLabels}
                    disabled={isPaying || processedShipmentsCount === 0 || !pickupAddress}
                    className="px-6 bg-green-600 hover:bg-green-700"
                  >
                    {isPaying || isCreatingLabels ? 'Processing...' : 'Create Labels'} 
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
