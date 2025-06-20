
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Package, File, FileImage } from 'lucide-react';

interface BulkLabelDownloadOptionsProps {
  batchResult: {
    batchId: string;
    consolidatedLabelUrls: Record<string, string>;
    scanFormUrl: string | null;
  };
  onDownloadBatch: (format: string, url: string) => void;
  onDownloadManifest: (url: string) => void;
}

const BulkLabelDownloadOptions: React.FC<BulkLabelDownloadOptionsProps> = ({
  batchResult,
  onDownloadBatch,
  onDownloadManifest
}) => {
  const { consolidatedLabelUrls, scanFormUrl } = batchResult;

  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-green-800 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Batch Downloads Available
          </h3>
          <Badge className="bg-green-100 text-green-800">
            Ready for Download
          </Badge>
        </div>

        <p className="text-green-700 text-sm">
          Your consolidated batch labels and pickup manifest are ready for download in multiple formats.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consolidated Labels Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-green-800 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Consolidated Labels
            </h4>
            <div className="space-y-2">
              {consolidatedLabelUrls.png && (
                <Button
                  onClick={() => onDownloadBatch('png', consolidatedLabelUrls.png)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-green-300 text-green-700 hover:bg-green-50"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Download PNG Batch
                </Button>
              )}
              
              {consolidatedLabelUrls.pdf && (
                <Button
                  onClick={() => onDownloadBatch('pdf', consolidatedLabelUrls.pdf)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <File className="h-4 w-4 mr-2" />
                  Download PDF Batch
                </Button>
              )}
              
              {consolidatedLabelUrls.zpl && (
                <Button
                  onClick={() => onDownloadBatch('zpl', consolidatedLabelUrls.zpl)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download ZPL Batch
                </Button>
              )}
              
              {consolidatedLabelUrls.epl && (
                <Button
                  onClick={() => onDownloadBatch('epl', consolidatedLabelUrls.epl)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download EPL Batch
                </Button>
              )}
            </div>
          </div>

          {/* Pickup Manifest Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-green-800 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Pickup Manifest
            </h4>
            <div className="space-y-2">
              {scanFormUrl ? (
                <Button
                  onClick={() => onDownloadManifest(scanFormUrl)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Pickup Manifest (PDF)
                </Button>
              ) : (
                <div className="text-sm text-gray-500 italic p-2 border border-gray-200 rounded">
                  Pickup manifest not available
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
          <p className="text-xs text-green-600">
            <strong>Note:</strong> Consolidated labels contain all your shipments in a single file. 
            The pickup manifest should be given to your carrier for pickup scheduling.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default BulkLabelDownloadOptions;
