
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Package, File, Mail, Printer } from 'lucide-react';

interface BulkLabelDownloadOptionsProps {
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
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
  const hasConsolidatedLabels = batchResult?.consolidatedLabelUrls && 
    Object.keys(batchResult.consolidatedLabelUrls).some(key => batchResult.consolidatedLabelUrls[key as keyof typeof batchResult.consolidatedLabelUrls]);

  const hasIndividualLabels = processedLabels && processedLabels.length > 0;

  return (
    <div className="space-y-6">
      {/* Consolidated Batch Labels Section - Only 3 main actions */}
      {hasConsolidatedLabels && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-800 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Consolidated Labels
              </h3>
              <Badge className="bg-green-100 text-green-800">
                Ready for Download
              </Badge>
            </div>

            <p className="text-green-700 text-sm">
              Your consolidated batch labels are ready. Choose from the main options below.
            </p>

            {/* Main 3 Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Consolidated PDF Download */}
              {batchResult.consolidatedLabelUrls.pdf && (
                <Button
                  onClick={() => onDownloadBatch('pdf', batchResult.consolidatedLabelUrls.pdf!)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center h-16"
                  size="lg"
                >
                  <File className="mr-2 h-5 w-5" />
                  <div className="text-center">
                    <div className="font-semibold">Download PDF</div>
                    <div className="text-xs opacity-90">All Labels</div>
                  </div>
                </Button>
              )}

              {/* 2. Print Preview */}
              <Button
                onClick={onPrintPreview}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center h-16"
                size="lg"
              >
                <Printer className="mr-2 h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Print Preview</div>
                  <div className="text-xs opacity-90">Multiple Formats</div>
                </div>
              </Button>

              {/* 3. Email Labels */}
              <Button
                onClick={onEmailLabels}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center h-16"
                size="lg"
              >
                <Mail className="mr-2 h-5 w-5" />
                <div className="text-center">
                  <div className="font-semibold">Email Labels</div>
                  <div className="text-xs opacity-90">Send via Email</div>
                </div>
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
                  Download Pickup Manifest (PDF)
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
              Download individual labels for each shipment.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {processedLabels.map((label, index) => (
                <div key={label.id || index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{label.customer_name || `Shipment ${index + 1}`}</p>
                    <p className="text-xs text-gray-600">{label.tracking_code}</p>
                  </div>
                  <div className="flex gap-1">
                    {label.label_urls?.pdf && (
                      <Button
                        onClick={() => onDownloadIndividual(label.label_urls.pdf, 'pdf')}
                        variant="outline"
                        size="sm"
                        className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        PDF
                      </Button>
                    )}
                    {label.label_urls?.png && (
                      <Button
                        onClick={() => onDownloadIndividual(label.label_urls.png, 'png')}
                        variant="outline"
                        size="sm"
                        className="text-xs border-green-300 text-green-700 hover:bg-green-50"
                      >
                        PNG
                      </Button>
                    )}
                    {label.label_urls?.zpl && (
                      <Button
                        onClick={() => onDownloadIndividual(label.label_urls.zpl, 'zpl')}
                        variant="outline"
                        size="sm"
                        className="text-xs border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        ZPL
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
