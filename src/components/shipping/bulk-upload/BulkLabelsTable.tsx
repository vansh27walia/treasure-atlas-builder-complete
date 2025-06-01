
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, Package, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface BulkLabel {
  shipment_id: string;
  recipient_name: string;
  drop_off_address: string;
  tracking_number: string;
  tracking_url: string;
  label_url: string;
  carrier?: string;
  service?: string;
  rate?: number;
}

interface BulkLabelsTableProps {
  labels: BulkLabel[];
  bulkLabelPngUrl?: string | null;
  bulkLabelPdfUrl?: string | null;
}

const BulkLabelsTable: React.FC<BulkLabelsTableProps> = ({
  labels,
  bulkLabelPngUrl,
  bulkLabelPdfUrl
}) => {
  console.log('BulkLabelsTable rendered with:', { labels, bulkLabelPngUrl, bulkLabelPdfUrl });

  if (!labels || !Array.isArray(labels)) {
    console.error('BulkLabelsTable: Invalid labels data:', labels);
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Error: Invalid labels data</p>
      </Card>
    );
  }

  if (labels.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No labels were successfully created.</p>
      </Card>
    );
  }

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file:', { url, filename });
      
      // Create a hidden anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.style.display = 'none';
      
      // Add to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      return false;
    }
  };

  const handleDownloadSingle = async (labelUrl: string, recipientName: string) => {
    console.log('Downloading single PNG label:', { labelUrl, recipientName });
    
    if (!labelUrl) {
      toast.error('Label not available for download');
      return;
    }

    try {
      const filename = `label_${recipientName.replace(/\s+/g, '_')}_${Date.now()}.png`;
      const success = await downloadFile(labelUrl, filename);
      
      if (success) {
        toast.success(`Downloaded PNG label for ${recipientName}`);
      } else {
        toast.error('Failed to download label');
      }
    } catch (error) {
      console.error('Error downloading single label:', error);
      toast.error('Failed to download label');
    }
  };

  const handleDownloadBulkPng = async () => {
    console.log('Downloading bulk PNG labels:', { bulkLabelPngUrl });
    
    if (!bulkLabelPngUrl) {
      toast.error('Bulk PNG label not available');
      return;
    }

    try {
      const filename = `bulk_labels_${Date.now()}.png`;
      const success = await downloadFile(bulkLabelPngUrl, filename);
      
      if (success) {
        toast.success('Downloaded bulk labels as PNG');
      } else {
        toast.error('Failed to download bulk PNG labels');
      }
    } catch (error) {
      console.error('Error downloading bulk PNG labels:', error);
      toast.error('Failed to download bulk PNG labels');
    }
  };

  const handleDownloadBulkPdf = async () => {
    console.log('Downloading bulk PDF labels:', { bulkLabelPdfUrl });
    
    if (!bulkLabelPdfUrl) {
      toast.error('Bulk PDF label not available');
      return;
    }

    try {
      const filename = `bulk_labels_${Date.now()}.pdf`;
      const success = await downloadFile(bulkLabelPdfUrl, filename);
      
      if (success) {
        toast.success('Downloaded bulk labels as PDF');
      } else {
        toast.error('Failed to download bulk PDF labels');
      }
    } catch (error) {
      console.error('Error downloading bulk PDF labels:', error);
      toast.error('Failed to download bulk PDF labels');
    }
  };

  const handleTrackingClick = (trackingUrl: string, trackingNumber: string) => {
    console.log('Opening tracking:', { trackingUrl, trackingNumber });
    
    if (!trackingUrl) {
      toast.error('Tracking URL not available');
      return;
    }

    try {
      window.open(trackingUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening tracking URL:', error);
      toast.error('Failed to open tracking URL');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Bulk Download Options */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="mr-2 h-6 w-6 text-green-600" />
            Bulk Labels Created Successfully
          </h2>
          <p className="text-gray-600 mt-1">
            {labels.length} shipping labels have been generated and are ready for download
          </p>
        </div>
        
        <div className="flex gap-2">
          {bulkLabelPngUrl && (
            <Button
              onClick={handleDownloadBulkPng}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All (PNG)
            </Button>
          )}
          {bulkLabelPdfUrl && (
            <Button
              onClick={handleDownloadBulkPdf}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All (PDF)
            </Button>
          )}
        </div>
      </div>

      {/* Labels Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drop-off Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carrier/Service
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Download PNG
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {labels.map((label, index) => (
                <tr key={label.shipment_id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {label.recipient_name || 'Unknown Recipient'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs">
                      {label.drop_off_address || 'Address not available'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {label.tracking_number && label.tracking_url ? (
                      <button
                        onClick={() => handleTrackingClick(label.tracking_url, label.tracking_number)}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                      >
                        <Truck className="mr-1 h-3 w-3" />
                        {label.tracking_number}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">No tracking</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {label.carrier && (
                        <Badge variant="outline" className="text-xs">
                          {label.carrier}
                        </Badge>
                      )}
                      {label.service && (
                        <span className="text-xs text-gray-500">
                          {label.service}
                        </span>
                      )}
                      {label.rate && (
                        <span className="text-xs text-green-600 font-medium">
                          ${label.rate}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Button
                      size="sm"
                      onClick={() => handleDownloadSingle(label.label_url, label.recipient_name || 'Label')}
                      disabled={!label.label_url}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      PNG
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-green-800">
              Bulk Label Creation Complete
            </h3>
            <p className="text-sm text-green-700 mt-1">
              All {labels.length} labels have been successfully created as PNG files and are ready for download.
              Individual tracking numbers are clickable for carrier tracking. 
              {(bulkLabelPngUrl || bulkLabelPdfUrl) && ' Bulk download options are available above.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkLabelsTable;
