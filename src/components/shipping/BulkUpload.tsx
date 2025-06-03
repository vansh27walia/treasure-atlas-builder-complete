
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

  console.log('BulkUpload render - uploadStatus:', uploadStatus, 'results:', results);

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    if (address && address.id !== pickupAddress?.id) {
      setPickupAddress(address);
      const now = Date.now();
      if (now - lastToastRef.current > 2000) {
        toast.success(`Selected pickup address: ${address.name || address.street1}`);
        lastToastRef.current = now;
      }
    }
  };

  const handleUploadSuccess = (uploadResults: any) => {
    console.log("Upload success:", uploadResults);
    toast.success("File uploaded and processed successfully!");
  };

  const handleUploadFail = (error: string) => {
    console.error("Upload failed:", error);
    toast.error("Upload failed: " + error);
  };

  const handleEditShipmentWrapper = (shipmentId: string, details: any) => {
    const shipment = results?.processedShipments.find(s => s.id === shipmentId);
    if (shipment) {
      handleEditShipment(shipment);
    }
  };

  const resetUpload = () => {
    window.location.reload();
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    let mappedField: "recipient" | "rate" | "carrier";
    switch (field) {
      case "address":
        mappedField = "recipient";
        break;
      case "rate":
        mappedField = "rate";
        break;
      case "carrier":
        mappedField = "carrier";
        break;
      default:
        mappedField = "recipient";
    }
    
    setSortField(mappedField);
    setSortDirection(direction);
  };

  if (uploadStatus === 'idle') {
    return (
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <BulkUploadHeader onDownloadTemplate={handleDownloadTemplate} />
        <BulkUploadForm 
          onUploadSuccess={handleUploadSuccess}
          onUploadFail={handleUploadFail}
          onPickupAddressSelect={handlePickupAddressSelect}
          isUploading={isUploading}
          progress={progress}
          handleUpload={handleUpload}
        />
      </Card>
    );
  }

  if (isUploading) {
    return (
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Processing Your Shipments</h3>
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-gray-600">
            {progress < 100 
              ? `Uploading and processing shipments (${progress}%)...` 
              : 'Processing complete! Setting up shipment options...'}
          </p>
        </div>
      </Card>
    );
  }

  if (uploadStatus === 'editing' && results) {
    return (
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              Review Shipments & Create Labels
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
                Upload New File
              </Button>
            </div>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ready to Create Labels</AlertTitle>
            <AlertDescription>
              Your shipments have been processed. Review the details below and click "Create Labels" to generate shipping labels via EasyPost.
            </AlertDescription>
          </Alert>
          
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
          
          <BulkShipmentsList
            shipments={filteredShipments}
            isFetchingRates={isFetchingRates}
            onSelectRate={handleSelectRate}
            onRemoveShipment={handleRemoveShipment}
            onEditShipment={handleEditShipmentWrapper}
            onRefreshRates={handleRefreshRates}
          />
          
          {results.processedShipments.length > 0 && (
            <div className="mt-8 p-6 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Ready to Create Labels</h3>
                  <p className="text-gray-600">
                    {results.processedShipments.length} shipments ready • Estimated total: ${results.totalCost.toFixed(2)}
                  </p>
                  {pickupAddress && (
                    <p className="text-sm text-blue-600 mt-1">
                      <span className="font-medium">From:</span> {pickupAddress.name || pickupAddress.street1}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateLabels}
                    disabled={isCreatingLabels || results.processedShipments.length === 0 || !pickupAddress}
                    className="px-6 bg-green-600 hover:bg-green-700"
                  >
                    {isCreatingLabels ? 'Creating Labels...' : 'Create Labels via EasyPost'} 
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
      
  if (uploadStatus === 'success' && results) {
    return (
      <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
        <SuccessNotification
          results={results}
          onDownloadAllLabels={handleDownloadAllLabels}
          onDownloadSingleLabel={handleDownloadSingleLabel}
          onProceedToPayment={handleProceedToPayment}
          onCreateLabels={handleCreateLabels}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
        />
        
        <LabelOptionsModal 
          open={showLabelOptions}
          onOpenChange={setShowLabelOptions}
          onFormatSelect={handleDownloadLabelsWithFormat}
          onEmailLabels={() => handleEmailLabels("")}
          shipmentCount={results?.processedShipments.length || 0}
        />
      </Card>
    );
  }
      
  if (uploadStatus === 'error') {
    return (
      <Card className="p-6 border-2 border-red-200 shadow-sm w-full">
        <UploadError 
          onRetry={resetUpload}
          onSelectNewFile={resetUpload}
          errorMessage="Upload failed. Please check your file format and try again."
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 border-2 border-gray-200 shadow-sm w-full">
      <div className="text-center py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    </Card>
  );
};

export default BulkUpload;
