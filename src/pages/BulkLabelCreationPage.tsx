
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  PrinterIcon, 
  Package, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Mail,
  ArrowLeft,
  File,
  FileImage
} from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import { toast } from '@/components/ui/sonner';

interface BulkLabelCreationPageState {
  results: BulkUploadResult;
  pickupAddress: any;
}

const BulkLabelCreationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const state = location.state as BulkLabelCreationPageState;
  
  if (!state?.results) {
    navigate('/bulk-upload');
    return null;
  }

  const { results } = state;
  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedLabels = results.processedShipments?.filter(s => s.status === 'failed') || [];

  // Tracking steps
  const steps = [
    { id: 1, title: 'Upload Orders', status: 'completed' },
    { id: 2, title: 'Label Creation', status: 'completed' },
    { id: 3, title: 'Print Preview', status: 'current' },
    { id: 4, title: 'Download/Email', status: 'pending' },
    { id: 5, title: 'Complete', status: 'pending' }
  ];

  const currentStep = 3;
  const progressPercentage = (currentStep / steps.length) * 100;

  const handleDownloadBatch = (format: string, url?: string) => {
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_labels_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${format.toUpperCase()} batch labels`);
  };

  const handleDownloadIndividual = (labelUrl: string, format: string) => {
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `label_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPreview = () => {
    setShowPrintPreview(true);
  };

  const handleEmailLabels = () => {
    setShowEmailModal(true);
  };

  const getStreetAddress = (shipment: any) => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).street1 || '';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/bulk-upload')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Package className="h-6 w-6 mr-3 text-green-600" />
                Batch Labels Created Successfully
              </h1>
              <p className="text-gray-600">Your shipping labels are ready for download and printing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Tracking Bar */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Step {currentStep} of {steps.length}</span>
              <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === 'completed' 
                    ? 'bg-green-600 text-white' 
                    : step.status === 'current'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={`text-xs mt-1 text-center ${
                  step.status === 'current' ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-green-600">{successfulLabels.length}</h3>
            <p className="text-gray-600">Labels Created</p>
          </Card>
          
          <Card className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-red-600">{failedLabels.length}</h3>
            <p className="text-gray-600">Failed Labels</p>
          </Card>
          
          <Card className="p-6 text-center">
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-blue-600">${results.totalCost?.toFixed(2) || '0.00'}</h3>
            <p className="text-gray-600">Total Cost</p>
          </Card>
        </div>

        {/* Main Download Options */}
        <Tabs defaultValue="batch" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batch">Batch Downloads</TabsTrigger>
            <TabsTrigger value="individual">Individual Labels</TabsTrigger>
          </TabsList>

          <TabsContent value="batch">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Batch Download Options
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* PDF Batch */}
                <Button
                  onClick={() => handleDownloadBatch('pdf', results.batchResult?.consolidatedLabelUrls?.pdf)}
                  className="bg-red-600 hover:bg-red-700 text-white h-16 flex flex-col items-center justify-center"
                  size="lg"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.pdf}
                >
                  <File className="h-5 w-5 mb-1" />
                  <span>Download All as PDF</span>
                </Button>

                {/* ZPL Batch */}
                <Button
                  onClick={() => handleDownloadBatch('zpl', results.batchResult?.consolidatedLabelUrls?.zpl)}
                  className="bg-purple-600 hover:bg-purple-700 text-white h-16 flex flex-col items-center justify-center"
                  size="lg"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.zpl}
                >
                  <FileText className="h-5 w-5 mb-1" />
                  <span>Download All as ZPL</span>
                </Button>

                {/* PNG Batch */}
                <Button
                  onClick={() => handleDownloadBatch('png', results.batchResult?.consolidatedLabelUrls?.png)}
                  className="bg-green-600 hover:bg-green-700 text-white h-16 flex flex-col items-center justify-center"
                  size="lg"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.png}
                >
                  <FileImage className="h-5 w-5 mb-1" />
                  <span>Download All as PNG</span>
                </Button>

                {/* Email All */}
                <Button
                  onClick={handleEmailLabels}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-16 flex flex-col items-center justify-center"
                  size="lg"
                >
                  <Mail className="h-5 w-5 mb-1" />
                  <span>Email All Labels</span>
                </Button>
              </div>

              {/* Print Preview and Manifest */}
              <div className="flex gap-4">
                <Button
                  onClick={handlePrintPreview}
                  variant="outline"
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="lg"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.pdf}
                >
                  <PrinterIcon className="mr-2 h-5 w-5" />
                  Full Screen Print Preview
                </Button>

                {results.batchResult?.scanFormUrl && (
                  <Button
                    onClick={() => handleDownloadBatch('pdf', results.batchResult?.scanFormUrl)}
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Pickup Manifest
                  </Button>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="individual">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Individual Label Downloads</h3>
              
              {successfulLabels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4">Recipient</th>
                        <th className="text-left py-3 px-4">Tracking Number</th>
                        <th className="text-left py-3 px-4">Carrier</th>
                        <th className="text-left py-3 px-4">Cost</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {successfulLabels.map((shipment, index) => (
                        <tr key={shipment.id || index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
                              <div className="text-sm text-gray-500">
                                {getStreetAddress(shipment)}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {shipment.tracking_code || shipment.tracking_number}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{shipment.carrier}</div>
                              <div className="text-sm text-gray-500">{shipment.service}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">${shipment.rate?.toFixed(2) || '0.00'}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              {shipment.label_url && (
                                <>
                                  <Button
                                    onClick={() => handleDownloadIndividual(shipment.label_url!, 'pdf')}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                  >
                                    PDF
                                  </Button>
                                  <Button
                                    onClick={() => handleDownloadIndividual(shipment.label_url!, 'png')}
                                    size="sm"
                                    variant="outline"
                                    className="text-green-600 border-green-600 hover:bg-green-50"
                                  >
                                    PNG
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No individual labels available</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Failed Labels Section */}
        {failedLabels.length > 0 && (
          <Card className="p-6 mt-6 border-red-200">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Failed Labels</h3>
            <div className="space-y-3">
              {failedLabels.map((shipment, index) => (
                <div key={shipment.id || index} className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-medium text-red-800">
                    {shipment.customer_name || shipment.recipient}
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    Error: {shipment.error || 'Unknown error occurred'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Full Screen Print Preview */}
      {results.batchResult?.consolidatedLabelUrls?.pdf && (
        <PrintPreview
          isOpenProp={showPrintPreview}
          onOpenChangeProp={setShowPrintPreview}
          labelUrl={results.batchResult.consolidatedLabelUrls.pdf}
          trackingCode={null}
          isBatchPreview={true}
          batchResult={results.batchResult}
        />
      )}

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={results.batchResult || null}
      />
    </div>
  );
};

export default BulkLabelCreationPage;
