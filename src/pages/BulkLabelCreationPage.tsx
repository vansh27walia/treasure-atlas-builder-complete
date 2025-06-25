
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, Mail, Printer, Eye, Package, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import BulkLabelCreationProgress from '@/components/shipping/bulk-upload/BulkLabelCreationProgress';
import BulkLabelPrintPreview from '@/components/shipping/bulk-upload/BulkLabelPrintPreview';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';

interface LabelCreationStep {
  id: number;
  title: string;
  status: 'completed' | 'current' | 'pending';
}

const BulkLabelCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { shipments, batchResult, pickupAddress } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [labelProgress, setLabelProgress] = useState(0);
  const [createdBatchResult, setCreatedBatchResult] = useState(null);

  const steps: LabelCreationStep[] = [
    { id: 1, title: 'Upload Orders', status: 'completed' },
    { id: 2, title: 'Label Creation', status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, title: 'Print Preview', status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending' },
    { id: 4, title: 'Download/Email', status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending' },
    { id: 5, title: 'Complete', status: currentStep === 5 ? 'current' : 'pending' }
  ];

  useEffect(() => {
    if (!shipments || !pickupAddress) {
      navigate('/bulk-upload');
      return;
    }
    // Start label creation process
    setCurrentStep(2);
    setIsCreatingLabels(true);
    
    // Simulate label creation progress
    const interval = setInterval(() => {
      setLabelProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCreatingLabels(false);
          setCurrentStep(3);
          // Simulate batch result creation
          const mockBatchResult = {
            batchId: `BATCH_${Date.now()}`,
            consolidatedLabelUrls: {
              pdf: `https://example.com/batch_${Date.now()}.pdf`,
              zpl: `https://example.com/batch_${Date.now()}.zpl`,
              epl: `https://example.com/batch_${Date.now()}.epl`,
              pdfZip: `https://example.com/batch_${Date.now()}_pdfs.zip`,
              zplZip: `https://example.com/batch_${Date.now()}_zpls.zip`,
              eplZip: `https://example.com/batch_${Date.now()}_epls.zip`
            },
            scanFormUrl: `https://example.com/manifest_${Date.now()}.pdf`
          };
          setCreatedBatchResult(mockBatchResult);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [shipments, pickupAddress, navigate]);

  const handleBackToUpload = () => {
    navigate('/bulk-upload');
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
    setCurrentStep(3);
  };

  const handleDownloadPDF = () => {
    if (createdBatchResult?.consolidatedLabelUrls?.pdf) {
      const link = document.createElement('a');
      link.href = createdBatchResult.consolidatedLabelUrls.pdf;
      link.download = `batch_labels_${createdBatchResult.batchId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF labels downloaded successfully');
      setCurrentStep(4);
    }
  };

  const handleDownloadZPL = () => {
    if (createdBatchResult?.consolidatedLabelUrls?.zpl) {
      const link = document.createElement('a');
      link.href = createdBatchResult.consolidatedLabelUrls.zpl;
      link.download = `batch_labels_${createdBatchResult.batchId}.zpl`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('ZPL labels downloaded successfully');
      setCurrentStep(4);
    }
  };

  const handleDownloadEPL = () => {
    if (createdBatchResult?.consolidatedLabelUrls?.epl) {
      const link = document.createElement('a');
      link.href = createdBatchResult.consolidatedLabelUrls.epl;
      link.download = `batch_labels_${createdBatchResult.batchId}.epl`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('EPL labels downloaded successfully');
      setCurrentStep(4);
    }
  };

  const handleDownloadManifest = () => {
    if (createdBatchResult?.scanFormUrl) {
      const link = document.createElement('a');
      link.href = createdBatchResult.scanFormUrl;
      link.download = `manifest_${createdBatchResult.batchId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Pickup manifest downloaded');
      setCurrentStep(4);
    }
  };

  const handleEmailLabels = () => {
    setShowEmailModal(true);
    setCurrentStep(4);
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToUpload}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Upload</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Label Creation</h1>
          </div>
          <div className="text-sm text-gray-600">
            {shipments?.length || 0} labels being processed
          </div>
        </div>
      </div>

      {/* Progress Steps Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStepColor(step.status)}`}>
                    {step.status === 'completed' ? <CheckCircle className="h-6 w-6" /> : step.id}
                  </div>
                  <span className="text-sm text-gray-600 mt-2 font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-20 h-1 bg-gray-300 mx-6 mt-[-20px]">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        steps[index + 1].status === 'completed' ? 'bg-green-500' : 
                        steps[index + 1].status === 'current' ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ 
                        width: steps[index + 1].status === 'completed' ? '100%' : 
                               steps[index + 1].status === 'current' ? '50%' : '0%' 
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {isCreatingLabels && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <BulkLabelCreationProgress
              isVisible={true}
              progress={labelProgress}
              currentStep="Creating labels..."
              totalLabels={shipments?.length || 0}
              completedLabels={Math.floor((labelProgress / 100) * (shipments?.length || 0))}
              failedLabels={0}
            />
          </div>
        )}

        {!isCreatingLabels && currentStep >= 3 && (
          <div className="space-y-6">
            {/* Success Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Package className="h-12 w-12 text-green-600 mr-3" />
                  <h2 className="text-3xl font-bold text-gray-900">Labels Created Successfully!</h2>
                </div>
                <p className="text-gray-600 text-lg">
                  Your {shipments?.length || 0} shipping labels have been created and are ready for download, preview, and email.
                </p>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-6">Download & Preview Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Button
                  onClick={handleDownloadPDF}
                  className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 h-auto flex flex-col items-center space-y-2"
                  disabled={!createdBatchResult?.consolidatedLabelUrls?.pdf}
                >
                  <Download className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Download PDF</div>
                    <div className="text-xs opacity-90">All labels merged</div>
                  </div>
                </Button>
                
                <Button
                  onClick={handlePrintPreview}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 h-auto flex flex-col items-center space-y-2"
                  disabled={!createdBatchResult?.consolidatedLabelUrls?.pdf}
                >
                  <Eye className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Print Preview</div>
                    <div className="text-xs opacity-90">Full screen preview</div>
                  </div>
                </Button>
                
                <Button
                  onClick={handleEmailLabels}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 h-auto flex flex-col items-center space-y-2"
                >
                  <Mail className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Email Labels</div>
                    <div className="text-xs opacity-90">Send to email</div>
                  </div>
                </Button>

                <Button
                  onClick={handleDownloadManifest}
                  className="bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 h-auto flex flex-col items-center space-y-2"
                  disabled={!createdBatchResult?.scanFormUrl}
                >
                  <FileText className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Pickup Manifest</div>
                    <div className="text-xs opacity-90">For carrier pickup</div>
                  </div>
                </Button>
              </div>

              {/* Additional Format Downloads */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4">Additional Download Formats</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={handleDownloadZPL}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 py-3"
                    disabled={!createdBatchResult?.consolidatedLabelUrls?.zpl}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download ZPL
                  </Button>
                  
                  <Button
                    onClick={handleDownloadEPL}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 py-3"
                    disabled={!createdBatchResult?.consolidatedLabelUrls?.epl}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download EPL
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setCurrentStep(5);
                      toast.success('Label creation process completed!');
                      setTimeout(() => navigate('/bulk-upload'), 2000);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    Complete Process
                  </Button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-green-600">{shipments?.length || 0}</h3>
                <p className="text-gray-600">Labels Created</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-red-600">0</h3>
                <p className="text-gray-600">Failed Labels</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Package className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-blue-600">$0.00</h3>
                <p className="text-gray-600">Total Cost</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && createdBatchResult && (
        <BulkLabelPrintPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          batchResult={createdBatchResult}
        />
      )}

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={createdBatchResult}
      />
    </div>
  );
};

export default BulkLabelCreationPage;
