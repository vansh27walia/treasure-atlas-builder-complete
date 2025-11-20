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
import PaymentDropdown from '../payment/PaymentDropdown';
import BulkAIOverviewPanel from './bulk-upload/BulkAIOverviewPanel';
import BulkShippingChatbot from './bulk-upload/BulkShippingChatbot';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, AlertCircle, Download, PrinterIcon, Sparkles, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { SavedAddress } from '@/services/AddressService';
import { BulkShipment } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
const BulkUpload: React.FC = () => {
  const lastToastRef = useRef<number>(0);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [selectedShipmentForAI, setSelectedShipmentForAI] = useState<any>(null);
  const [hasAutoOpenedAI, setHasAutoOpenedAI] = useState(false);
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
    setSelectedCarrierFilter
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

  // Handle AI panel events
  const handleAIAnalysis = (shipment?: any) => {
    setSelectedShipmentForAI(shipment || null);
    setAiPanelOpen(true);
  };
  const handleAIOptimizationChange = (filter: string, shipmentId?: string) => {
    const applyFilterToShipment = (shipment: any) => {
      if (!shipment.availableRates || shipment.availableRates.length === 0) return;
      
      let selectedRate = null;
      
      switch (filter) {
        case 'cheapest':
          selectedRate = shipment.availableRates.reduce((min: any, rate: any) => 
            parseFloat(rate.rate.toString()) < parseFloat(min.rate.toString()) ? rate : min
          );
          break;
          
        case 'fastest':
          selectedRate = shipment.availableRates.reduce((fastest: any, rate: any) => 
            (rate.delivery_days || 99) < (fastest.delivery_days || 99) ? rate : fastest
          );
          break;
          
        case 'balanced':
          selectedRate = shipment.availableRates.reduce((best: any, rate: any) => {
            const rateScore = 1 / parseFloat(rate.rate.toString()) + 1 / (rate.delivery_days || 5);
            const bestScore = 1 / parseFloat(best.rate.toString()) + 1 / (best.delivery_days || 5);
            return rateScore > bestScore ? rate : best;
          });
          break;
          
        case '2-day':
          selectedRate = shipment.availableRates.find((rate: any) => 
            rate.delivery_days <= 2
          ) || shipment.availableRates.reduce((fastest: any, rate: any) => 
            (rate.delivery_days || 99) < (fastest.delivery_days || 99) ? rate : fastest
          );
          break;
          
        case 'express':
          selectedRate = shipment.availableRates.find((rate: any) => 
            rate.delivery_days === 1 || rate.service?.toLowerCase().includes('express')
          ) || shipment.availableRates.reduce((fastest: any, rate: any) => 
            (rate.delivery_days || 99) < (fastest.delivery_days || 99) ? rate : fastest
          );
          break;
          
        case 'most-reliable':
          const reliabilityScores: { [key: string]: number } = {
            'UPS': 90, 'FEDEX': 88, 'USPS': 85, 'DHL': 82
          };
          selectedRate = shipment.availableRates.reduce((best: any, rate: any) => {
            const rateReliability = reliabilityScores[rate.carrier?.toUpperCase()] || 75;
            const bestReliability = reliabilityScores[best.carrier?.toUpperCase()] || 75;
            return rateReliability > bestReliability ? rate : best;
          });
          break;
          
        case 'ai-recommended':
          selectedRate = shipment.availableRates.reduce((best: any, rate: any) => {
            const rateScore = (1 / parseFloat(rate.rate.toString())) * 0.4 + 
                            (1 / (rate.delivery_days || 5)) * 0.3 +
                            (reliabilityScores[rate.carrier?.toUpperCase()] || 75) / 100 * 0.3;
            const bestScore = (1 / parseFloat(best.rate.toString())) * 0.4 + 
                            (1 / (best.delivery_days || 5)) * 0.3 +
                            (reliabilityScores[best.carrier?.toUpperCase()] || 75) / 100 * 0.3;
            return rateScore > bestScore ? rate : best;
          });
          break;
          
        default:
          selectedRate = shipment.availableRates[0];
      }
      
      if (selectedRate) {
        handleSelectRate(shipment.id, selectedRate.id);
      }
    };
    
    if (shipmentId) {
      // Apply to specific shipment
      const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
      if (shipment) {
        applyFilterToShipment(shipment);
      }
    } else {
      // Apply to ALL shipments
      results?.processedShipments?.forEach(shipment => {
        applyFilterToShipment(shipment);
      });
      
      toast.success(`Applied "${filter}" optimization to all ${results?.processedShipments?.length || 0} shipments`);
    }
  };

  // Auto-open AI panel for first shipment when results are available
  useEffect(() => {
    if (!hasAutoOpenedAI && results?.processedShipments?.length > 0 && uploadStatus === 'editing') {
      const firstShipment = results.processedShipments[0];
      setSelectedShipmentForAI(firstShipment);
      setAiPanelOpen(true);
      setHasAutoOpenedAI(true);
    }
  }, [results?.processedShipments, uploadStatus, hasAutoOpenedAI]);

  // Listen for payment events to auto-close AI panel
  useEffect(() => {
    const handlePaymentStart = () => setAiPanelOpen(false);
    const handlePaymentSuccess = () => setAiPanelOpen(false);
    const handlePaymentCancel = () => setAiPanelOpen(false);
    document.addEventListener('payment-start', handlePaymentStart);
    document.addEventListener('payment-success', handlePaymentSuccess);
    document.addEventListener('payment-cancel', handlePaymentCancel);
    return () => {
      document.removeEventListener('payment-start', handlePaymentStart);
      document.removeEventListener('payment-success', handlePaymentSuccess);
      document.removeEventListener('payment-cancel', handlePaymentCancel);
    };
  }, []);
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
  const handleDownloadLabelsClick = async () => {
    if (!results?.processedShipments?.length) {
      toast.error('No shipments available for label creation');
      return;
    }
    setLabelProgress({
      isCreating: true,
      progress: 0,
      currentStep: 'Initializing label creation...',
      completed: 0,
      failed: 0
    });
    try {
      const totalShipments = results.processedShipments.length;
      const updateProgress = (step: string, progress: number, completed: number, failed: number = 0) => {
        setLabelProgress({
          isCreating: true,
          progress,
          currentStep: step,
          completed,
          failed
        });
      };
      updateProgress('Creating shipments...', 20, 0);
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress('Generating labels...', 40, 0);
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateProgress('Converting to PDF...', 60, Math.floor(totalShipments * 0.6));
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress('Creating batch files...', 80, Math.floor(totalShipments * 0.8));
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateProgress('Finalizing downloads...', 95, totalShipments - 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      await handleCreateLabels();
      updateProgress('Download complete!', 100, totalShipments, 0);
      setTimeout(() => {
        setLabelProgress(prev => ({
          ...prev,
          isCreating: false
        }));
        toast.success('All labels downloaded successfully!');
      }, 2000);
    } catch (error) {
      console.error('Error creating labels:', error);
      setLabelProgress(prev => ({
        ...prev,
        isCreating: false,
        currentStep: 'Error occurred during label creation',
        failed: prev.failed + 1
      }));
      toast.error('Failed to create labels');
    }
  };
  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Creating labels...');
    // Auto-trigger the same flow as clicking the green button
    handleDownloadLabelsClick();
  };
  return <>
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 transition-all duration-300 ${aiPanelOpen ? 'mr-72' : ''}`}>
        {/* Progress Bar */}
        <div className="bg-white shadow-sm border-b rounded-3xl">
          <BulkUploadProgressBar currentStep={getCurrentStep()} completedSteps={getCompletedSteps()} />
        </div>

        <div className="container mx-auto px-4 py-8">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 rounded-xl">
              {(uploadStatus === 'idle' || uploadStatus === 'uploading') && <div className="space-y-6">
                  {uploadStatus === 'idle' && <div className="text-center py-0">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <UploadCloud className="w-8 h-8 text-blue-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Upload Your CSV File
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Get started by uploading your CSV file. Our AI will handle the rest!
                      </p>
                    </div>}
                  
                  <BulkUploadForm onUploadSuccess={handleUploadSuccess} onUploadFail={handleUploadFail} onPickupAddressSelect={handlePickupAddressSelect} isUploading={isUploading} progress={progress} handleUpload={handleUpload} />
                </div>}
              
              {uploadStatus === 'editing' && results && <div className="space-y-8">
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
                        search={searchTerm} 
                        onSearchChange={setSearchTerm} 
                        sort={sortField} 
                        onSortChange={(field, direction) => {
                          setSortField(field as any);
                          setSortDirection(direction as any);
                        }} 
                        selectedCarrier={selectedCarrierFilter} 
                        onCarrierFilterChange={setSelectedCarrierFilter} 
                        onQuickOptimize={(id) => toast.info(`Optimization: ${id}`)}
                        onApplyCarrierToAll={handleBulkApplyCarrier} 
                      />
                    </div>
                    
                    <BulkShipmentsList shipments={filteredShipments} isFetchingRates={isFetchingRates} onSelectRate={handleSelectRate} onRemoveShipment={handleRemoveShipment} onEditShipment={(shipmentId: string, updates: any) => {
                    handleEditShipment(shipmentId, updates);
                  }} onRefreshRates={handleRefreshRates} onAIAnalysis={handleAIAnalysis} />
                  </div>
                  
                  {processedShipmentsCount > 0 && <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                              {processedShipmentsCount} shipments
                            </span>
                            <span className="flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              ${((results.totalCost || 0)).toFixed(2)} total
                            </span>
                          </div>
                          {pickupAddress && <p className="text-sm text-blue-600 font-medium">
                              📍 From: {pickupAddress.name || pickupAddress.street1}
                            </p>}
                        </div>
                        
                        <div className="flex flex-col gap-4 w-full lg:w-auto">
                          <Button onClick={handleDownloadLabelsClick} disabled={isPaying || isCreatingLabels || processedShipmentsCount === 0 || !pickupAddress} className="w-full lg:w-64 h-12 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all duration-200" size="lg">
                            <Download className="mr-2 h-5 w-5" />
                            {isCreatingLabels ? 'Creating...' : 'Generate Labels'}
                          </Button>
                          
                          <PaymentDropdown amount={((results.totalCost || 0))} description={`Bulk Shipping (${processedShipmentsCount} shipments)`} shippingDetails={{
                      shipmentCount: processedShipmentsCount,
                      pickupAddress: pickupAddress,
                      shipments: results.processedShipments
                    }} onPaymentSuccess={handlePaymentSuccess} disabled={isPaying || processedShipmentsCount === 0 || !pickupAddress} className="w-full lg:w-64" />
                        </div>
                      </div>
                    </div>}
                </div>}
              
              {uploadStatus === 'success' && results && <div className="space-y-6">
                  {(results.batchResult?.consolidatedLabelUrls?.pdf || results.bulk_label_pdf_url) && (
                    <div className="flex justify-center gap-3 mb-6">
                      <PrintPreview
                        labelUrl={results.batchResult?.consolidatedLabelUrls?.pdf || results.bulk_label_pdf_url}
                        trackingCode={null}
                        isBatchPreview={!!results.batchResult}
                        batchResult={results.batchResult}
                        triggerButton={
                          <Button variant="outline" className="shadow-md hover:shadow-lg transition-all duration-200">
                            <PrinterIcon className="mr-2 h-4 w-4" />
                            Print Preview All Labels
                          </Button>
                        }
                      />
                      <PrintPreview
                        labelUrl={results.batchResult?.consolidatedLabelUrls?.pdf || results.bulk_label_pdf_url}
                        trackingCode={null}
                        isBatchPreview={!!results.batchResult}
                        batchResult={results.batchResult}
                        openToEmailTab={true}
                        triggerButton={
                          <Button variant="outline" className="shadow-md hover:shadow-lg transition-all duration-200">
                            <Mail className="mr-2 h-4 w-4" />
                            Email All Labels
                          </Button>
                        }
                      />
                    </div>
                  )}
                  <SuccessNotification results={results} onDownloadAllLabels={handleDownloadAllLabels} onDownloadSingleLabel={handleDownloadSingleLabel} onCreateLabels={handleCreateLabels} isPaying={isPaying} isCreatingLabels={isCreatingLabels} />
                </div>}
              
              {uploadStatus === 'error' && <div className="space-y-6">
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
                  
                  <UploadError onRetry={() => window.location.reload()} onSelectNewFile={() => {
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.click();
                  }
                }} errorMessage="Upload failed. Please check your file format and try again." />
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Chatbot Toggle Button */}
        {uploadStatus === 'editing'}
      </div>

      {/* AI Overview Panel */}
      <BulkAIOverviewPanel selectedShipment={selectedShipmentForAI} allShipments={filteredShipments || []} isOpen={aiPanelOpen} onClose={() => {
      setAiPanelOpen(false);
      setSelectedShipmentForAI(null);
    }} onRateChange={handleSelectRate} onOptimizationChange={handleAIOptimizationChange} />

      {/* Bulk Shipping Chatbot */}
      <BulkShippingChatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} shipments={filteredShipments || []} />

      {/* Modals and Overlays */}
      <LabelCreationOverlay isVisible={labelProgress.isCreating} progress={labelProgress.progress} currentStep={labelProgress.currentStep} totalLabels={processedShipmentsCount} completedLabels={labelProgress.completed} failedLabels={labelProgress.failed} onClose={() => setLabelProgress(prev => ({
      ...prev,
      isCreating: false
    }))} />

    </>;
};
export default BulkUpload;