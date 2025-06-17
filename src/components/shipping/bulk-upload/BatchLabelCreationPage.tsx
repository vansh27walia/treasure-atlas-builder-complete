
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, FileText, Package, CheckCircle, XCircle, Eye, Mail, Download, Printer } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

interface BatchLabelCreationPageProps {
  batchResult: BulkUploadResult;
  onBack: () => void;
  onPrintReview: () => void;
  onEmailLabels: (email: string) => void;
  isCreatingLabels: boolean;
  labelGenerationProgress: {
    isGenerating: boolean;
    totalShipments: number;
    processedShipments: number;
    successfulShipments: number;
    failedShipments: number;
    currentStep: string;
    estimatedTimeRemaining: number;
  };
}

const BatchLabelCreationPage: React.FC<BatchLabelCreationPageProps> = ({
  batchResult,
  onBack,
  onPrintReview,
  onEmailLabels,
  isCreatingLabels,
  labelGenerationProgress
}) => {
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleEmailSend = () => {
    if (!emailAddress.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    onEmailLabels(emailAddress);
    setShowEmailDialog(false);
    setEmailAddress('');
  };

  const handleDownloadBatch = () => {
    if (batchResult.bulk_label_pdf_url) {
      const link = document.createElement('a');
      link.href = batchResult.bulk_label_pdf_url;
      link.download = `batch_labels_${Date.now()}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Batch labels downloaded successfully');
    } else {
      toast.error('Batch PDF not available for download');
    }
  };

  const allShipments = batchResult.processedShipments || [];
  const completedLabels = allShipments.filter(s => s.status === 'completed' || s.label_url);
  const failedLabels = allShipments.filter(s => s.status === 'failed');
  const pendingLabels = allShipments.filter(s => !s.status || s.status === 'pending_rates' || s.status === 'rates_fetched' || s.status === 'rate_selected');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Upload
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Batch Label Creation</h1>
              <p className="text-gray-600 mt-2">
                Creating shipping labels for {allShipments.length} shipments
              </p>
            </div>
            
            {/* Print Review Button - Top Right */}
            <div className="flex space-x-3">
              {batchResult.bulk_label_pdf_url && !labelGenerationProgress.isGenerating && (
                <>
                  <Button
                    onClick={handleDownloadBatch}
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Batch
                  </Button>
                  <Button
                    onClick={() => setShowEmailDialog(true)}
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send to Email
                  </Button>
                  <Button
                    onClick={onPrintReview}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Print Review
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {labelGenerationProgress.isGenerating && (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Creating Labels...</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  {labelGenerationProgress.processedShipments} of {labelGenerationProgress.totalShipments}
                </Badge>
              </div>
              
              <Progress 
                value={(labelGenerationProgress.processedShipments / labelGenerationProgress.totalShipments) * 100} 
                className="w-full h-3"
              />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {labelGenerationProgress.successfulShipments}
                  </div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {labelGenerationProgress.failedShipments}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {labelGenerationProgress.estimatedTimeRemaining}s
                  </div>
                  <div className="text-sm text-blue-700">Est. Time</div>
                </div>
              </div>
              
              <p className="text-center text-gray-600">{labelGenerationProgress.currentStep}</p>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{allShipments.length}</div>
                <div className="text-sm text-gray-600">Total Shipments</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completedLabels.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{failedLabels.length}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{pendingLabels.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Individual Label List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Individual Labels</h2>
          <div className="space-y-4">
            {allShipments.map((shipment, index) => (
              <div
                key={shipment.id || index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {shipment.status === 'completed' || shipment.label_url ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : shipment.status === 'failed' ? (
                      <XCircle className="h-6 w-6 text-red-600" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-gray-300 animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {shipment.customer_name || shipment.recipient || `Shipment ${index + 1}`}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shipment.customer_address || 'No address available'}
                    </div>
                    {shipment.tracking_code && (
                      <div className="text-sm text-blue-600">
                        Tracking: {shipment.tracking_code}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {shipment.carrier} - {shipment.service}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${shipment.rate?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {shipment.label_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(shipment.label_url, '_blank')}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  )}
                  
                  {shipment.status === 'failed' && (
                    <Badge variant="destructive" className="text-xs">
                      Failed
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Email Dialog Modal */}
        {showEmailDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Send Batch Labels via Email</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter recipient email address"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  The consolidated batch PDF ({completedLabels.length} labels) will be sent as an attachment.
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleEmailSend} className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailDialog(false);
                      setEmailAddress('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchLabelCreationPage;
