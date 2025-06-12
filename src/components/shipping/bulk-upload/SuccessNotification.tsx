
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, Calendar } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Count shipments with labels (stored in Supabase)
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasSupabaseLabel = !!(
      (shipment.label_url && shipment.label_url.includes('supabase')) ||
      (shipment.label_urls?.png && shipment.label_urls.png.includes('supabase')) ||
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

  const downloadSecureFile = async (shipmentId: string, format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    try {
      console.log('Downloading secure file for shipment:', shipmentId, 'format:', format);
      
      if (!shipmentId || shipmentId.trim() === '') {
        toast.error('Invalid shipment ID - cannot download');
        return;
      }

      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to download labels');
        return;
      }

      toast.loading(`Preparing ${format.toUpperCase()} download...`);

      // Make direct download request to the edge function
      const downloadUrl = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/download-label?shipment=${shipmentId}&type=${format}&download=true`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': '*/*'
        }
      });

      console.log('Download response status:', response.status);
      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        toast.error(`Failed to download ${format.toUpperCase()} label: ${response.statusText}`);
        return;
      }

      // Get the file blob and trigger download
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size, 'type:', blob.type);
      
      if (blob.size === 0) {
        toast.error('Downloaded file is empty');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${shipmentId}.${format}`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`${format.toUpperCase()} label downloaded successfully`);
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error(`Failed to download ${format} label: ${error.message}`);
    }
  };

  const handleDownloadAllIndividualLabels = async (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    console.log('Downloading all individual labels, count:', shipmentsWithLabels.length, 'format:', format);
    
    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    toast.loading(`Starting ${format.toUpperCase()} downloads...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      
      try {
        // Add delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, i * 1000)); // 1 second delay
        await downloadSecureFile(shipment.id, format);
        successCount++;
      } catch (error) {
        console.error('Error downloading label for shipment:', shipment.id, error);
        errorCount++;
      }
    }
    
    toast.dismiss();
    
    if (successCount > 0) {
      toast.success(`Downloaded ${successCount} ${format.toUpperCase()} labels successfully`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to download ${errorCount} labels`);
    }
  };

  const handleDownloadBatchPNG = async () => {
    try {
      if (shipmentsWithLabels.length === 0) {
        toast.error('No labels available for batch PNG download');
        return;
      }

      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to download batch PNG');
        return;
      }

      toast.loading('Creating combined batch PNG...');

      const shipmentIds = shipmentsWithLabels.map(s => s.id);
      const batchId = `batch_${Date.now()}`;

      const response = await fetch('https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/combine-batch-png', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId,
          shipmentIds
        })
      });

      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Batch PNG creation failed:', response.status, errorText);
        toast.error('Failed to create batch PNG');
        return;
      }

      // Get the file blob and trigger download
      const blob = await response.blob();
      console.log('Downloaded batch PNG size:', blob.size);
      
      if (blob.size === 0) {
        toast.error('Batch PNG file is empty');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_labels_${batchId}.png`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Batch PNG downloaded successfully');
    } catch (error) {
      console.error('Batch PNG download error:', error);
      toast.dismiss();
      toast.error('Failed to download batch PNG');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not Available';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Not Available';
    }
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
              {hasLabels ? 'Secure Labels Processing Complete!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been securely stored and are ready for download.`
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
            <div className="text-sm text-gray-600">Secure Labels Created</div>
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
            <h4 className="font-semibold text-lg text-blue-800 mb-4">Download Your Secure Labels</h4>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Button 
                  onClick={() => handleDownloadAllIndividualLabels('pdf')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All PDF ({shipmentsWithLabels.length})
                </Button>
                
                <Button 
                  onClick={() => handleDownloadAllIndividualLabels('png')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All PNG ({shipmentsWithLabels.length})
                </Button>
                
                <Button 
                  onClick={() => handleDownloadAllIndividualLabels('zpl')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All ZPL ({shipmentsWithLabels.length})
                </Button>

                <Button 
                  onClick={handleDownloadBatchPNG}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <File className="mr-2 h-4 w-4" />
                  Batch PNG ({shipmentsWithLabels.length})
                </Button>
              </div>
              
              <p className="text-sm text-blue-700">
                🔒 All labels are securely stored in our system and can be downloaded in multiple formats.
              </p>
            </div>
          </div>
        )}

        {/* Create Labels Button */}
        {!hasLabels && displayTotal > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-lg text-yellow-800 mb-3">Create Secure Shipping Labels</h4>
            <p className="text-yellow-700 mb-3">
              Your shipments have been processed. Click below to create and securely store shipping labels.
            </p>
            <Button 
              onClick={onCreateLabels}
              disabled={isCreatingLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isCreatingLabels ? 'Creating Secure Labels...' : 'Create All Labels Securely'}
            </Button>
          </div>
        )}
      </Card>

      {/* Enhanced Table Display for Secure Labels */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(shipmentId: string, format?: string) => {
            const downloadFormat = (format as 'pdf' | 'png' | 'zpl') || 'pdf';
            downloadSecureFile(shipmentId, downloadFormat);
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
