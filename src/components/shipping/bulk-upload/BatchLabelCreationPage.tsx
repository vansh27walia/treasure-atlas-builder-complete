
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Package, CheckCircle, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  const handleBackToBulkUpload = () => {
    navigate('/bulk-upload');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25">
      {/* Full-screen container */}
      <div className="w-full">
        {/* Header with back button */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleBackToBulkUpload}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Bulk Upload
                </Button>
                <div className="flex items-center space-x-3">
                  <Package className="h-8 w-8 text-emerald-600" />
                  <h1 className="text-3xl font-bold text-gray-900">Labels Generated Successfully!</h1>
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-2">Your shipping labels have been generated and are ready for download and printing.</p>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-lg">
              <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-emerald-700">{successfulLabels.length}</h3>
              <p className="text-emerald-600 font-medium">Labels Created</p>
            </Card>
            
            {failedLabels.length > 0 && (
              <Card className="p-6 text-center bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-lg">
                <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
                <h3 className="text-3xl font-bold text-red-700">{failedLabels.length}</h3>
                <p className="text-red-600 font-medium">Failed Labels</p>
              </Card>
            )}
            
            <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
              <FileText className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="text-3xl font-bold text-blue-700">${results.totalCost?.toFixed(2) || '0.00'}</h3>
              <p className="text-blue-600 font-medium">Total Processing Cost</p>
            </Card>
          </div>

          {/* Consolidated Download Section */}
          {successfulLabels.length > 0 && (
            <Card className="shadow-xl bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-emerald-200">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <FileText className="h-8 w-8 text-emerald-600 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold text-emerald-900">Download All Labels</h2>
                    <p className="text-emerald-700 mt-1">Get all your labels in consolidated files with different formats</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Consolidated PDF */}
                  <Button
                    onClick={() => {
                      const url = generateConsolidatedLabelUrl('pdf');
                      if (url) onDownloadSingleLabel(url);
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-20"
                    size="lg"
                  >
                    <div className="text-center">
                      <Download className="mx-auto h-6 w-6 mb-1" />
                      <div className="font-semibold">PDF Format</div>
                      <div className="text-xs opacity-90">All Labels Combined</div>
                    </div>
                  </Button>

                  {/* Consolidated ZPL */}
                  <Button
                    onClick={() => {
                      const url = generateConsolidatedLabelUrl('zpl');
                      if (url) onDownloadSingleLabel(url);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-20"
                    size="lg"
                  >
                    <div className="text-center">
                      <Download className="mx-auto h-6 w-6 mb-1" />
                      <div className="font-semibold">ZPL Format</div>
                      <div className="text-xs opacity-90">Thermal Printers</div>
                    </div>
                  </Button>

                  {/* Consolidated PNG */}
                  <Button
                    onClick={() => {
                      const url = generateConsolidatedLabelUrl('png');
                      if (url) onDownloadSingleLabel(url);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-20"
                    size="lg"
                  >
                    <div className="text-center">
                      <Download className="mx-auto h-6 w-6 mb-1" />
                      <div className="font-semibold">PNG Images</div>
                      <div className="text-xs opacity-90">Image Files</div>
                    </div>
                  </Button>

                  {/* Consolidated EPL */}
                  <Button
                    onClick={() => {
                      const url = generateConsolidatedLabelUrl('epl');
                      if (url) onDownloadSingleLabel(url);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-20"
                    size="lg"
                  >
                    <div className="text-center">
                      <Download className="mx-auto h-6 w-6 mb-1" />
                      <div className="font-semibold">EPL Format</div>
                      <div className="text-xs opacity-90">Label Printers</div>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Batch Actions */}
          <Card className="shadow-xl bg-white border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Batch Actions</h2>
              <div className="flex flex-wrap gap-4">
                {/* Batch Print Preview */}
                <Button
                  onClick={handleBatchPrintPreview}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-14 px-8"
                  size="lg"
                >
                  <PrinterIcon className="mr-3 h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">Print Preview</div>
                    <div className="text-xs opacity-90">Preview All Labels</div>
                  </div>
                </Button>
              </div>
            </div>
          </Card>

          {/* Individual Labels Table */}
          {successfulLabels.length > 0 && (
            <Card className="shadow-xl bg-white border-gray-200">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Individual Label Details</h2>
                <div className="overflow-x-auto">
                  <div className="bg-gray-50 rounded-lg p-1">
                    <table className="w-full bg-white rounded-lg shadow-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Recipient</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Tracking Number</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Carrier & Service</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Processing Cost</th>
                          <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {successfulLabels.map((shipment, index) => (
                          <tr key={shipment.id || index} className="border-b border-gray-100 hover:bg-blue-25 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <div className="font-medium text-gray-900">{shipment.customer_name || shipment.recipient}</div>
                                <div className="text-sm text-gray-500">
                                  {getStreetAddress(shipment)}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-mono text-sm bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 px-3 py-2 rounded-lg border border-blue-200">
                                {shipment.tracking_code || shipment.tracking_number}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <div className="font-medium text-gray-900">{shipment.carrier}</div>
                                <div className="text-sm text-gray-500">{shipment.service}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-emerald-700">${shipment.rate?.toFixed(2) || '0.00'}</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-2">
                                {shipment.label_url && (
                                  <Button
                                    onClick={() => onDownloadSingleLabel(shipment.label_url!)}
                                    size="sm"
                                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                  >
                                    <Download className="mr-2 h-4 w-4" />
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
                </div>
              </div>
            </Card>
          )}

          {/* Failed Labels */}
          {failedLabels.length > 0 && (
            <Card className="shadow-xl bg-gradient-to-r from-red-25 to-rose-25 border-red-200">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-red-800 mb-6">Failed Label Processing</h2>
                <div className="space-y-4">
                  {failedLabels.map((shipment, index) => (
                    <div key={shipment.id || index} className="p-4 bg-white border border-red-200 rounded-lg shadow-sm">
                      <div className="font-medium text-red-900">
                        {shipment.customer_name || shipment.recipient}
                      </div>
                      <div className="text-sm text-red-700 mt-2 bg-red-50 p-2 rounded">
                        <strong>Error:</strong> {shipment.error || 'Unknown error occurred during processing'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Print Preview Modal */}
      {results.batchResult && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          labelUrl=""
          trackingCode={null}
          batchResult={results.batchResult}
          isBatchPreview={true}
        />
      )}
    </div>
  );
};

export default BatchLabelCreationPage;
