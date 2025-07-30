
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Brain, Zap, Truck, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkUploadForm from './BulkUploadForm';
import BulkResults from './BulkResults';
import AdvancedProgressTracker from './AdvancedProgressTracker';
import AIRateAnalysisPanel from '../AIRateAnalysisPanel';
import CarrierLogo from '../CarrierLogo';
import InstantAddressForm from '../InstantAddressForm';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { SavedAddress } from '@/services/AddressService';

interface BulkUploadViewProps {
  onUploadComplete?: (results: any) => void;
}

const BulkUploadView: React.FC<BulkUploadViewProps> = ({ onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('upload');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [allRates, setAllRates] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'editing' | 'success' | 'error'>('idle');
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<SavedAddress | null>(null);
  const [showQuickAddressForm, setShowQuickAddressForm] = useState(false);

  const { handleUpload } = useShipmentUpload();

  const handleUploadStart = () => {
    setIsProcessing(true);
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setCurrentStep('processing');
    setIsFetchingRates(true);
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
    
    // Simulate different stages based on progress
    if (progress < 30) {
      setCurrentStep('parsing-csv');
    } else if (progress < 70) {
      setCurrentStep('fetching-rates');
      setIsFetchingRates(true);
    } else {
      setCurrentStep('finalizing');
      setIsFetchingRates(false);
    }
  };

  const handleUploadSuccess = (uploadResults: any) => {
    setResults(uploadResults);
    setIsProcessing(false);
    setIsUploading(false);
    setIsFetchingRates(false);
    setUploadStatus('success');
    setCurrentStep('complete');
    
    // Extract rates from results for AI analysis
    if (uploadResults?.shipments) {
      const extractedRates = uploadResults.shipments
        .filter((shipment: any) => shipment.rates && shipment.rates.length > 0)
        .flatMap((shipment: any) => shipment.rates);
      
      setAllRates(extractedRates);
      
      // Auto-select first rate for analysis
      if (extractedRates.length > 0) {
        setSelectedRate(extractedRates[0]);
        setShowAIPanel(true);
      }
    }
    
    if (onUploadComplete) {
      onUploadComplete(uploadResults);
    }
    
    toast.success('Bulk upload completed successfully! All rates fetched and analyzed.');
  };

  const handleUploadFail = (error: string) => {
    setIsProcessing(false);
    setIsUploading(false);
    setIsFetchingRates(false);
    setUploadStatus('error');
    setCurrentStep('upload');
    toast.error(`Upload failed: ${error}`);
  };

  const handlePickupAddressSelect = (address: SavedAddress) => {
    console.log('Pickup address selected:', address);
    setSelectedPickupAddress(address);
    setShowQuickAddressForm(false);
    toast.success('Pickup address selected successfully');
  };

  const handleAddressSaved = (savedAddress: SavedAddress) => {
    console.log('New address saved:', savedAddress);
    setSelectedPickupAddress(savedAddress);
    setShowQuickAddressForm(false);
    toast.success('New pickup address saved and selected');
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedPickupAddress) {
      toast.error('Please select a pickup address first');
      return;
    }

    try {
      handleUploadStart();
      toast.info('Starting bulk upload and rate fetching...');
      
      // Simulate realistic progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      await handleUpload(file, selectedPickupAddress);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      handleUploadSuccess({ 
        shipments: [], 
        total: 0, 
        successful: 0, 
        failed: 0,
        message: 'Bulk upload processing completed'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      handleUploadFail(errorMessage);
    }
  };

  const handleRateSelected = (rate: any) => {
    setSelectedRate(rate);
    setShowAIPanel(true);
  };

  const handleRateChange = (shipmentId: string, rateId: string) => {
    // Handle rate change logic
    if (results?.shipments) {
      const updatedShipments = results.shipments.map((shipment: any) => {
        if (shipment.id === shipmentId) {
          const selectedRate = shipment.rates?.find((rate: any) => rate.id === rateId);
          return { ...shipment, selectedRate };
        }
        return shipment;
      });
      setResults({ ...results, shipments: updatedShipments });
    }
  };

  const handleOptimizationChange = (filter: string) => {
    // Apply optimization logic
    let sortedRates = [...allRates];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        toast.success('Rates optimized for lowest cost');
        break;
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        toast.success('Rates optimized for fastest delivery');
        break;
      case 'balanced':
        sortedRates.sort((a, b) => {
          const scoreA = (parseFloat(a.rate) / 10) + (a.delivery_days || 999);
          const scoreB = (parseFloat(b.rate) / 10) + (b.delivery_days || 999);
          return scoreA - scoreB;
        });
        toast.success('Rates optimized for best balance');
        break;
      default:
        toast.success(`Applied ${filter} optimization`);
        break;
    }
    
    setAllRates(sortedRates);
    if (sortedRates.length > 0) {
      setSelectedRate(sortedRates[0]);
    }
  };

  return (
    <div className={`transition-all duration-300 ${showAIPanel ? 'pr-80' : ''}`}>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Label Creation</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your CSV file to create multiple shipping labels at once with AI-powered rate optimization and instant address management.
          </p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge className="bg-green-100 text-green-800">AI-Powered</Badge>
            <Badge className="bg-blue-100 text-blue-800">Bulk Processing</Badge>
            <Badge className="bg-purple-100 text-purple-800">Rate Optimization</Badge>
          </div>
        </div>

        {/* Progress Tracker with Enhanced Status */}
        {isProcessing && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <AdvancedProgressTracker 
                uploadStatus={uploadStatus}
                isUploading={isUploading}
                isFetchingRates={isFetchingRates}
                isCreatingLabels={isCreatingLabels}
                progress={uploadProgress}
                totalShipments={results?.shipments?.length || 0}
                processedShipments={results?.processedShipments?.length || 0}
              />
              
              {isFetchingRates && (
                <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="font-medium text-blue-800">Fetching shipping rates...</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Comparing rates from multiple carriers for best pricing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pickup Address Selection Section */}
        {!results && (
          <Card className="shadow-lg border-2 border-orange-200 bg-orange-50">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-200 border-b">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Select Pickup Address
                <Badge className="bg-orange-100 text-orange-800">Required</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedPickupAddress ? (
                <div className="space-y-4">
                  <p className="text-gray-600">Choose or add a pickup address for your bulk shipments:</p>
                  
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowQuickAddressForm(false)}
                      className="flex-1"
                    >
                      Select Existing Address
                    </Button>
                    <Button
                      onClick={() => setShowQuickAddressForm(true)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Add New Address
                    </Button>
                  </div>

                  {showQuickAddressForm && (
                    <div className="mt-6">
                      <InstantAddressForm
                        onAddressSaved={handleAddressSaved}
                        isPickupAddress={true}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Pickup Address Selected</span>
                    </div>
                    <p className="text-green-700">
                      {selectedPickupAddress.name} - {selectedPickupAddress.street1}, {selectedPickupAddress.city}, {selectedPickupAddress.state} {selectedPickupAddress.zip}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedPickupAddress(null)}
                    className="w-full"
                  >
                    Change Pickup Address
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Form */}
        {!results && selectedPickupAddress && (
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload Shipments
                <Badge className="bg-blue-100 text-blue-800">CSV Format</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BulkUploadForm
                onUploadSuccess={handleUploadSuccess}
                onUploadFail={handleUploadFail}
                onPickupAddressSelect={handlePickupAddressSelect}
                isUploading={isUploading}
                progress={uploadProgress}
                handleUpload={handleFileUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-800">
                    {results.successfulShipments?.length || 0}
                  </div>
                  <div className="text-sm text-green-600">Successful</div>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold text-red-800">
                    {results.failedShipments?.length || 0}
                  </div>
                  <div className="text-sm text-red-600">Failed</div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-800">
                    {allRates.length}
                  </div>
                  <div className="text-sm text-blue-600">Total Rates</div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Section */}
            {allRates.length > 0 && (
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Brain className="w-5 h-5" />
                    AI Rate Insights
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAIPanel(!showAIPanel)}
                      className="ml-auto"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      {showAIPanel ? 'Hide' : 'Show'} AI Analysis
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="font-bold text-green-600">
                        ${Math.min(...allRates.map(r => parseFloat(r.rate))).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Cheapest Rate</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="font-bold text-blue-600">
                        ${Math.max(...allRates.map(r => parseFloat(r.rate))).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Highest Rate</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="font-bold text-purple-600">
                        {Math.min(...allRates.map(r => r.delivery_days || 999))} days
                      </div>
                      <div className="text-xs text-gray-600">Fastest Delivery</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="font-bold text-orange-600">
                        ${(allRates.reduce((sum, r) => sum + parseFloat(r.rate), 0) / allRates.length).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-600">Average Cost</div>
                    </div>
                  </div>

                  {/* Sample Rates with Enhanced Display */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-800">Sample Rates Available:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {allRates.slice(0, 4).map((rate, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white rounded border cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                          onClick={() => handleRateSelected(rate)}
                        >
                          <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{rate.carrier} {rate.service}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-2">
                              <span>${parseFloat(rate.rate).toFixed(2)}</span>
                              <span>•</span>
                              <span>{rate.delivery_days} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Results */}
            <BulkResults results={results} onRateChange={handleRateChange} />
          </div>
        )}
      </div>

      {/* AI Analysis Panel for Bulk Upload */}
      {showAIPanel && selectedRate && allRates.length > 0 && (
        <AIRateAnalysisPanel
          selectedRate={selectedRate}
          allRates={allRates}
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          onOptimizationChange={handleOptimizationChange}
        />
      )}
    </div>
  );
};

export default BulkUploadView;
