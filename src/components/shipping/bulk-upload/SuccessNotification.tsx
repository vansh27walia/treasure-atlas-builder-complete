
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, FileImage } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { toast } from '@/components/ui/sonner';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  onCreateLabels,
  isPaying,
  isCreatingLabels
}) => {
  console.log('SuccessNotification received results:', results);

  // Safely get shipments array
  let allShipments = [];
  if (Array.isArray(results.processedShipments)) {
    allShipments = results.processedShipments;
  } else if (results.processedShipments && typeof results.processedShipments === 'object') {
    const shipmentValues = Object.values(results.processedShipments);
    allShipments = shipmentValues.filter(item => 
      item && 
      typeof item === 'object' && 
      'id' in item
    );
  }
  
  console.log(`SuccessNotification - All shipments: ${allShipments.length}`, allShipments);
  
  // Count shipments with labels (stored in OUR system)
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasOurLabels = !!(
      (shipment.label_url && shipment.label_url.trim() !== '' && !shipment.label_url.includes('easypost.com')) ||
      (shipment.label_urls && typeof shipment.label_urls === 'object' && Object.keys(shipment.label_urls).length > 0) ||
      shipment.status === 'completed'
    );
    return hasOurLabels;
  });

  // Count failed shipments
  const failedShipments = allShipments.filter(shipment => shipment.status === 'failed');
  
  console.log('SuccessNotification Debug:', {
    totalShipments: allShipments.length,
    shipmentsWithLabels: shipmentsWithLabels.length,
    failedShipments: failedShipments.length
  });

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;

  // Show notification if we have shipments or results
  const shouldShowNotification = totalProcessed > 0 || results.total > 0 || results.successful > 0;

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
      if (!url || url.trim() === '') {
        toast.error('Invalid label URL - cannot download');
        return;
      }

      // Security check: ensure we never download from EasyPost
      if (url.includes('easypost.com')) {
        toast.error('EasyPost URLs are blocked. Please regenerate labels.');
        return;
      }

      // Direct download approach
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  const downloadByFormat = async (format: 'png' | 'pdf' | 'zpl') => {
    console.log(`Downloading all ${format.toUpperCase()} labels`);
    
    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    toast.loading(`Starting ${format.toUpperCase()} downloads...`);
    
    let successCount = 0;
    
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      let labelUrl = '';
      
      // Get URL for specific format
      if (shipment.label_urls && typeof shipment.label_urls === 'object') {
        labelUrl = shipment.label_urls[format] || '';
      } else if (format === 'png' && shipment.label_url) {
        labelUrl = shipment.label_url;
      }
      
      if (labelUrl && labelUrl.trim() !== '' && !labelUrl.includes('easypost.com')) {
        try {
          setTimeout(async () => {
            const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode;
            await downloadFile(labelUrl, `label_${trackingCode || `shipment_${i + 1}`}.${format}`);
            successCount++;
          }, i * 500);
        } catch (error) {
          console.error('Error downloading label for shipment:', shipment.id, error);
        }
      }
    }
    
    toast.dismiss();
    setTimeout(() => {
      toast.success(`Started download of ${format.toUpperCase()} labels`);
    }, 1000);
  };

  // Don't show if no data
  if (!shouldShowNotification) {
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              {hasLabels ? 'Labels Created Successfully!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and stored in your system.`
                : `${displayTotal} shipments have been processed and are ready for label creation.`
              }
              {displayFailed > 0 && ` ${displayFailed} shipments failed.`}
            </p>
          </div>
        </div>

        {displayFailed > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> {displayFailed} shipments failed to process. Please check the error details below.
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{displayTotal}</div>
            <div className="text-sm text-gray-600">Total Processed</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{displaySuccessful}</div>
            <div className="text-sm text-gray-600">Labels Created</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{displayFailed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Total Shipping Cost</div>
          </div>
        </div>

        {/* Download Buttons Section */}
        {hasLabels && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-lg text-blue-800 mb-4">Download Your Labels</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => downloadByFormat('png')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <FileImage className="mr-2 h-4 w-4" />
                Download All PNG
              </Button>
              
              <Button 
                onClick={() => downloadByFormat('pdf')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <File className="mr-2 h-4 w-4" />
                Download All PDF
              </Button>
              
              <Button 
                onClick={() => downloadByFormat('zpl')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download All ZPL
              </Button>
            </div>
          </div>
        )}

        {/* Create Labels Button */}
        {!hasLabels && displayTotal > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-lg text-yellow-800 mb-3">Create Shipping Labels</h4>
            <p className="text-yellow-700 mb-3">
              Your shipments have been processed. Click below to create and download shipping labels.
            </p>
            <Button 
              onClick={onCreateLabels}
              disabled={isCreatingLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isCreatingLabels ? 'Creating Labels...' : 'Create All Labels Now'}
            </Button>
          </div>
        )}
      </Card>

      {/* Enhanced Table Display */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url: string, format?: string) => {
            if (url && url.trim() !== '') {
              // Security check: ensure we never download from EasyPost
              if (url.includes('easypost.com')) {
                toast.error('EasyPost URLs are blocked. Please regenerate labels.');
                return;
              }
              
              const timestamp = Date.now();
              const filename = `shipping_label_${timestamp}.${format || 'png'}`;
              downloadFile(url, filename);
            } else {
              toast.error('Invalid label URL - cannot download');
            }
          }}
        />
      )}

      {/* Failed Shipments Details */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments Details</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0 p-2 bg-white rounded border-l-4 border-red-400">
                <span className="font-medium text-red-700">
                  Shipment {failed.row ? `#${failed.row}` : index + 1}:
                </span>
                <span className="text-red-600 ml-2 block text-sm">{failed.details || failed.error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuccessNotification;
