
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye, Printer, Package } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onDownloadAllLabels?: () => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({
  shipments,
  onDownloadSingleLabel,
  onDownloadAllLabels
}) => {
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<BulkShipment | null>(null);

  console.log('SuccessfulShipmentsTable received shipments:', shipments);

  if (!shipments || shipments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>No shipments to display</p>
      </div>
    );
  }

  // Helper function to get label URL (handles both formats)
  const getLabelUrl = (shipment: BulkShipment): string | null => {
    const url = shipment.label_urls?.png || shipment.label_url || null;
    // Validate URL
    if (!url || url.trim() === '' || url === 'undefined' || url === 'null') {
      return null;
    }
    return url;
  };

  // Helper function to get tracking code (handles both formats)
  const getTrackingCode = (shipment: BulkShipment): string => {
    return shipment.tracking_number || shipment.tracking_code || shipment.trackingCode || 'N/A';
  };

  // Helper function to get shipment ID (handles both formats)
  const getShipmentId = (shipment: BulkShipment): string => {
    return shipment.shipment_id || shipment.id;
  };

  // Helper function to get recipient name (handles both formats)
  const getRecipientName = (shipment: BulkShipment): string => {
    return shipment.recipient_name || shipment.recipient || shipment.customer_name || 'Unknown';
  };

  // Helper function to get package dimensions
  const getPackageDimensions = (shipment: BulkShipment): string => {
    const details = shipment.details;
    if (details && details.length && details.width && details.height) {
      return `${details.length}" × ${details.width}" × ${details.height}"`;
    }
    return 'N/A';
  };

  // Helper function to get package weight
  const getPackageWeight = (shipment: BulkShipment): string => {
    const details = shipment.details;
    if (details && details.weight) {
      return `${details.weight} lbs`;
    }
    return 'N/A';
  };

  // Helper function to get full address
  const getFullAddress = (shipment: BulkShipment): string => {
    const details = shipment.details;
    if (details) {
      const addressParts = [
        details.to_street1,
        details.to_street2,
        details.to_city,
        details.to_state,
        details.to_zip,
        details.to_country
      ].filter(Boolean);
      
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
    }
    return shipment.customer_address || 'Address not available';
  };

  // Filter shipments with labels for bulk actions
  const shipmentsWithLabels = shipments.filter(s => {
    const labelUrl = getLabelUrl(s);
    const hasLabel = !!(labelUrl && labelUrl.trim() !== '');
    console.log(`Shipment ${getShipmentId(s)} has label:`, hasLabel, 'URL:', labelUrl);
    return hasLabel;
  });

  console.log('Shipments with labels:', shipmentsWithLabels.length, 'out of', shipments.length);

  const downloadFile = async (url: string, filename: string) => {
    try {
      // Validate URL before attempting download
      if (!url || url.trim() === '') {
        toast.error('Invalid label URL - cannot download');
        return;
      }

      // Check if URL is accessible
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.error('URL not accessible:', fetchError);
        toast.error(`Label file not accessible: ${fetchError.message}`);
        return;
      }

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
      toast.error(`Failed to download ${filename}: ${error.message}`);
    }
  };

  const handlePrintPreview = (shipment: BulkShipment) => {
    const labelUrl = getLabelUrl(shipment);
    if (!labelUrl) {
      toast.error('No label available for preview');
      return;
    }
    setSelectedShipment(shipment);
    setPrintPreviewOpen(true);
  };

  const handlePrintLabel = () => {
    const labelUrl = getLabelUrl(selectedShipment!);
    if (labelUrl) {
      window.open(labelUrl, '_blank');
      setPrintPreviewOpen(false);
    }
  };

  const handleDownloadLabel = async () => {
    const labelUrl = getLabelUrl(selectedShipment!);
    if (labelUrl) {
      const trackingCode = getTrackingCode(selectedShipment!);
      await downloadFile(labelUrl, `shipping_label_${trackingCode || Date.now()}.png`);
      setPrintPreviewOpen(false);
    }
  };

  const handleDownload = async (shipment: BulkShipment, format: string = 'png') => {
    const labelUrl = getLabelUrl(shipment);
    if (!labelUrl) {
      toast.error('No label URL available for this shipment');
      return;
    }

    try {
      console.log(`Downloading ${format.toUpperCase()} label for shipment:`, getShipmentId(shipment));
      const trackingCode = getTrackingCode(shipment);
      const filename = `shipping_label_${trackingCode || Date.now()}.${format}`;
      await downloadFile(labelUrl, filename);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label: ${error.message}`);
    }
  };

  const handleBulkDownload = async (format: 'png' | 'zip' = 'png') => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No valid labels to download');
      return;
    }

    toast.loading(`Preparing ${format.toUpperCase()} downloads...`);

    try {
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < shipmentsWithLabels.length; i++) {
        const shipment = shipmentsWithLabels[i];
        setTimeout(async () => {
          try {
            await handleDownload(shipment, format === 'zip' ? 'png' : format);
            successCount++;
          } catch (error) {
            console.error('Download failed for shipment:', shipment.id, error);
            failCount++;
          }
        }, i * 500);
      }

      toast.dismiss();
      
      setTimeout(() => {
        if (successCount > 0) {
          toast.success(`Started ${successCount} ${format.toUpperCase()} downloads`);
        }
        if (failCount > 0) {
          toast.error(`${failCount} downloads failed`);
        }
      }, 1000);

    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to download ${format.toUpperCase()} labels: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-green-800">
          Individual Shipment Labels ({shipments.length})
          {shipmentsWithLabels.length > 0 && (
            <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
              {shipmentsWithLabels.length} with labels ready
            </span>
          )}
        </h5>

        {shipmentsWithLabels.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-green-200 hover:bg-green-50">
                <Download className="h-4 w-4" />
                Download Options
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkDownload('png')} className="flex items-center gap-2">
                <File className="h-4 w-4 text-green-600" /> PNG Format
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkDownload('zip')} className="flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-amber-600" /> Multiple Downloads
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Shipment ID</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Drop-off Address</TableHead>
              <TableHead>Dimensions (L×W×H)</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              const labelUrl = getLabelUrl(shipment);
              const hasLabel = !!labelUrl;
              const trackingNumber = getTrackingCode(shipment);
              const recipientName = getRecipientName(shipment);
              const fullAddress = getFullAddress(shipment);
              const dimensions = getPackageDimensions(shipment);
              const weight = getPackageWeight(shipment);
              const carrier = shipment.carrier || 'N/A';
              const service = shipment.service || '';
              const shipmentId = getShipmentId(shipment);

              console.log(`Rendering shipment ${shipmentId}:`, {
                hasLabel,
                labelUrl,
                trackingNumber,
                recipientName,
                fullAddress,
                dimensions,
                weight
              });

              return (
                <TableRow key={shipmentId}>
                  <TableCell className="font-medium">{shipmentId}</TableCell>
                  <TableCell>
                    <div className="font-medium">{recipientName}</div>
                    {shipment.customer_company && (
                      <div className="text-sm text-gray-500">{shipment.customer_company}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[200px]">
                      {fullAddress}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      {dimensions}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {weight}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{carrier}</div>
                      {service && (
                        <div className="text-xs text-gray-500">{service}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trackingNumber !== 'N/A' ? (
                      <div className="font-mono text-sm bg-gray-100 p-1 rounded max-w-[150px] break-all">
                        {trackingNumber}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No tracking</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasLabel ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Label Ready
                      </span>
                    ) : shipment.status?.startsWith('error') || shipment.status === 'failed' ? (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded" title={shipment.error || 'An error occurred'}>
                        Failed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Processing
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hasLabel ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePrintPreview(shipment)}
                            className="flex items-center gap-1 h-8 px-2 text-xs"
                            title="Preview label"
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => onDownloadSingleLabel(labelUrl, 'png')}
                            className="flex items-center gap-1 h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                            title="Download PNG label"
                          >
                            <Download className="h-3 w-3" />
                            PNG
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(labelUrl, '_blank')}
                            className="flex items-center gap-1 h-8 px-2 text-xs"
                            title="Print label"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          {shipment.status?.startsWith('error') || shipment.status === 'failed' ? 'Label creation failed' : 'No label available'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Print Preview Modal */}
      <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Shipping Label Preview</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            {selectedShipment && (
              <>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Shipment Details</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Tracking:</strong> {getTrackingCode(selectedShipment)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Carrier:</strong> {selectedShipment.carrier} - {selectedShipment.service}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>To:</strong> {getRecipientName(selectedShipment)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Dimensions:</strong> {getPackageDimensions(selectedShipment)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Weight:</strong> {getPackageWeight(selectedShipment)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePrintLabel} variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Print Label
                    </Button>
                    <Button onClick={handleDownloadLabel}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>
                  </div>
                </div>

                {getLabelUrl(selectedShipment) && (
                  <div className="flex-1 min-h-0">
                    <iframe
                      src={getLabelUrl(selectedShipment)!}
                      className="w-full h-[600px] border rounded"
                      title="Shipping Label Preview"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuccessfulShipmentsTable;
