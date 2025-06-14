
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Package, Download, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import StripeCheckoutModal from './StripeCheckoutModal';

interface LabelCreationState {
  shipments: any[];
  pickupAddress: any;
  totalCost: number;
}

const LabelCreationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LabelCreationState;
  
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [createdLabels, setCreatedLabels] = useState<any[]>([]);
  const [consolidatedPdfUrl, setConsolidatedPdfUrl] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  useEffect(() => {
    if (!state || !state.shipments) {
      toast.error('No shipment data found. Redirecting to bulk upload.');
      navigate('/bulk-upload');
    }
  }, [state, navigate]);

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    toast.success('Payment successful! You can now create labels.');
  };

  const handleCreateAllLabels = async () => {
    if (!state.shipments || !state.pickupAddress) {
      toast.error('Missing shipment data');
      return;
    }

    setIsCreatingLabels(true);
    setProgress(0);
    setCurrentStep('Starting label creation...');

    try {
      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: state.shipments,
          pickupAddress: state.pickupAddress,
          labelOptions: {
            formats: ['PNG', 'ZPL'], // Only request PNG and ZPL
            generateConsolidatedPdf: true
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      setProgress(100);
      setCurrentStep('Labels created successfully!');
      setCreatedLabels(data.processedLabels || []);
      setConsolidatedPdfUrl(data.consolidatedPdfUrl);
      
      toast.success(`Successfully created ${data.processedLabels?.length || 0} labels with consolidated PDF!`);

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
      setCurrentStep('Label creation failed');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadConsolidated = () => {
    if (!consolidatedPdfUrl) {
      toast.error('Consolidated PDF not available');
      return;
    }

    const link = document.createElement('a');
    link.href = consolidatedPdfUrl;
    link.download = 'batch_label_consolidated_label.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading consolidated label PDF');
  };

  const handleDownloadIndividual = (labelUrl: string, format: string, index: number) => {
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `shipping_label_${index + 1}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!state) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
          <p className="text-gray-600 mb-4">Please start from the bulk upload page.</p>
          <Button onClick={() => navigate('/bulk-upload')}>
            Go to Bulk Upload
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Package className="mr-3 h-6 w-6 text-blue-600" />
              Label Creation
            </h1>
            <p className="text-gray-600 mt-1">
              {state.shipments.length} shipments • Total: ${state.totalCost.toFixed(2)}
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate('/bulk-upload')}
          >
            Back to Upload
          </Button>
        </div>

        {/* Payment Section */}
        {!paymentCompleted && (
          <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium">Payment Required</span>
              </div>
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Make Payment (${state.totalCost.toFixed(2)})
              </Button>
            </div>
          </Card>
        )}

        {/* Payment Success */}
        {paymentCompleted && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Payment Completed Successfully</span>
            </div>
          </Card>
        )}

        {/* Label Creation Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Create Labels</h3>
            {consolidatedPdfUrl && (
              <Button
                onClick={handleDownloadConsolidated}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Consolidated Label
              </Button>
            )}
          </div>

          {isCreatingLabels && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600">{currentStep}</p>
            </div>
          )}

          <Button
            onClick={handleCreateAllLabels}
            disabled={!paymentCompleted || isCreatingLabels}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
          >
            {isCreatingLabels ? 'Creating Labels...' : 'Download All Labels'}
          </Button>
        </div>

        {/* Created Labels List */}
        {createdLabels.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Created Labels</h3>
            <div className="space-y-3">
              {createdLabels.map((label, index) => (
                <Card key={index} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{label.customer_name}</p>
                      <p className="text-sm text-gray-600">Tracking: {label.tracking_code}</p>
                    </div>
                    <div className="flex gap-2">
                      {label.label_urls?.png && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadIndividual(label.label_urls.png, 'png', index)}
                        >
                          PNG
                        </Button>
                      )}
                      {label.label_urls?.pdf && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadIndividual(label.label_urls.pdf, 'pdf', index)}
                        >
                          PDF
                        </Button>
                      )}
                      {label.label_urls?.zpl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadIndividual(label.label_urls.zpl, 'zpl', index)}
                        >
                          ZPL
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Stripe Checkout Modal */}
      <StripeCheckoutModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={state.totalCost}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default LabelCreationPage;
