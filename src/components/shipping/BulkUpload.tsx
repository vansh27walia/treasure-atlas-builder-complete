
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBulkUpload } from './bulk-upload/useBulkUpload';
import BulkUploadHeader from './bulk-upload/BulkUploadHeader';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import SuccessNotification from './bulk-upload/SuccessNotification';
import UploadError from './bulk-upload/UploadError';
import BulkShipmentsList from './bulk-upload/BulkShipmentsList';
import BulkShipmentFilters from './bulk-upload/BulkShipmentFilters';
import BulkUploadProgressBar, { BulkUploadStep } from './bulk-upload/BulkUploadProgressBar';
import LabelCreationOverlay from './LabelCreationOverlay';
import BatchLabelCreationPage from './bulk-upload/BatchLabelCreationPage';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, AlertCircle, Download, CreditCard, PrinterIcon, Sparkles } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { BulkShipment } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
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
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
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

  useEffect(() => {
    console.log("Current pickup address in BulkUpload:", pickupAddress);
  }, [pickupAddress?.id]);

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    if (address && address.id !== pickupAddress?.id) {
      console.log("Selected pickup address in BulkUpload:", address);
      setPickupAddress(address);

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

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      setShowPaymentModal(false);
      
      // Trigger payment success handler which will auto-create labels
      if (handlePaymentSuccess) {
        handlePaymentSuccess();
      }
      
      toast.success('Payment successful! Creating labels automatically...', {
        duration: 3000,
      });
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleStartPayment = () => {
    setShowPaymentModal(true);
  };

  // If we have successful results, show the batch creation page
  if (uploadStatus === 'success' && results) {
    return (
      <BatchLabelCreationPage
        results={results}
        onDownloadSingleLabel={handleDownloadSingleLabel}
        batchPrintPreviewModalOpen={batchPrintPreviewModalOpen}
        setBatchPrintPreviewModalOpen={setBatchPrintPreviewModalOpen}
        onCreateLabels={handleCreateLabels}
      />
    );
  }

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
                  
                  {processedShipmentsCount > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-xl">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            <Sparkles className="h-6 w-6 mr-2 text-green-600" />
                            Ready to Ship
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              {processedShipmentsCount} shipments
                            </span>
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              ${results.totalCost?.toFixed(2) || '0.00'} total
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
                            onClick={handleStartPayment}
                            disabled={isPaying || isCreatingLabels || processedShipmentsCount === 0 || !pickupAddress}
                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                            size="lg"
                          >
                            {isCreatingLabels ? (
                              <>
                                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                                Creating Labels...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Pay & Create Labels
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Complete Payment</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </Button>
            </div>
            
            <PaymentMethodSelector
              selectedPaymentMethod={selectedPaymentMethod}
              onPaymentMethodChange={setSelectedPaymentMethod}
              onPaymentComplete={handlePaymentComplete}
              amount={results?.totalCost || 0}
              description={`Bulk Shipping Labels (${processedShipmentsCount} labels)`}
              onClose={() => setShowPaymentModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modals and Overlays */}
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
