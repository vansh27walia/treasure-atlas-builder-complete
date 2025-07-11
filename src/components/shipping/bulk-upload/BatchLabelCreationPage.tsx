
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Package, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BatchLabelCreationPageProps {
  shipments: any[];
  onBack?: () => void;
  onBatchProcessed?: (result: BulkUploadResult) => void;
}

const BatchLabelCreationPage: React.FC<BatchLabelCreationPageProps> = ({
  shipments,
  onBack,
  onBatchProcessed
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [batchResult, setBatchResult] = useState<BulkUploadResult | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const handleCreateBatchLabels = async () => {
    if (!shipments || shipments.length === 0) {
      toast.error('No shipments available for label creation');
      return;
    }

    setIsCreating(true);

    try {
      console.log('Creating batch labels...');
      
      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: shipments,
          labelOptions: {
            generateBatch: true,
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Error creating batch labels:', error);
        throw new Error(error.message || 'Failed to create batch labels');
      }

      if (data && data.success) {
        console.log('Batch labels created successfully:', data);
        setBatchResult(data);
        toast.success(`Successfully created ${data.successful} labels out of ${data.total}`);
        
        if (onBatchProcessed) {
          onBatchProcessed(data);
        }
      } else {
        throw new Error('No data returned from batch label creation');
      }

    } catch (error) {
      console.error('Failed to create batch labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create batch labels');
    } finally {
      setIsCreating(false);
    }
  };

  const downloadLabels = (format: 'pdf' | 'png') => {
    if (batchResult?.bulk_label_pdf_url) {
      window.open(batchResult.bulk_label_pdf_url, '_blank');
    } else {
      toast.error(`${format.toUpperCase()} download not available`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Batch Label Creation</h1>
            <p className="text-gray-600">{shipments.length} shipments ready for processing</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold">Ready to Create Labels</h2>
              <p className="text-gray-600">Process {shipments.length} shipping labels</p>
            </div>
          </div>
        </div>

        {!batchResult && !isCreating && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Batch Summary</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• {shipments.length} shipping labels will be created</p>
                <p>• Labels will be generated in PDF format</p>
                <p>• All labels will be consolidated into a single download</p>
              </div>
            </div>
            
            <Button
              onClick={handleCreateBatchLabels}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Package className="mr-2 h-5 w-5" />
              Create All Labels
            </Button>
          </div>
        )}

        {isCreating && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Creating Labels...</h3>
            <p className="text-gray-600">Processing {shipments.length} labels. This may take a few moments.</p>
          </div>
        )}

        {batchResult && (
          <div className="space-y-4">
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircle className="mr-2 h-6 w-6" />
              <span className="text-lg font-semibold">Batch Creation Complete!</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{batchResult.successful}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{batchResult.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{batchResult.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => downloadLabels('pdf')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={() => setShowPrintPreview(true)}
                variant="outline"
                className="flex-1"
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Preview
              </Button>
            </div>

            {batchResult.failedShipments && batchResult.failedShipments.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-600 mb-2">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  <span className="font-medium">Some labels failed to create</span>
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  {batchResult.failedShipments.map((failure, index) => (
                    <div key={index}>• Row {failure.row}: {failure.error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Print Preview Modal */}
      {showPrintPreview && batchResult && (
        <PrintPreview
          show={showPrintPreview}
          onHide={() => setShowPrintPreview(false)}
          labelUrl={batchResult.bulk_label_pdf_url || ''}
          shipmentData={shipments[0]}
        />
      )}
    </div>
  );
};

export default BatchLabelCreationPage;
