
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
  bulkLabelUrl?: string;
  onDownloadLabel: (labelUrl: string) => void;
  onDownloadBulkLabels: (bulkLabelUrl: string) => void;
}

const BulkLabelsTable: React.FC<BulkLabelsTableProps> = ({
  labels,
  bulkLabelUrl,
  onDownloadLabel,
  onDownloadBulkLabels
}) => {
  console.log('BulkLabelsTable rendered with:', { labels, bulkLabelUrl });

  // Safety check for labels
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

  const handleDownloadSingle = (labelUrl: string, recipientName: string) => {
    console.log('Downloading single label:', { labelUrl, recipientName });
    if (!labelUrl) {
      toast.error('Label not available for download');
      return;
    }
    try {
      onDownloadLabel(labelUrl);
      toast.success(`Downloading label for ${recipientName}`);
    } catch (error) {
      console.error('Error downloading single label:', error);
      toast.error('Failed to download label');
    }
  };

  const handleDownloadBulk = () => {
    console.log('Downloading bulk labels:', bulkLabelUrl);
    if (!bulkLabelUrl) {
      toast.error('Bulk label not available');
      return;
    }
    try {
      onDownloadBulkLabels(bulkLabelUrl);
      toast.success('Downloading bulk labels');
    } catch (error) {
      console.error('Error downloading bulk labels:', error);
      toast.error('Failed to download bulk labels');
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
      toast.success(`Opening tracking for ${trackingNumber}`);
    } catch (error) {
      console.error('Error opening tracking URL:', error);
      toast.error('Failed to open tracking URL');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Bulk Download */}
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
        
        {bulkLabelUrl && (
          <Button
            onClick={handleDownloadBulk}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All Labels
          </Button>
        )}
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
                  Actions
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
                      variant="outline"
                      onClick={() => handleDownloadSingle(label.label_url, label.recipient_name || 'Label')}
                      disabled={!label.label_url}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
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
              All {labels.length} labels have been successfully created and are ready for download.
              Individual tracking numbers are clickable for carrier tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkLabelsTable;
