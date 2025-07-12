import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Package, CheckCircle, AlertCircle, FileText, CreditCard, RefreshCw } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { toast } from 'sonner';

interface BatchLabelCreationPageProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string) => void;
  batchPrintPreviewModalOpen: boolean;
  setBatchPrintPreviewModalOpen: (open: boolean) => void;
}

const BatchLabelCreationPage: React.FC<BatchLabelCreationPageProps> = ({
  results,
  onDownloadSingleLabel,
  batchPrintPreviewModalOpen,
  setBatchPrintPreviewModalOpen
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [labelsCreated, setLabelsCreated] = useState(false);

  const handleBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  const handleRefreshRates = async () => {
    setIsRefreshingRates(true);
    try {
      // Simulate rate refresh
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Rates refreshed successfully');
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates');
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      setLabelsCreated(true);
      setShowPaymentModal(false);
      toast.success('Payment successful! Labels have been created.');
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  // Generate consolidated label URLs from Supabase storage
  const generateConsolidatedLabelUrl = (format: string) => {
    const batchId = results.batchResult?.batchId;
    if (!batchId) return null;
    
    // Construct the Supabase storage URL for consolidated labels
    const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/batch_labels';
    return `${baseUrl}/batch_label_${batchId}.${format}`;
  };

  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedLabels = results.processedShipments?.filter(s => s.status === 'failed') || [];

  // Get street address safely
  const getStreetAddress = (shipment: any) => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).street1 || '';
    }
    return '';
  };

  // Calculate total cost for payment
  const totalCost = results.totalCost || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {labelsCreated ? 'Batch Labels Created Successfully' : 'Complete Your Batch Order'}
            </h1>
          </div>
          <p className="text-gray-600">
            {labelsCreated 
              ? 'Your shipping labels have been generated and are ready for download and printing.'
              : 'Review your order and complete payment to generate your shipping labels.'
            }
          </p>
        </div>

        {/* Payment Section - Show if labels not created yet */}
        {!labelsCreated && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">Complete Payment</h2>
                <p className="text-blue-700">Process payment to generate your shipping labels</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-900">${totalCost.toFixed(2)}</div>
                <div className="text-sm text-blue-600">{successfulLabels.length} labels</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                size="lg"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Complete Payment
              </Button>
              
              <Button
                onClick={handleRefreshRates}
                disabled={isRefreshingRates}
                variant="outline"
                className="px-6 py-3"
                size="lg"
              >
                {isRefreshingRates ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Rates
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Complete Payment</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                >
                  ×
                </Button>
              </div>
              
              <PaymentMethodSelector
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodChange={setSelectedPaymentMethod}
                onPaymentComplete={handlePaymentComplete}
                amount={totalCost}
                description={`Bulk Shipping Labels (${successfulLabels.length} labels)`}
              />
            </div>
          </div>
        )}

        {/* Consolidated Download Section - Show only after payment */}
        {labelsCreated && successfulLabels.length > 0 && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-green-900">Download Consolidated Labels</h2>
            </div>
            <p className="text-green-700 mb-4">Download all labels as consolidated files in different formats:</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Consolidated PDF */}
              <Button
                onClick={() => {
                  const url = generateConsolidatedLabelUrl('pdf');
                  if (url) onDownloadSingleLabel(url);
                }}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center h-16"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Consolidated PDF</div>
                  <div className="text-xs opacity-90">All Labels</div>
                </div>
              </Button>

              {/* Consolidated ZPL */}
              <Button
                onClick={() => {
                  const url = generateConsolidatedLabelUrl('zpl');
                  if (url) onDownloadSingleLabel(url);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center h-16"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Consolidated ZPL</div>
                  <div className="text-xs opacity-90">All Labels</div>
                </div>
              </Button>

              {/* Consolidated PNG */}
              <Button
                onClick={() => {
                  const url = generateConsolidatedLabelUrl('png');
                  if (url) onDownloadSingleLabel(url);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center h-16"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Consolidated PNG</div>
                  <div className="text-xs opacity-90">All Labels</div>
                </div>
              </Button>

              {/* Consolidated EPL */}
              <Button
                onClick={() => {
                  const url = generateConsolidatedLabelUrl('epl');
                  if (url) onDownloadSingleLabel(url);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center h-16"
                size="lg"
              >
                <Download className="mr-2 h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Consolidated EPL</div>
                  <div className="text-xs opacity-90">All Labels</div>
                </div>
              </Button>
            </div>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-green-600">{successfulLabels.length}</h3>
            <p className="text-gray-600">Labels Ready</p>
          </Card>
          
          <Card className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-red-600">{failedLabels.length}</h3>
            <p className="text-gray-600">Failed Labels</p>
          </Card>
          
          <Card className="p-6 text-center">
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-blue-600">${totalCost.toFixed(2)}</h3>
            <p className="text-gray-600">Total Cost</p>
          </Card>
        </div>

        {/* Batch Actions - Show only after payment */}
        {labelsCreated && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Batch Actions</h2>
            <div className="flex flex-wrap gap-4">
              {/* Batch Print Preview */}
              <Button
                onClick={handleBatchPrintPreview}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center"
                size="lg"
              >
                <PrinterIcon className="mr-2 h-5 w-5" />
                Print Preview All Labels
              </Button>
            </div>
          </Card>
        )}

        {/* Individual Labels Table - Show only after payment */}
        {labelsCreated && successfulLabels.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Individual Labels</h2>
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
                            <Button
                              onClick={() => onDownloadSingleLabel(shipment.label_url!)}
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <Download className="mr-1 h-4 w-4" />
                              Download
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Failed Labels */}
        {failedLabels.length > 0 && (
          <Card className="p-6 mt-8 border-red-200">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Failed Labels</h2>
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

      {/* Print Preview Modal */}
      {results.batchResult && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          labelUrl=""
          trackingCode={null}
          batchResult={{
            batchId: results.batchResult.batchId,
            consolidatedLabelUrls: results.batchResult.consolidatedLabelUrls,
            scanFormUrl: results.batchResult.scanFormUrl || ''
          }}
          isBatchPreview={true}
        />
      )}
    </div>
  );
};

export default BatchLabelCreationPage;
