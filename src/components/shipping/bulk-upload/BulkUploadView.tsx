
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, PrinterIcon, AlertTriangle, X, Mail, CheckCircle, Clock, Truck, FileCheck } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import LabelResultsTable from './LabelResultsTable';
import LabelGenerationProgress from './LabelGenerationProgress';
import BatchLabelCreationPage from './BatchLabelCreationPage';
import PrintPreview from '@/components/shipping/PrintPreview';
import BatchLabelControls from '@/components/shipping/BatchLabelControls';
import AdvancedProgressTracker from './AdvancedProgressTracker';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import BulkLabelDownloadOptions from './BulkLabelDownloadOptions';
import { useBulkUpload } from './useBulkUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PaymentMethodModal from '@/components/payment/PaymentMethodModal';

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
    batchError,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    handleClearBatchError,
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

  const [showPrintPreview, setShowPrintPreview] = React.useState(false);
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);

  // Enhanced progress tracking steps with more detailed phases
  const getProgressSteps = () => {
    const steps = [
      { id: 'upload', label: 'Upload CSV', icon: Upload, status: 'upcoming', description: 'Upload your CSV file with shipment data' },
      { id: 'processing', label: 'Process Data', icon: FileText, status: 'upcoming', description: 'Validating and parsing shipment information' },
      { id: 'rates', label: 'Fetch Rates', icon: Truck, status: 'upcoming', description: 'Getting shipping rates from carriers' },
      { id: 'selection', label: 'Rate Selection', icon: CheckCircle, status: 'upcoming', description: 'Choose the best rates for your shipments' },
      { id: 'payment', label: 'Payment Setup', icon: Package, status: 'upcoming', description: 'Configure payment method for batch processing' },
      { id: 'labels', label: 'Create Labels', icon: FileCheck, status: 'upcoming', description: 'Generating shipping labels and batch files' },
      { id: 'storage', label: 'Store & Download', icon: Download, status: 'upcoming', description: 'Storing labels and preparing downloads' }
    ];

    // Update status based on current state
    if (uploadStatus === 'idle') {
      steps[0].status = 'active';
    } else if (uploadStatus === 'uploading' || isUploading) {
      steps[0].status = 'completed';
      steps[1].status = 'active';
    } else if (uploadStatus === 'editing') {
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      if (isFetchingRates) {
        steps[2].status = 'active';
      } else {
        steps[2].status = 'completed';
        steps[3].status = 'active';
      }
    } else if (isCreatingLabels || labelGenerationProgress.isGenerating) {
      steps[0].status = 'completed';
      steps[1].status = 'completed';
      steps[2].status = 'completed';
      steps[3].status = 'completed';
      steps[4].status = 'active';
    } else if (uploadStatus === 'success') {
      steps.forEach(step => step.status = 'completed');
    }

    return steps;
  };

  const ProgressTrackingBar = () => {
    const steps = getProgressSteps();
    
    return (
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                        ${step.status === 'completed' ? 'bg-green-100 text-green-600 ring-2 ring-green-400' : 
                          step.status === 'active' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 animate-pulse' : 
                          'bg-gray-100 text-gray-400'}
                      `}
                    >
                      <StepIcon className="h-6 w-6" />
                    </div>
                    <span 
                      className={`text-sm font-medium text-center
                        ${step.status === 'completed' ? 'text-green-600' : 
                          step.status === 'active' ? 'text-blue-700 font-bold' : 
                          'text-gray-400'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block flex-grow mx-4">
                      <div className={`h-1 w-full rounded-full ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleUploadSuccess = (uploadResults: any) => {
    console.log('Upload successful:', uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupAddress(address);
  };

  const handleBatchProcessed = (batchResult: any) => {
    console.log('Batch processed:', batchResult);
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handleDownloadConsolidated = (format: 'pdf' | 'zpl' | 'epl', url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `consolidated_labels_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadManifest = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `pickup_manifest_${Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadIndividualLabel = (labelUrl: string, format: string) => {
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `individual_label_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmailConsolidated = () => {
    setShowEmailModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Progress Tracking Bar - Always visible when not idle */}
      {uploadStatus !== 'idle' && <ProgressTrackingBar />}

      {/* File Upload Section - Only show when idle */}
      {uploadStatus === 'idle' && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="h-10 w-10 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bulk Shipping Upload
              </h1>
              <p className="text-xl text-gray-600">Upload your CSV file to create multiple shipping labels with ease</p>
            </div>
            
            <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <BulkUploadForm
                onUploadSuccess={handleUploadSuccess}
                onUploadFail={handleUploadFail}
                onPickupAddressSelect={handlePickupAddressSelect}
                isUploading={isUploading}
                progress={progress}
                handleUpload={handleUpload}
              />
            </Card>
            
            <div className="mt-8 text-center">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Section */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-12 max-w-lg w-full shadow-xl border-0 bg-white">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-blue-600 animate-spin"></div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">Processing Your Upload</h3>
              <p className="text-gray-600 mb-6">We're analyzing your shipment data and preparing everything for you...</p>
              {progress > 0 && progress < 100 && (
                <div className="space-y-3">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm font-medium text-blue-600">{progress}% complete</p>
                </div>
              )}
            </div>
          </Card>
        </div>
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

      {/* Rate Selection Full Screen */}
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <div className="min-h-screen bg-white">
          {/* Batch Error Alert */}
          {batchError && (
            <div className="bg-red-50 border-b border-red-200 p-4">
              <Alert className="border-red-200 bg-red-50 max-w-6xl mx-auto">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>Batch halted.</strong> Package #{batchError.packageNumber} couldn't be processed with the selected carrier. 
                    Please select a different carrier or fix the label details to proceed.
                    <div className="mt-1 text-sm text-red-700">
                      Error: {batchError.error}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearBatchError}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Selection & Configuration</h1>
              <p className="text-lg text-gray-600">Review shipping rates and configure your shipments before creating labels</p>
            </div>
            
            {isFetchingRates && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-800 font-medium">Fetching latest shipping rates...</span>
                </div>
              </div>
            )}
            
            <Card className="shadow-lg border-0">
              <BulkShipmentsList
                shipments={filteredShipments}
                isFetchingRates={isFetchingRates}
                onSelectRate={handleSelectRate}
                onRemoveShipment={handleRemoveShipment}
                onEditShipment={(shipmentId: string, details: any) => {
                  console.log('Edit shipment:', shipmentId, details);
                }}
                onRefreshRates={() => {}}
              />
            </Card>
            
            {/* Create Labels Button */}
            <div className="mt-8 flex justify-center">
              <div className="flex gap-6 items-center">
                <BatchLabelControls
                  selectedShipments={filteredShipments.filter(s => s.selectedRateId)}
                  pickupAddress={pickupAddress}
                  onBatchProcessed={handleBatchProcessed}
                />
                
                <Button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={!filteredShipments.some(s => s.selectedRateId)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold shadow-lg mr-4"
                  size="lg"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  Setup Payment
                </Button>

                <Button
                  onClick={handleCreateLabels}
                  disabled={isCreatingLabels || !filteredShipments.some(s => s.selectedRateId)}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-12 py-4 text-xl font-semibold shadow-lg"
                  size="lg"
                >
                  {isCreatingLabels ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Labels...
                    </>
                  ) : (
                    <>
                      <Package className="mr-3 h-6 w-6" />
                      Create All Labels
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen with Enhanced Design */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto p-6">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Labels Created Successfully!
              </h1>
              <p className="text-xl text-gray-600">Your shipping labels are ready for download and use</p>
            </div>

            {/* Enhanced Batch Label Download Options */}
            <BulkLabelDownloadOptions
              batchResult={results.batchResult}
              processedLabels={results.processedShipments || []}
              onDownloadBatch={handleDownloadConsolidated}
              onDownloadManifest={handleDownloadManifest}
              onDownloadIndividual={handleDownloadIndividualLabel}
              onPrintPreview={handlePrintPreview}
              onEmailLabels={handleEmailConsolidated}
            />
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={results?.batchResult || null}
      />

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={results?.batchResult || null}
      />

      {/* Payment Modal */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentMethodAdded={() => {
          setShowPaymentModal(false);
          // Proceed with label creation after payment setup
          handleCreateLabels();
        }}
      />
    </div>
  );
};

export default BulkUploadView;
