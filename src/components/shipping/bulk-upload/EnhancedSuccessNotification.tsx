
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, Package, Eye, AlertCircle } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import { bulkStorageService, DownloadableLabel } from '@/services/BulkStorageService';
import { toast } from '@/components/ui/sonner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedSuccessNotificationProps {
  results: BulkUploadResult;
  batchId?: string;
}

const EnhancedSuccessNotification: React.FC<EnhancedSuccessNotificationProps> = ({
  results,
  batchId
}) => {
  const [downloadableLabels, setDownloadableLabels] = useState<Record<string, DownloadableLabel[]>>({});
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [labelsError, setLabelsError] = useState<string | null>(null);

  useEffect(() => {
    if (batchId) {
      loadDownloadableLabels();
    } else {
      console.log('No batch ID provided for downloadable labels');
    }
  }, [batchId]);

  const loadDownloadableLabels = async () => {
    if (!batchId) {
      console.log('Cannot load downloadable labels: no batch ID');
      return;
    }
    
    setIsLoadingLabels(true);
    setLabelsError(null);
    
    try {
      console.log(`Loading downloadable labels for batch: ${batchId}`);
      const labels = await bulkStorageService.getDownloadableLabels(batchId);
      console.log('Loaded downloadable labels:', labels);
      setDownloadableLabels(labels);
      
      const totalLabels = Object.values(labels).reduce((total, labelArray) => total + labelArray.length, 0);
      if (totalLabels === 0) {
        setLabelsError('No downloadable labels found. Labels may still be processing.');
      }
    } catch (error) {
      console.error('Error loading downloadable labels:', error);
      setLabelsError(error instanceof Error ? error.message : 'Failed to load downloadable labels');
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const handleDownloadByFormat = async (format: 'PDF' | 'PNG' | 'ZPL') => {
    if (!batchId) {
      toast.error('No batch ID available for download');
      return;
    }

    try {
      toast.loading(`Preparing ${format} downloads...`);
      await bulkStorageService.downloadLabelsByFormat(batchId, format);
      toast.dismiss();
      toast.success(`Started ${format} downloads`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to download ${format} labels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadAll = async () => {
    if (!batchId) {
      toast.error('No batch ID available for download');
      return;
    }

    try {
      toast.loading('Preparing all label downloads...');
      await bulkStorageService.downloadAllLabels(batchId);
      toast.dismiss();
      toast.success('Started all label downloads');
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to download all labels: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadSingle = async (label: DownloadableLabel) => {
    try {
      const link = document.createElement('a');
      link.href = label.url;
      link.download = label.fileName;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${label.format} label`);
    } catch (error) {
      toast.error(`Failed to download ${label.format} label`);
    }
  };

  const hasLabels = results.processedShipments.some(shipment => shipment.label_url);
  const totalLabels = Object.values(downloadableLabels).reduce((total, labels) => total + labels.length, 0);

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            Enhanced Bulk Labels Generated Successfully!
          </h3>
          <p className="text-green-700">
            {results.successful} shipping labels created with multiple format options.
          </p>
          {batchId && (
            <p className="text-sm text-green-600 mt-1">
              Batch ID: {batchId}
            </p>
          )}
        </div>
      </div>

      {results.failed > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {results.failed} shipments failed to process. Please check the error details below.
          </p>
        </div>
      )}

      {labelsError && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {labelsError}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{results.successful}</div>
          <div className="text-sm text-gray-600">Successful Shipments</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">${results.totalCost.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Shipping Cost</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{totalLabels}</div>
          <div className="text-sm text-gray-600">
            {isLoadingLabels ? 'Loading...' : 'Labels Generated'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-sm text-gray-600">Formats Available</div>
          <div className="flex gap-1 mt-1">
            <Badge variant="secondary" className="text-xs">PDF</Badge>
            <Badge variant="secondary" className="text-xs">PNG</Badge>
            <Badge variant="secondary" className="text-xs">ZPL</Badge>
          </div>
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoadingLabels || totalLabels === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Labels
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleDownloadByFormat('PDF')}>
              <FileText className="mr-2 h-4 w-4 text-red-600" />
              Download All PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadByFormat('PNG')}>
              <FileText className="mr-2 h-4 w-4 text-blue-600" />
              Download All PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownloadByFormat('ZPL')}>
              <FileText className="mr-2 h-4 w-4 text-purple-600" />
              Download All ZPL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDownloadAll}>
              <Package className="mr-2 h-4 w-4 text-green-600" />
              Download All Formats
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="outline" 
          onClick={() => window.print()}
          className="border-green-200 hover:bg-green-50"
        >
          <FileText className="mr-2 h-4 w-4" />
          Print Summary
        </Button>

        <Button 
          variant="outline"
          onClick={loadDownloadableLabels}
          disabled={isLoadingLabels || !batchId}
          className="border-green-200 hover:bg-green-50"
        >
          <Eye className="mr-2 h-4 w-4" />
          {isLoadingLabels ? 'Refreshing...' : 'Refresh Labels'}
        </Button>
      </div>

      {/* Individual Label Downloads */}
      {hasLabels && Object.keys(downloadableLabels).length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-green-800 mb-3">Individual Label Downloads</h4>
          <div className="bg-white rounded-lg border border-green-200 p-4 max-h-64 overflow-y-auto">
            {Object.entries(downloadableLabels).map(([trackingCode, labels]) => (
              <div key={trackingCode} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0">
                <div className="font-medium text-sm text-gray-700 mb-2">
                  Tracking: {trackingCode}
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadSingle(label)}
                      className="text-xs"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      {label.format}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Batch ID: {batchId || 'Not set'}</p>
          <p>Has Labels: {hasLabels ? 'Yes' : 'No'}</p>
          <p>Total Downloadable Labels: {totalLabels}</p>
          <p>Is Loading: {isLoadingLabels ? 'Yes' : 'No'}</p>
          <p>Labels Error: {labelsError || 'None'}</p>
        </div>
      )}

      {/* Failed Shipments */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="font-medium text-red-700">Row {failed.row}:</span>
                <span className="text-red-600 ml-2">{failed.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedSuccessNotification;
