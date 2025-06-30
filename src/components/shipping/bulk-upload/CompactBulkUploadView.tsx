
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, CheckCircle, AlertTriangle, Truck, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import BulkLabelDownloadOptions from './BulkLabelDownloadOptions';
import { useBulkUpload } from './useBulkUpload';
import EnhancedStripePayment from '../EnhancedStripePayment';

const CompactBulkUploadView: React.FC = () => {
  const {
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isCreatingLabels,
    filteredShipments,
    pickupAddress,
    labelGenerationProgress,
    handleUpload,
    handleSelectRate,
    handleCreateLabels,
    handleDownloadTemplate,
    setPickupAddress
  } = useBulkUpload();

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Progress tracking for better UX
  const getProgressStep = () => {
    if (uploadStatus === 'idle') return 0;
    if (uploadStatus === 'uploading' || isFetchingRates) return 1;
    if (uploadStatus === 'editing') return 2;
    if (isCreatingLabels || labelGenerationProgress.isGenerating) return 3;
    if (uploadStatus === 'success') return 4;
    return 0;
  };

  const progressSteps = [
    { label: 'Upload CSV', icon: Upload },
    { label: 'Process Data', icon: FileText },
    { label: 'Select Rates', icon: Truck },
    { label: 'Create Labels', icon: Package },
    { label: 'Complete', icon: CheckCircle }
  ];

  const currentStep = getProgressStep();
  const progressPercent = (currentStep / (progressSteps.length - 1)) * 100;

  const getTotalCost = () => {
    if (!results?.processedShipments) return 0;
    return results.processedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    handleCreateLabels();
  };

  const getShipmentDetails = () => {
    return filteredShipments
      .filter(s => s.selectedRateId)
      .map(shipment => ({
        id: shipment.id || '',
        recipient: shipment.customer_name || shipment.details?.recipient?.name || 'Unknown',
        service: shipment.availableRates?.find(r => r.id === shipment.selectedRateId)?.service || 'Standard',
        cost: shipment.availableRates?.find(r => r.id === shipment.selectedRateId)?.rate || 0
      }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Header - Sticky */}
      {uploadStatus !== 'idle' && (
        <div className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Label Creation Progress</h2>
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {progressSteps.length}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                {progressSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center">
                    <step.icon className={`h-4 w-4 mr-2 ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={index <= currentStep ? 'text-blue-600 font-medium' : ''}>{step.label}</span>
                  </div>
                ))}
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Upload Section */}
        {uploadStatus === 'idle' && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <Upload className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-3">Upload Your CSV File</h2>
              <p className="text-lg text-gray-600">Create multiple shipping labels efficiently with bulk upload</p>
            </div>
            
            <BulkUploadForm
              onUploadSuccess={() => {}}
              onUploadFail={() => {}}
              onPickupAddressSelect={setPickupAddress}
              isUploading={false}
              progress={progress}
              handleUpload={handleUpload}
            />
            
            <div className="mt-6 text-center">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Download CSV Template
              </Button>
            </div>
          </Card>
        )}

        {/* Processing State */}
        {(uploadStatus === 'uploading' || isFetchingRates) && (
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-2xl font-semibold mb-3">Processing Your Upload</h3>
            <p className="text-lg text-gray-600">
              {isFetchingRates ? 'Fetching shipping rates from carriers...' : 'Analyzing your CSV data...'}
            </p>
          </Card>
        )}

        {/* Rate Selection */}
        {uploadStatus === 'editing' && results?.processedShipments && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold">Select Shipping Rates</h3>
                  <p className="text-lg text-gray-600">
                    {filteredShipments.length} shipments • Total: ${getTotalCost().toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={!filteredShipments.some(s => s.selectedRateId)}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    Create Labels (${getTotalCost().toFixed(2)})
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <BulkShipmentsList
                shipments={filteredShipments}
                isFetchingRates={false}
                onSelectRate={handleSelectRate}
                onRemoveShipment={() => {}}
                onEditShipment={() => {}}
                onRefreshRates={() => {}}
              />
            </Card>
          </div>
        )}

        {/* Label Generation Progress */}
        {labelGenerationProgress.isGenerating && (
          <Card className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-6"></div>
              <h3 className="text-2xl font-semibold mb-3">Creating Shipping Labels</h3>
              <p className="text-lg text-gray-600 mb-6">
                {labelGenerationProgress.processedShipments} of {labelGenerationProgress.totalShipments} labels processed
              </p>
              <Progress 
                value={(labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments) * 100} 
                className="h-3"
              />
            </div>
          </Card>
        )}

        {/* Success Section */}
        {uploadStatus === 'success' && results && (
          <div className="space-y-6">
            <Card className="p-6 bg-green-50 border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                <div>
                  <h3 className="text-2xl font-semibold text-green-800">Labels Created Successfully!</h3>
                  <p className="text-lg text-green-700">
                    {results.successful} labels created • {results.failed} failed
                  </p>
                </div>
              </div>
            </Card>

            <BulkLabelDownloadOptions
              batchResult={results.batchResult}
              processedLabels={results.processedShipments || []}
              onDownloadBatch={() => {}}
              onDownloadManifest={() => {}}
              onDownloadIndividual={() => {}}
              onPrintPreview={() => {}}
              onEmailLabels={() => {}}
            />
          </div>
        )}
      </div>

      {/* Enhanced Stripe Payment Modal */}
      <EnhancedStripePayment
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={getTotalCost()}
        shipmentCount={filteredShipments.filter(s => s.selectedRateId).length}
        onPaymentSuccess={handlePaymentSuccess}
        shipmentDetails={getShipmentDetails()}
      />
    </div>
  );
};

export default CompactBulkUploadView;
