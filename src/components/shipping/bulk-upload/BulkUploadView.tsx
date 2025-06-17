
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, PrinterIcon, AlertTriangle, X, Mail, Printer } from 'lucide-react';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import LabelResultsTable from './LabelResultsTable';
import LabelGenerationProgress from './LabelGenerationProgress';
import PrintPreview from '@/components/shipping/PrintPreview';
import EmailLabelModal from './EmailLabelModal';
import BatchPrintPreview from './BatchPrintPreview';
import { useBulkUpload } from './useBulkUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const [emailModalOpen, setEmailModalOpen] = React.useState(false);
  const [batchEmailModalOpen, setBatchEmailModalOpen] = React.useState(false);
  const [selectedLabelForEmail, setSelectedLabelForEmail] = React.useState<string | null>(null);

  const handleUploadSuccess = (uploadResults: any) => {
    console.log('Upload successful:', uploadResults);
  };

  const handleUploadFail = (error: string) => {
    console.error('Upload failed:', error);
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupAddress(address);
  };

  const handleEditShipmentWrapper = (shipmentId: string, updates: Partial<any>) => {
    handleEditShipment(shipmentId, updates);
  };

  const handleEmailSingleLabel = (labelUrl: string) => {
    setSelectedLabelForEmail(labelUrl);
    setEmailModalOpen(true);
  };

  const handleEmailBatchLabels = () => {
    setBatchEmailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* File Upload Section - Only show when idle */}
      {uploadStatus === 'idle' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-4xl mx-auto p-6 w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
                <Upload className="mr-3 h-8 w-8 text-blue-600" />
                Bulk Shipping Upload
              </h1>
              <p className="text-gray-600 mt-2">Upload your CSV file to create multiple shipping labels</p>
            </div>
            
            <Card className="p-6">
              <BulkUploadForm
                onUploadSuccess={handleUploadSuccess}
                onUploadFail={handleUploadFail}
                onPickupAddressSelect={handlePickupAddressSelect}
                isUploading={isUploading}
                progress={progress}
                handleUpload={handleUpload}
              />
            </Card>
            
            <div className="mt-6 text-center">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Download Template</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Section */}
      {(uploadStatus === 'uploading' || (uploadStatus === 'editing' && !results?.processedShipments?.length)) && (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Your Upload</h3>
              <p className="text-gray-600">Please wait while we process your shipment data...</p>
              {progress > 0 && progress < 100 && (
                <div className="mt-4">
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

      {/* Rate Selection Full Screen - Now converted to dedicated page */}
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

          {/* Centered Rate Fetching Page */}
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="max-w-7xl w-full">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Rate Selection</h1>
                <p className="text-xl text-gray-600 mb-6">Choose from multiple AI options to optimize your shipping rates</p>
                
                {/* AI Options Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6 border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Smart Rate AI</h3>
                      <p className="text-gray-600 text-sm">Automatically selects the best rates based on cost and delivery time</p>
                    </div>
                  </Card>
                  
                  <Card className="p-6 border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Download className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Budget Optimizer AI</h3>
                      <p className="text-gray-600 text-sm">Prioritizes the most cost-effective shipping options</p>
                    </div>
                  </Card>
                  
                  <Card className="p-6 border-2 border-purple-200 hover:border-purple-400 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PrinterIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Express AI</h3>
                      <p className="text-gray-600 text-sm">Focuses on fastest delivery times for urgent shipments</p>
                    </div>
                  </Card>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border">
                <BulkShipmentsList
                  shipments={filteredShipments}
                  isFetchingRates={isFetchingRates}
                  onSelectRate={handleSelectRate}
                  onRemoveShipment={handleRemoveShipment}
                  onEditShipment={handleEditShipmentWrapper}
                  onRefreshRates={() => {}}
                />
              </div>
              
              {/* Create Labels Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleCreateLabels}
                  disabled={isCreatingLabels || !filteredShipments.some(s => s.selectedRateId)}
                  className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-xl font-semibold rounded-lg shadow-lg"
                >
                  {isCreatingLabels ? 'Creating Labels...' : 'Create Selected Labels'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section - Enhanced with new features */}
      {uploadStatus === 'success' && results && !labelGenerationProgress.isGenerating && (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Label Creation Complete</h1>
              <p className="text-gray-600">Your shipping labels have been generated successfully.</p>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-4 justify-center">
              {results?.batchResult?.consolidatedLabelUrls?.pdf && (
                <>
                  <Button
                    onClick={() => handleDownloadLabelsWithFormat('pdf')}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download All Labels
                  </Button>
                  
                  <Button
                    onClick={handleOpenBatchPrintPreview}
                    variant="outline"
                    className="border-purple-600 text-purple-600 hover:bg-purple-50 flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print All Labels
                  </Button>
                  
                  <Button
                    onClick={handleEmailBatchLabels}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Batch Labels
                  </Button>
                </>
              )}
            </div>
            
            {results.processedShipments && results.processedShipments.length > 0 && (
              <LabelResultsTable
                shipments={results.processedShipments || []}
                onDownloadLabel={handleDownloadSingleLabel}
                onEmailLabel={handleEmailSingleLabel}
              />
            )}
          </div>
        </div>
      )}

      {/* Enhanced Batch Print Preview Modal */}
      {results?.batchResult && (
        <BatchPrintPreview
          isOpen={batchPrintPreviewModalOpen}
          onOpenChange={setBatchPrintPreviewModalOpen}
          batchResult={results.batchResult}
          onDownloadFormat={handleDownloadLabelsWithFormat}
          onEmailBatch={handleEmailBatchLabels}
        />
      )}

      {/* Email Modals */}
      <EmailLabelModal
        isOpen={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        labelUrl={selectedLabelForEmail}
        onSendEmail={(email, subject, labelUrl) => handleEmailLabels(email, subject)}
        isBatch={false}
      />
      
      <EmailLabelModal
        isOpen={batchEmailModalOpen}
        onOpenChange={setBatchEmailModalOpen}
        labelUrl={results?.batchResult?.consolidatedLabelUrls?.pdf}
        onSendEmail={(email, subject, labelUrl) => handleEmailLabels(email, subject)}
        isBatch={true}
      />
    </div>
  );
};

export default BulkUploadView;
