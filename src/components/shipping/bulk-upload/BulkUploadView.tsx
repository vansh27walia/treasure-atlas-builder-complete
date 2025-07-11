
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, PrinterIcon, AlertTriangle, X, Mail, CheckCircle, Clock, Truck, FileCheck, CreditCard, Sparkles, ArrowRight, Zap } from 'lucide-react';
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
    handlePaymentSuccess,
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
      { id: 'processing', label: 'AI Processing', icon: Sparkles, status: 'upcoming', description: 'AI analyzing and mapping your data' },
      { id: 'rates', label: 'Fetch Rates', icon: Truck, status: 'upcoming', description: 'Getting best shipping rates from carriers' },
      { id: 'selection', label: 'Rate Selection', icon: CheckCircle, status: 'upcoming', description: 'Choose optimal rates for shipments' },
      { id: 'payment', label: 'Payment', icon: CreditCard, status: 'upcoming', description: 'Secure payment processing' },
      { id: 'labels', label: 'Create Labels', icon: FileCheck, status: 'upcoming', description: 'Generating shipping labels automatically' },
      { id: 'download', label: 'Download', icon: Download, status: 'upcoming', description: 'Labels ready for download and printing' }
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
      steps.slice(0, 5).forEach(step => step.status = 'completed');
      steps[5].status = 'active';
    } else if (uploadStatus === 'success') {
      steps.forEach(step => step.status = 'completed');
    }

    return steps;
  };

  const ProgressTrackingBar = () => {
    const steps = getProgressSteps();
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center group">
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-500 transform
                        ${step.status === 'completed' ? 'bg-green-500 text-white ring-4 ring-green-200 scale-110' : 
                          step.status === 'active' ? 'bg-blue-500 text-white ring-4 ring-blue-200 animate-pulse scale-110' : 
                          'bg-gray-200 text-gray-500 hover:bg-gray-300'}
                      `}
                    >
                      <StepIcon className="h-7 w-7" />
                    </div>
                    <div className="text-center">
                      <span 
                        className={`text-sm font-semibold block mb-1
                          ${step.status === 'completed' ? 'text-green-700' : 
                            step.status === 'active' ? 'text-blue-700' : 
                            'text-gray-500'}
                        `}
                      >
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-600 max-w-20 leading-tight">
                        {step.description}
                      </span>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block flex-grow mx-6">
                      <div className="relative">
                        <div className="h-1 w-full bg-gray-300 rounded-full"></div>
                        <div 
                          className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-700
                            ${step.status === 'completed' ? 'w-full bg-gradient-to-r from-green-400 to-green-600' : 'w-0'}
                          `}
                        ></div>
                      </div>
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

  // Enhanced file upload section with better UX
  if (uploadStatus === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Upload className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Bulk Shipping Made Simple
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                Upload your CSV file and let our AI handle the complex mapping and rate fetching. 
                Create hundreds of shipping labels in minutes, not hours.
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 mb-8">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span>AI-Powered Mapping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>Instant Rate Comparison</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Bulk Label Creation</span>
                </div>
              </div>
            </div>
            
            <Card className="p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <BulkUploadForm
                onUploadSuccess={handleUploadSuccess}
                onUploadFail={handleUploadFail}
                onPickupAddressSelect={handlePickupAddressSelect}
                isUploading={isUploading}
                progress={progress}
                handleUpload={handleUpload}
              />
            </Card>
            
            <div className="mt-12 text-center">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Download CSV Template
              </Button>
              <p className="text-sm text-gray-500 mt-3">
                New to bulk shipping? Download our template to get started quickly
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Progress Tracking Bar */}
      <ProgressTrackingBar />

      {/* Processing Section with better animations */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-16 max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
              </div>
              <h3 className="text-3xl font-bold mb-6 text-gray-900">AI Processing Your Data</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our advanced AI is analyzing your CSV headers, mapping fields intelligently, 
                and preparing everything for rate fetching. This ensures perfect compatibility 
                and optimal shipping rates.
              </p>
              {progress > 0 && progress < 100 && (
                <div className="space-y-4">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{progress}% complete</p>
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

      {/* Enhanced Rate Selection Screen */}
      {uploadStatus === 'editing' && results && results.processedShipments && results.processedShipments.length > 0 && (
        <div className="min-h-screen bg-white">
          {/* Batch Error Alert */}
          {batchError && (
            <div className="bg-red-50 border-b border-red-200 p-4">
              <Alert className="border-red-200 bg-red-50 max-w-6xl mx-auto">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>Batch halted.</strong> Package #{batchError.packageNumber} couldn't be processed. 
                    Please select a different carrier or fix the details to proceed.
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
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Rate Selection & Review</h1>
              <p className="text-xl text-gray-600 mb-6">
                Choose the best shipping rates for your shipments. Our AI has found competitive options from multiple carriers.
              </p>
              
              {/* Enhanced rate fetching indicator */}
              {isFetchingRates && (
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-lg">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-8 w-8 border border-blue-400 opacity-25"></div>
                    </div>
                    <div className="text-center">
                      <span className="text-blue-800 font-semibold text-lg block">Fetching Latest Rates</span>
                      <span className="text-blue-600 text-sm">Comparing prices from UPS, FedEx, USPS, and DHL...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
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
            
            {/* ENHANCED Payment Section - ONLY HERE */}
            <div className="mt-12 flex justify-center">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-10 rounded-2xl shadow-2xl border border-green-200 max-w-4xl w-full">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <CreditCard className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Create Labels?</h3>
                  <p className="text-lg text-gray-600 mb-2">
                    Complete payment to automatically generate all your shipping labels
                  </p>
                  <p className="text-sm text-gray-500">
                    Secure payment processing • Instant label generation • No hidden fees
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{filteredShipments.filter(s => s.selectedRateId).length}</div>
                      <div className="text-sm text-gray-600">Shipments Ready</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <Truck className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">${results.totalCost?.toFixed(2) || '0.00'}</div>
                      <div className="text-sm text-gray-600">Total Shipping Cost</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">75%</div>
                      <div className="text-sm text-gray-600">Average Savings</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-4">
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={!filteredShipments.some(s => s.selectedRateId) || isCreatingLabels}
                    className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-16 py-6 text-2xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    {isCreatingLabels ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-4"></div>
                        Creating Labels...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-4 h-8 w-8" />
                        Pay ${results.totalCost?.toFixed(2) || '0.00'} & Create Labels
                        <ArrowRight className="ml-4 h-6 w-6" />
                      </>
                    )}
                  </Button>
                  
                  {pickupAddress && (
                    <p className="text-sm text-green-700 font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Shipping from: {pickupAddress.name || pickupAddress.street1}
                    </p>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Secure Payment
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Instant Processing
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Auto Label Generation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS SCREEN - NO PAYMENT OPTIONS HERE */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto p-6">
            <div className="text-center mb-12">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                🎉 Labels Created Successfully!
              </h1>
              <p className="text-2xl text-gray-600 mb-8">
                Your shipping labels are ready for download and use
              </p>
              <div className="bg-green-100 border border-green-300 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-6 text-green-800">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{results.processedShipments?.length || 0}</div>
                    <div className="text-sm">Labels Created</div>
                  </div>
                  <div className="w-px h-12 bg-green-300"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">${results.totalCost?.toFixed(2) || '0.00'}</div>
                    <div className="text-sm">Total Shipping Cost</div>
                  </div>
                </div>
              </div>
            </div>

            {/* DOWNLOAD OPTIONS ONLY - NO PAYMENT HERE */}
            <BulkLabelDownloadOptions
              batchResult={results.batchResult}
              processedLabels={results.processedShipments || []}
              onDownloadBatch={(format, url) => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `consolidated_labels_${Date.now()}.${format}`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onDownloadManifest={(url) => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `pickup_manifest_${Date.now()}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onDownloadIndividual={handleDownloadSingleLabel}
              onPrintPreview={handlePrintPreview}
              onEmailLabels={() => setShowEmailModal(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={results?.batchResult || null}
      />

      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={results?.batchResult || null}
      />

      {/* Payment Modal - ONLY APPEARS ON RATE SELECTION SCREEN */}
      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          handlePaymentSuccess();
        }}
      />
    </div>
  );
};

export default BulkUploadView;
