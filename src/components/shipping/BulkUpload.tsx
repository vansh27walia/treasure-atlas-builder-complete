
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import BulkUploadProgressBar, { BulkUploadStep } from './bulk-upload/BulkUploadProgressBar';
import LabelCreationOverlay from './LabelCreationOverlay';
import StripePaymentModal from './StripePaymentModal';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, AlertCircle, Download, CreditCard, PrinterIcon, Sparkles } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { BulkShipment } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [labelProgress, setLabelProgress] = useState({
    isCreating: false,
    progress: 0,
    currentStep: '',
    completed: 0,
    failed: 0
  });
  
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
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    handlePaymentSuccess
  } = useBulkUpload();

  // Determine current step and completed steps
  const getCurrentStep = (): BulkUploadStep => {
    if (uploadStatus === 'success') return 'labels';
    if (uploadStatus === 'editing') return 'rates';
    if (uploadStatus === 'uploading') return 'mapping';
    return 'upload';
  };
  
  const getCompletedSteps = (): BulkUploadStep[] => {
    const completed: BulkUploadStep[] = [];
    if (uploadStatus !== 'idle') completed.push('upload');
    if (uploadStatus === 'editing' || uploadStatus === 'success') completed.push('mapping');
    if (uploadStatus === 'success') completed.push('rates');
    return completed;
  };

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
  
  const processedShipmentsCount = results?.processedShipments?.length || 0;
  
  // Enhanced payment success handler that automatically starts label creation
  const handlePaymentSuccessAndCreateLabels = async () => {
    console.log('Payment successful, starting automatic label creation...');
    toast.success('Payment successful! Creating labels automatically...');
    
    // Start label creation immediately after payment
    await handleCreateLabels();
  };

  // Handler for the payment button on rate selection page
  const handlePaymentButtonClick = () => {
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Progress Bar */}
        <div className="bg-white shadow-sm border-b">
          <BulkUploadProgressBar currentStep={getCurrentStep()} completedSteps={getCompletedSteps()} />
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 rounded-xl">
              {(uploadStatus === 'idle' || uploadStatus === 'uploading') && (
                <div className="space-y-6">
                  {uploadStatus === 'idle' && (
                    <div className="text-center py-0">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <UploadCloud className="w-8 h-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Upload Your CSV File
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Get started by uploading your CSV file. Our AI will handle the rest!
                      </p>
                    </div>
                  )}
                  
                  <BulkUploadForm 
                    onUploadSuccess={handleUploadSuccess} 
                    onUploadFail={handleUploadFail} 
                    onPickupAddressSelect={handlePickupAddressSelect} 
                    isUploading={isUploading} 
                    progress={progress} 
                    handleUpload={handleUpload} 
                  />
                </div>
              )}
              
              {uploadStatus === 'editing' && results && (
                <div className="space-y-8">
                  <div className="text-center py-0">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Review Your Shipments
                    </h2>
                    <p className="text-gray-600">
                      Select carrier and service options for each shipment before generating labels
                    </p>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Review Required</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Please review carrier selections and rates below. You can edit addresses or remove shipments if needed.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-white rounded-xl border shadow-sm">
                    <div className="p-6 border-b">
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
                    </div>
                    
                    <BulkShipmentsList 
                      shipments={filteredShipments} 
                      isFetchingRates={isFetchingRates} 
                      onSelectRate={handleSelectRate} 
                      onRemoveShipment={handleRemoveShipment} 
                      onEditShipment={(shipmentId: string, details: any) => {
                        const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
                        if (shipment) {
                          handleEditShipment(shipment);
                        }
                      }} 
                      onRefreshRates={handleRefreshRates} 
                    />
                  </div>
                  
                  {/* PAYMENT SECTION - Only appears on rate selection page */}
                  {processedShipmentsCount > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900">Complete Your Order</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              {processedShipmentsCount} shipments ready
                            </span>
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              ${results.totalCost?.toFixed(2) || '0.00'} total cost
                            </span>
                          </div>
                          {pickupAddress && (
                            <p className="text-sm text-blue-600 font-medium">
                              📍 From: {pickupAddress.name || pickupAddress.street1}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            onClick={handlePaymentButtonClick}
                            disabled={isPaying || isCreatingLabels || processedShipmentsCount === 0 || !pickupAddress} 
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
                            size="lg"
                          >
                            <CreditCard className="mr-2 h-5 w-5" />
                            {isPaying ? 'Processing Payment...' : 'Pay & Create Labels'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* SUCCESS PAGE - NO PAYMENT OPTIONS HERE */}
              {uploadStatus === 'success' && results && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                      <Download className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      🎉 Labels Created Successfully!
                    </h2>
                    <p className="text-lg text-gray-600 mb-6">
                      Your shipping labels are ready for download and printing
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-center justify-center space-x-6 text-green-800">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{processedShipmentsCount}</div>
                          <div className="text-sm">Labels Ready</div>
                        </div>
                        <div className="w-px h-10 bg-green-300"></div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">${results.totalCost?.toFixed(2) || '0.00'}</div>
                          <div className="text-sm">Total Cost</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {results.bulk_label_pdf_url && (
                    <div className="flex justify-center mb-6">
                      <Button 
                        onClick={() => setShowPrintPreview(true)} 
                        variant="outline" 
                        className="shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <PrinterIcon className="mr-2 h-4 w-4" />
                        Preview All Labels
                      </Button>
                    </div>
                  )}
                  
                  {/* ONLY DOWNLOAD OPTIONS - NO PAYMENT HERE */}
                  <SuccessNotification 
                    results={results} 
                    onDownloadAllLabels={handleDownloadAllLabels} 
                    onDownloadSingleLabel={handleDownloadSingleLabel} 
                    onCreateLabels={handleCreateLabels} 
                    isPaying={false} // Always false on success page
                    isCreatingLabels={false} // Always false on success page
                  />
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Upload Failed
                    </h2>
                    <p className="text-gray-600">
                      There was an issue with your file. Please try again.
                    </p>
                  </div>
                  
                  <UploadError 
                    onRetry={() => window.location.reload()} 
                    onSelectNewFile={() => {
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      if (fileInput) {
                        fileInput.click();
                      }
                    }} 
                    errorMessage="Upload failed. Please check your file format and try again." 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Label Creation Overlay */}
      <LabelCreationOverlay 
        isVisible={labelProgress.isCreating} 
        progress={labelProgress.progress} 
        currentStep={labelProgress.currentStep} 
        totalLabels={processedShipmentsCount} 
        completedLabels={labelProgress.completed} 
        failedLabels={labelProgress.failed} 
        onClose={() => setLabelProgress(prev => ({
          ...prev,
          isCreating: false
        }))} 
      />

      {/* Payment Modal - Only for rate selection page */}
      <StripePaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        totalAmount={results?.totalCost || 0} 
        shipmentCount={processedShipmentsCount} 
        onPaymentSuccess={handlePaymentSuccessAndCreateLabels} 
      />

      {/* Print Preview Modal */}
      {results?.bulk_label_pdf_url && results.batchResult && (
        <PrintPreview 
          isOpenProp={showPrintPreview} 
          onOpenChangeProp={setShowPrintPreview} 
          labelUrl={results.bulk_label_pdf_url} 
          trackingCode={null} 
          isBatchPreview={true} 
          batchResult={results.batchResult} 
        />
      )}
    </>
  );
};

export default BulkUpload;
