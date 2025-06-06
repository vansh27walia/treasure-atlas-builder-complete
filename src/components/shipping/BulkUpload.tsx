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
// Note: We will build the Progress bar manually to control its animation, so the import is not strictly needed for the new part.
import { Progress } from '@/components/ui/progress';
import { FileText, UploadCloud, ChevronRight, AlertCircle, X } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  // --- CHANGE #1: Add a ref to directly control the progress bar for smooth animation ---
  const progressFillRef = useRef<HTMLDivElement>(null);

  const {
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress, // This is still important for knowing when we hit 100%
    // You still need to implement this logic in your useBulkUpload hook
    uploadStatusMessage,
    handleCancelUpload,
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

  // --- CHANGE #2: Add an effect to create the visual animation from 30% to 90% ---
  useEffect(() => {
    if (isUploading && progressFillRef.current) {
      const bar = progressFillRef.current;
      // Instantly set the bar to 30% when the upload starts.
      // The 'progress' prop from your hook should be 30 at this point.
      bar.style.transition = 'none'; // Turn off animation for the initial set
      bar.style.width = `${progress}%`;

      // Use a timeout to force the browser to render the initial state (30%)
      // before applying the smooth animation to 90%.
      const timer = setTimeout(() => {
        if (progressFillRef.current) {
          bar.style.transition = 'width 4s ease-out'; // Animate smoothly over 4 seconds
          bar.style.width = '90%';
        }
      }, 100);

      // Cleanup function to clear the timer if the component unmounts
      return () => clearTimeout(timer);
    }
  }, [isUploading, progress]); // Effect runs when `isUploading` becomes true or if `progress` changes.


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

  const handleUploadSuccess = (uploadResults: any) => { /* ... */ };
  const handleUploadFail = (error: string) => { /* ... */ };
  const handleEditShipmentWrapper = (shipmentId: string, details: any) => { /* ... */ };
  const resetUpload = () => window.location.reload();
  const selectNewFile = () => { /* ... */ };
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
      
      {/* --- CHANGE #3: This ENTIRE block replaces the old `{isUploading}` block --- */}
      {isUploading && (
        <div className="my-6 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-blue-800">Processing Your Shipments</h3>
            <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
              {/* Show the actual progress from the hook, which will jump to 100 at the end */}
              {progress}%
            </span>
          </div>
          
          {/* Manually created progress bar to allow for direct style manipulation */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              ref={progressFillRef}
              className="h-full bg-blue-600 rounded-full"
              // When the real progress hits 100, this style will take precedence
              style={{ width: progress === 100 ? '100%' : undefined }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-600">
              {uploadStatusMessage || 'Processing...'}
            </p>
            {handleCancelUpload && (
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
      {/* ------------------ End of Replaced Block ------------------ */}
      
      {uploadStatus === 'editing' && results && (
        <div className="mt-6">
          {/* ... all other existing code for the 'editing' state remains the same ... */}
        </div>
      )}
      
      {uploadStatus === 'success' && results && (
         <SuccessNotification
          results={results}
          onDownloadAllLabels={handleDownloadAllLabels}
          /* ... other props ... */
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