
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Brain, Zap } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkUploadForm from './BulkUploadForm';
import BulkResults from './BulkResults';
import AdvancedProgressTracker from './AdvancedProgressTracker';
import AIRateAnalysisPanel from '../AIRateAnalysisPanel';
import CarrierLogo from '../CarrierLogo';

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

  const handleUploadStart = () => {
    setIsProcessing(true);
    setUploadProgress(0);
    setCurrentStep('processing');
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const handleUploadComplete = (uploadResults: any) => {
    setResults(uploadResults);
    setIsProcessing(false);
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
    
    toast.success('Bulk upload completed successfully!');
  };

  const handleRateSelected = (rate: any) => {
    setSelectedRate(rate);
    setShowAIPanel(true);
  };

  const handleOptimizationChange = (filter: string) => {
    // Apply optimization logic similar to the main page
    let sortedRates = [...allRates];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'balanced':
        sortedRates.sort((a, b) => {
          const scoreA = (parseFloat(a.rate) / 10) + (a.delivery_days || 999);
          const scoreB = (parseFloat(b.rate) / 10) + (b.delivery_days || 999);
          return scoreA - scoreB;
        });
        break;
      default:
        break;
    }
    
    setAllRates(sortedRates);
    if (sortedRates.length > 0) {
      setSelectedRate(sortedRates[0]);
    }
    
    toast.success(`Applied ${filter} optimization to bulk rates`);
  };

  return (
    <div className={`transition-all duration-300 ${showAIPanel ? 'pr-80' : ''}`}>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Label Creation</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your CSV file to create multiple shipping labels at once with AI-powered rate optimization.
          </p>
        </div>

        {/* Progress Tracker */}
        {isProcessing && (
          <AdvancedProgressTracker 
            progress={uploadProgress}
            currentStep={currentStep}
            totalSteps={3}
          />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6">
          {/* Upload Form */}
          {!results && (
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
                  onUploadStart={handleUploadStart}
                  onUploadProgress={handleUploadProgress}
                  onUploadComplete={handleUploadComplete}
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

                    {/* Sample Rates with Carrier Logos */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800">Sample Rates Available:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {allRates.slice(0, 4).map((rate, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-white rounded border cursor-pointer hover:bg-gray-50"
                            onClick={() => handleRateSelected(rate)}
                          >
                            <CarrierLogo carrier={rate.carrier} className="w-6 h-6" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{rate.carrier} {rate.service}</div>
                              <div className="text-xs text-gray-600">
                                ${parseFloat(rate.rate).toFixed(2)} - {rate.delivery_days} days
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
              <BulkResults results={results} />
            </div>
          )}
        </div>
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
