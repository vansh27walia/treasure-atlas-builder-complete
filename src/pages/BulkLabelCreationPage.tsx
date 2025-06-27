
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Download, Mail, Printer, Eye } from 'lucide-react';
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
  const { shipments, batchResult } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [labelProgress, setLabelProgress] = useState(0);

  const steps: LabelCreationStep[] = [
    { id: 1, title: 'Upload Orders', status: 'completed' },
    { id: 2, title: 'Label Creation', status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending' },
    { id: 3, title: 'Print Preview', status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending' },
    { id: 4, title: 'Download/Email', status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending' },
    { id: 5, title: 'Complete', status: currentStep === 5 ? 'current' : 'pending' }
  ];

  useEffect(() => {
    if (!shipments || !batchResult) {
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
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [shipments, batchResult, navigate]);

  const handleBackToUpload = () => {
    navigate('/bulk-upload');
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
    setCurrentStep(3);
  };

  const handleDownloadPDF = () => {
    if (batchResult?.consolidatedLabelUrls?.pdf) {
      const link = document.createElement('a');
      link.href = batchResult.consolidatedLabelUrls.pdf;
      link.download = `batch_labels_${batchResult.batchId}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF labels downloaded successfully');
      setCurrentStep(4);
    }
  };

  const handleDownloadZPL = () => {
    if (batchResult?.consolidatedLabelUrls?.zpl) {
      const link = document.createElement('a');
      link.href = batchResult.consolidatedLabelUrls.zpl;
      link.download = `batch_labels_${batchResult.batchId}.zpl`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('ZPL labels downloaded successfully');
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getStepColor(step.status)}`}>
                  {step.id}
                </div>
                <span className="text-xs text-gray-600 mt-1">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-16 h-0.5 bg-gray-300 mx-4 mt-[-12px]"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {isCreatingLabels && (
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <BulkLabelCreationProgress
                isVisible={true}
                progress={labelProgress}
                currentStep="Creating labels..."
                totalLabels={shipments?.length || 0}
                completedLabels={Math.floor((labelProgress / 100) * (shipments?.length || 0))}
                failedLabels={0}
              />
            </Card>
          </div>
        )}

        {!isCreatingLabels && currentStep >= 3 && (
          <div className="max-w-6xl mx-auto">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Label Creation Complete!</h2>
                <p className="text-gray-600 mb-6">
                  Your {shipments?.length || 0} shipping labels have been created successfully. 
                  Choose from the options below to preview, download, or email your labels.
                </p>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Button
                    onClick={handleDownloadPDF}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 px-6"
                    disabled={!batchResult?.consolidatedLabelUrls?.pdf}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                  </Button>
                  
                  <Button
                    onClick={handlePrintPreview}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-50 py-3 px-6"
                    disabled={!batchResult?.consolidatedLabelUrls?.pdf}
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Print Preview
                  </Button>
                  
                  <Button
                    onClick={handleDownloadZPL}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 py-3 px-6"
                    disabled={!batchResult?.consolidatedLabelUrls?.zpl}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download ZPL
                  </Button>
                  
                  <Button
                    onClick={handleEmailLabels}
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 py-3 px-6"
                  >
                    <Mail className="mr-2 h-5 w-5" />
                    Email Labels
                  </Button>
                </div>

                {/* Additional Format Downloads */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Additional Download Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => {
                        if (batchResult?.consolidatedLabelUrls?.epl) {
                          const link = document.createElement('a');
                          link.href = batchResult.consolidatedLabelUrls.epl;
                          link.download = `batch_labels_${batchResult.batchId}.epl`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('EPL labels downloaded');
                        }
                      }}
                      variant="outline"
                      className="border-teal-300 text-teal-700 hover:bg-teal-50"
                      disabled={!batchResult?.consolidatedLabelUrls?.epl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download EPL
                    </Button>
                    
                    <Button
                      onClick={() => {
                        if (batchResult?.scanFormUrl) {
                          const link = document.createElement('a');
                          link.href = batchResult.scanFormUrl;
                          link.download = `manifest_${batchResult.batchId}.pdf`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Pickup manifest downloaded');
                        }
                      }}
                      variant="outline"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      disabled={!batchResult?.scanFormUrl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Pickup Manifest
                    </Button>
                    
                    <Button
                      onClick={() => {
                        setCurrentStep(5);
                        toast.success('Label creation process completed!');
                        setTimeout(() => navigate('/bulk-upload'), 2000);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Complete Process
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && batchResult?.consolidatedLabelUrls?.pdf && (
        <BulkLabelPrintPreview
          isOpen={showPrintPreview}
          onClose={() => setShowPrintPreview(false)}
          batchResult={batchResult}
        />
      )}

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={batchResult}
      />
    </div>
  );
};

export default BulkLabelCreationPage;
