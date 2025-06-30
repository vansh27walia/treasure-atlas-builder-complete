
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Package, Mail, Printer } from 'lucide-react';

interface BulkLabelDownloadOptionsProps {
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
      png?: string;
    };
    scanFormUrl?: string;
  };
  processedLabels: any[];
  onDownloadBatch: (format: string, url: string) => void;
  onDownloadManifest: (url: string) => void;
  onDownloadIndividual: (labelUrl: string, format: string) => void;
  onPrintPreview: () => void;
  onEmailLabels: () => void;
}

const BulkLabelDownloadOptions: React.FC<BulkLabelDownloadOptionsProps> = ({
  batchResult,
  processedLabels,
  onDownloadBatch,
  onDownloadManifest,
  onDownloadIndividual,
  onPrintPreview,
  onEmailLabels
}) => {
  const hasConsolidatedLabels = batchResult?.consolidatedLabelUrls?.pdf;
  const hasIndividualLabels = processedLabels && processedLabels.length > 0;

  console.log('BulkLabelDownloadOptions render:', { batchResult, processedLabels: processedLabels?.length });

  return (
    <div className="space-y-6">
      {/* Consolidated Batch Labels Section */}
      {hasConsolidatedLabels && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Consolidated Batch Labels
              </h3>
              <Badge className="bg-green-100 text-green-800">
                PDF Ready
              </Badge>
            </div>

            <p className="text-green-700 text-sm">
              Your consolidated batch labels are ready. Use Print Preview for different formats and layout options.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => window.open(batchResult.consolidatedLabelUrls.pdf, '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                onClick={onPrintPreview}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Preview
              </Button>
              
              <Button
                onClick={onEmailLabels}
                variant="outline"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Labels
              </Button>
            </div>

            {/* Pickup Manifest */}
            {batchResult.scanFormUrl && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">Pickup Manifest</h4>
                <Button
                  onClick={() => onDownloadManifest(batchResult.scanFormUrl!)}
                  variant="outline"
                  size="sm"
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Pickup Manifest
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Individual Labels Section */}
      {hasIndividualLabels && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Individual Labels
              </h3>
              <Badge className="bg-blue-100 text-blue-800">
                {processedLabels.length} Labels
              </Badge>
            </div>

            <p className="text-blue-700 text-sm">
              Download individual labels for each shipment separately if needed.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {processedLabels.map((label, index) => (
                <div key={label.id || index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{label.customer_name || `Shipment ${index + 1}`}</p>
                    <p className="text-xs text-gray-600">{label.tracking_code}</p>
                  </div>
                  <div className="flex gap-2">
                    {label.label_urls?.pdf && (
                      <Button
                        onClick={() => window.open(label.label_urls.pdf, '_blank')}
                        variant="outline"
                        size="sm"
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    )}
                    {(label.label_url || label.label_urls?.png) && (
                      <Button
                        onClick={() => window.open(label.label_url || label.label_urls.png, '_blank')}
                        variant="outline"
                        size="sm"
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PNG
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {!hasConsolidatedLabels && !hasIndividualLabels && (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No labels available for download yet.</p>
        </Card>
      )}
    </div>
  );
};

export default BulkLabelDownloadOptions;
