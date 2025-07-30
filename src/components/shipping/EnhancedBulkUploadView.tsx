
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Brain, Zap, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkUploadForm from './bulk-upload/BulkUploadForm';
import BulkResults from './bulk-upload/BulkResults';
import BulkInsuranceCalculator from './BulkInsuranceCalculator';
import AIOverviewManager from './AIOverviewManager';
import CarrierLogo from './CarrierLogo';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';

interface EnhancedBulkUploadViewProps {
  onUploadComplete?: (results: any) => void;
}

const EnhancedBulkUploadView: React.FC<EnhancedBulkUploadViewProps> = ({ onUploadComplete }) => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'rates' | 'complete'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [allRates, setAllRates] = useState<any[]>([]);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [ratesFetchProgress, setRatesFetchProgress] = useState(0);
  const [aiTriggers, setAITriggers] = useState({
    ratesFetched: false,
    rateSelected: false,
    paymentEntered: false
  });

  const { handleUpload } = useShipmentUpload();

  const handleUploadStart = () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setUploadProgress(0);
  };

  const handleUploadSuccess = (uploadResults: any) => {
    setResults(uploadResults);
    setCurrentStep('rates');
    setIsProcessing(false);
    
    // Extract rates and trigger AI
    if (uploadResults?.shipments) {
      const extractedRates = uploadResults.shipments
        .filter((shipment: any) => shipment.rates && shipment.rates.length > 0)
        .flatMap((shipment: any) => shipment.rates);
      
      setAllRates(extractedRates);
      setAITriggers(prev => ({ ...prev, ratesFetched: true }));
    }
    
    setCurrentStep('complete');
    toast.success('Upload completed! AI analyzing rates...');
  };

  const handleRateSelected = (rate: any) => {
    setSelectedRate(rate);
    setShowAISidebar(true);
    setAITriggers(prev => ({ ...prev, rateSelected: true }));
  };

  const handlePaymentEntry = () => {
    setAITriggers(prev => ({ ...prev, paymentEntered: true }));
    setShowAISidebar(false);
  };

  // Calculate insurance for all shipments
  const shipmentsWithInsurance = results?.shipments?.map((shipment: any) => ({
    ...shipment,
    declaredValue: shipment.declaredValue || 100,
    calculatedInsurance: Math.min(Math.max(2, Math.ceil(((shipment.declaredValue || 100) / 100) * 2)), 200)
  })) || [];

  const stepIndicators = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'processing', label: 'Processing', icon: Loader2 },
    { key: 'rates', label: 'Rates', icon: Zap },
    { key: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header with Step Indicator */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Bulk Label Creation</h1>
            <p className="text-gray-600">AI-powered bulk shipping with smart rate optimization</p>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {stepIndicators.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.key === currentStep;
              const isCompleted = stepIndicators.findIndex(s => s.key === currentStep) > index;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                    isActive 
                      ? 'border-blue-600 bg-blue-600 text-white' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-500'
                  }`}>
                    <Icon className={`w-4 h-4 ${isActive && step.key === 'processing' ? 'animate-spin' : ''}`} />
                    <span className="font-medium">{step.label}</span>
                  </div>
                  {index < stepIndicators.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-gray-400 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`container mx-auto px-4 py-8 transition-all duration-300 ${showAISidebar ? 'pr-96' : ''}`}>
        <div className="space-y-6">
          
          {/* Upload Section */}
          {currentStep === 'upload' && (
            <Card className="shadow-lg border-2 border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Upload Your Shipments
                  <Badge className="bg-blue-100 text-blue-800">CSV Format</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <BulkUploadForm
                  onUploadSuccess={handleUploadSuccess}
                  onUploadFail={(error) => toast.error(error)}
                  onPickupAddressSelect={(address) => console.log('Address selected:', address)}
                  isUploading={isProcessing}
                  progress={uploadProgress}
                  handleUpload={handleUpload}
                />
              </CardContent>
            </Card>
          )}

          {/* Processing Section */}
          {currentStep === 'processing' && (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
                  <h3 className="text-xl font-semibold">Processing Your Shipments</h3>
                  <p className="text-gray-600">AI is analyzing your data and fetching rates...</p>
                  <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {results && currentStep === 'complete' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="text-sm text-blue-600">AI Analyzed Rates</div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-800">
                      ${(results.totalCost || 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-600">Total Cost</div>
                  </CardContent>
                </Card>
              </div>

              {/* Insurance Calculator */}
              {shipmentsWithInsurance.length > 0 && (
                <BulkInsuranceCalculator
                  shipments={shipmentsWithInsurance}
                  onInsuranceUpdate={(shipmentId, insurance) => {
                    console.log('Insurance updated:', shipmentId, insurance);
                  }}
                />
              )}

              {/* AI Rate Overview */}
              {allRates.length > 0 && (
                <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <Brain className="w-5 h-5" />
                      AI Rate Intelligence
                      <Badge className="bg-blue-100 text-blue-800">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Smart Analysis
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
                        <div className="font-bold text-green-600">
                          ${Math.min(...allRates.map(r => parseFloat(r.rate))).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Cheapest Rate</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
                        <div className="font-bold text-blue-600">
                          ${Math.max(...allRates.map(r => parseFloat(r.rate))).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Highest Rate</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
                        <div className="font-bold text-purple-600">
                          {Math.min(...allRates.map(r => r.delivery_days || 999))} days
                        </div>
                        <div className="text-xs text-gray-600">Fastest Delivery</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border shadow-sm">
                        <div className="font-bold text-orange-600">
                          ${(allRates.reduce((sum, r) => sum + parseFloat(r.rate), 0) / allRates.length).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-600">Average Cost</div>
                      </div>
                    </div>

                    {/* Sample Rates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allRates.slice(0, 6).map((rate, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300"
                          onClick={() => handleRateSelected(rate)}
                        >
                          <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{rate.carrier} {rate.service}</div>
                            <div className="text-xs text-gray-600">
                              ${parseFloat(rate.rate).toFixed(2)} • {rate.delivery_days} days
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                            Analyze
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Results */}
              <BulkResults 
                results={results} 
                onRateChange={(shipmentId, rateId) => {
                  console.log('Rate changed:', shipmentId, rateId);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* AI Overview Manager */}
      <AIOverviewManager
        isVisible={true}
        context="bulk"
        selectedRate={selectedRate}
        allRates={allRates}
        onClose={() => setShowAISidebar(false)}
        onManualDismiss={() => setAITriggers(prev => ({ ...prev, ratesFetched: false, rateSelected: false }))}
        triggers={aiTriggers}
      />

      {/* AI Sidebar for Rate Details */}
      {showAISidebar && selectedRate && (
        <div className="fixed top-0 right-0 h-screen w-80 bg-white shadow-2xl z-50 border-l-4 border-blue-500 overflow-y-auto">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Rate Analysis</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAISidebar(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Selected Rate Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CarrierLogo carrier={selectedRate.carrier} className="w-6 h-6" />
                  <h4 className="font-semibold">{selectedRate.carrier} {selectedRate.service}</h4>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  ${parseFloat(selectedRate.rate).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedRate.delivery_days} days delivery
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-sm space-y-2">
                <p>This rate offers good value for bulk shipping with reliable delivery times.</p>
                <div className="bg-blue-50 p-2 rounded">
                  <strong>Recommendation:</strong> Suitable for standard bulk shipments where cost-effectiveness is priority.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBulkUploadView;
