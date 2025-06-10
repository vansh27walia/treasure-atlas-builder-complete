
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File } from 'lucide-react';
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
  
  // Count shipments with Supabase-stored labels
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasSupabaseLabel = !!(
      (shipment.label_urls?.png && shipment.label_urls.png.includes('supabase')) ||
      (shipment.label_urls?.pdf && shipment.label_urls.pdf.includes('supabase')) ||
      (shipment.label_urls?.zpl && shipment.label_urls.zpl.includes('supabase')) ||
      shipment.status === 'completed'
    );
    return hasSupabaseLabel;
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

  const downloadFileFromSupabase = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from Supabase URL:', url);
      
      if (!url || url.trim() === '' || !url.includes('supabase')) {
        toast.error('Invalid Supabase URL - cannot download');
        return;
      }

      // Direct download approach for Supabase URLs
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${filename} from Supabase`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  const handleDownloadAllByFormat = async (format: 'png' | 'pdf' | 'zpl') => {
    console.log(`Downloading all ${format.toUpperCase()} labels from Supabase`);
    
    const shipmentsWithFormat = shipmentsWithLabels.filter(shipment => 
      shipment.label_urls?.[format] && shipment.label_urls[format].includes('supabase')
    );
    
    if (shipmentsWithFormat.length === 0) {
      toast.error(`No ${format.toUpperCase()} labels available for download`);
      return;
    }

    toast.loading(`Starting download of ${shipmentsWithFormat.length} ${format.toUpperCase()} labels...`);
    
    for (let i = 0; i < shipmentsWithFormat.length; i++) {
      const shipment = shipmentsWithFormat[i];
      const labelUrl = shipment.label_urls[format];
      if (labelUrl && labelUrl.includes('supabase')) {
        try {
          setTimeout(async () => {
            const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode;
            await downloadFileFromSupabase(labelUrl, `label_${trackingCode || `shipment_${i + 1}`}.${format}`);
          }, i * 500);
        } catch (error) {
          console.error(`Error downloading ${format} label for shipment:`, shipment.id, error);
        }
      }
    }
    
    toast.dismiss();
    setTimeout(() => {
      toast.success(`Started download of ${shipmentsWithFormat.length} ${format.toUpperCase()} labels from Supabase`);
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
              {hasLabels ? 'Labels Processing Complete!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and stored in Supabase for download.`
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

        {/* Download Buttons Section - All Formats from Supabase */}
        {hasLabels && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-lg text-blue-800 mb-4">Download Your Labels from Supabase</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => handleDownloadAllByFormat('png')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All PNG
              </Button>
              
              <Button 
                onClick={() => handleDownloadAllByFormat('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download All PDF
              </Button>
              
              <Button 
                onClick={() => handleDownloadAllByFormat('zpl')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <File className="mr-2 h-4 w-4" />
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

      {/* Updated Table Display with Supabase URLs */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url: string, format?: string) => {
            if (url && url.trim() !== '' && url.includes('supabase')) {
              const timestamp = Date.now();
              const filename = `shipping_label_${timestamp}.${format || 'png'}`;
              downloadFileFromSupabase(url, filename);
            } else {
              toast.error('Invalid Supabase URL - cannot download');
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
