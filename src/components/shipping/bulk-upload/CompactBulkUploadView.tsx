import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Package, Download, CheckCircle, AlertTriangle, Truck, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import BulkUploadForm from './BulkUploadForm';
import BulkShipmentsList from './BulkShipmentsList';
import StripePaymentModal from '../StripePaymentModal';
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

  // Compact progress steps
  const getProgressStep = () => {
    if (uploadStatus === 'idle') return 0;
    if (uploadStatus === 'uploading' || isFetchingRates) return 1;
    if (uploadStatus === 'editing') return 2;
    if (isCreatingLabels || labelGenerationProgress.isGenerating) return 3;
    if (uploadStatus === 'success') return 4;
    return 0;
  };

  const progressSteps = [
    { label: 'Upload', icon: Upload },
    { label: 'Process', icon: FileText },
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
      {/* Compact Header with Progress */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Bulk Label Creation</h1>
            {uploadStatus !== 'idle' && (
              <div className="text-sm text-gray-600">
                Step {currentStep + 1} of {progressSteps.length}
              </div>
            )}
          </div>
          
          {uploadStatus !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                {progressSteps.map((step, index) => (
                  <div key={step.label} className="flex items-center">
                    <step.icon className={`h-3 w-3 mr-1 ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={index <= currentStep ? 'text-blue-600 font-medium' : ''}>{step.label}</span>
                  </div>
                ))}
              </div>
              <Progress value={progressPercent} className="h-1" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Upload Section */}
        {uploadStatus === 'idle' && (
          <Card className="p-6">
            <div className="text-center mb-6">
              <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-2xl font-bold mb-2">Upload Your CSV</h2>
              <p className="text-gray-600">Create multiple shipping labels efficiently</p>
            </div>
            
            <BulkUploadForm
              onUploadSuccess={() => {}}
              onUploadFail={() => {}}
              onPickupAddressSelect={setPickupAddress}
              isUploading={false}
              progress={progress}
              handleUpload={handleUpload}
            />
            
            <div className="mt-4 text-center">
              <Button
                onClick={handleDownloadTemplate}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </Card>
        )}

        {/* Processing */}
        {(uploadStatus === 'uploading' || isFetchingRates) && (
          <Card className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Your Upload</h3>
            <p className="text-gray-600">
              {isFetchingRates ? 'Fetching shipping rates...' : 'Analyzing your data...'}
            </p>
          </Card>
        )}

        {/* Rate Selection */}
        {uploadStatus === 'editing' && results?.processedShipments && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Rate Selection</h3>
                  <p className="text-sm text-gray-600">
                    {filteredShipments.length} shipments • ${getTotalCost().toFixed(2)} total
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={!filteredShipments.some(s => s.selectedRateId)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-4 w-4 mr-2" />
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
          <Card className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Creating Labels</h3>
              <p className="text-gray-600 mb-4">
                {labelGenerationProgress.processedShipments} of {labelGenerationProgress.totalShipments} processed
              </p>
              <Progress 
                value={(labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments) * 100} 
                className="h-2"
              />
            </div>
          </Card>
        )}

        {/* Success Section */}
        {uploadStatus === 'success' && results && (
          <div className="space-y-4">
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Labels Created Successfully!</h3>
                  <p className="text-green-700">
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

      {/* Stripe Payment Modal - Updated */}
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
