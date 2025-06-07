import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye, Printer, Package } from 'lucide-react';
// CHANGED: It is highly recommended to update your 'BulkShipment' type definition
// to match the structure returned by your backend API.
/*
  // In your '@/types/shipping' file, the type should look like this:
  export interface BulkShipment {
    shipment_id: string | number;
    status: string; // e.g., 'success_individual_png_saved', 'error_buy'
    recipient_name: string;
    tracking_number?: string;
    label_urls: {
      png: string | null;
      pdf?: string | null;
      zpl?: string | null;
    };
    carrier?: string;
    service?: string;
    error?: string;
    // Note: The original 'row' property is not returned from the backend.
    // 'shipment_id' is used as the primary identifier instead.
  }
*/
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
  // These props were in the original code but not used internally; their implementation is assumed to be in the parent component.
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

  if (!shipments || shipments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>No shipments to display</p>
      </div>
    );
  }

  // Filter shipments with labels for bulk actions
  // CHANGED: Updated logic to check for nested label URL property.
  const shipmentsWithLabels = shipments.filter(s => {
    const hasLabel = !!(s.label_urls?.png && s.label_urls.png.trim() !== '');
    return hasLabel;
  });

  const downloadFile = async (url: string, filename: string) => {
    try {
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

  const handlePrintPreview = (shipment: BulkShipment) => {
    // CHANGED: Check for nested label URL.
    if (!shipment.label_urls?.png) {
      toast.error('No label available for preview');
      return;
    }
    setSelectedShipment(shipment);
    setPrintPreviewOpen(true);
  };

  const handlePrintLabel = () => {
    // CHANGED: Access nested label URL.
    if (selectedShipment?.label_urls?.png) {
      window.open(selectedShipment.label_urls.png, '_blank');
      setPrintPreviewOpen(false);
    }
  };

  const handleDownloadLabel = async () => {
    // CHANGED: Access nested label URL and new tracking number property.
    if (selectedShipment?.label_urls?.png) {
      const trackingCode = selectedShipment.tracking_number;
      await downloadFile(selectedShipment.label_urls.png, `shipping_label_${trackingCode || Date.now()}.png`);
      setPrintPreviewOpen(false);
    }
  };

  const handleDownload = async (shipment: BulkShipment, format: string = 'png') => {
    // CHANGED: Check for nested label URL.
    if (!shipment.label_urls?.png) {
      toast.error('No label URL available for this shipment');
      return;
    }

    try {
      console.log(`Downloading ${format.toUpperCase()} label for shipment:`, shipment.shipment_id);
      // CHANGED: Use the new tracking number property for the filename.
      const trackingCode = shipment.tracking_number;
      const filename = `shipping_label_${trackingCode || Date.now()}.${format}`;
      // CHANGED: Use nested label URL.
      await downloadFile(shipment.label_urls.png, filename);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };

  const handleBulkDownload = async (format: 'png' | 'zip' = 'png') => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No valid labels to download');
      return;
    }

    toast.loading(`Preparing ${format.toUpperCase()} downloads...`);

    try {
      for (let i = 0; i < shipmentsWithLabels.length; i++) {
        const shipment = shipmentsWithLabels[i];
        setTimeout(async () => {
          await handleDownload(shipment, format === 'zip' ? 'png' : format);
        }, i * 500);
      }

      toast.dismiss();
      toast.success(`Started ${shipmentsWithLabels.length} ${format.toUpperCase()} downloads`);

    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to download ${format.toUpperCase()} labels`);
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
              {/* CHANGED: Label changed from "Row" to "Shipment ID" for clarity */}
              <TableHead>Shipment ID</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              // CHANGED: Updated all property access to match the backend response.
              const hasLabel = !!(shipment.label_urls?.png && shipment.label_urls.png.trim() !== '');
              const trackingNumber = shipment.tracking_number || 'N/A';
              const recipientName = shipment.recipient_name || 'Unknown';
              // NOTE: The backend response does not include the recipient's address. Displaying a placeholder.
              const recipientAddress = 'Not provided in API response';
              const carrier = shipment.carrier || 'N/A';
              const service = shipment.service || '';

              return (
                // CHANGED: Use `shipment_id` for the key.
                <TableRow key={shipment.shipment_id}>
                  {/* CHANGED: Display `shipment_id` instead of `row`. */}
                  <TableCell className="font-medium">{shipment.shipment_id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{recipientName}</div>
                    {/* Note: `customer_company` is not in the backend response, so this will not render. Kept for graceful compatibility. */}
                    {shipment.customer_company && (
                      <div className="text-sm text-gray-500">{shipment.customer_company}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {recipientAddress}
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
                    {/* CHANGED: Updated status logic to work with new status strings from the backend. */}
                    {shipment.status?.startsWith('success') ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Label Ready
                      </span>
                    ) : shipment.status?.startsWith('error') ? (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded" title={shipment.error || 'An error occurred'}>
                        Failed
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Processed
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
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => handleDownload(shipment, 'png')}
                            className="flex items-center gap-1 h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Download className="h-3 w-3" />
                            Download PNG
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            // CHANGED: Access nested label URL.
                            onClick={() => window.open(shipment.label_urls.png, '_blank')}
                            className="flex items-center gap-1 h-8 px-2 text-xs"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          {/* CHANGED: Updated status check for more descriptive text. */}
                          {shipment.status?.startsWith('error') ? 'Label creation failed' : 'No label available'}
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
                    {/* CHANGED: Updated property access for modal details */}
                    <p className="text-sm text-gray-600">
                      <strong>Tracking:</strong> {selectedShipment.tracking_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Carrier:</strong> {selectedShipment.carrier} - {selectedShipment.service}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>To:</strong> {selectedShipment.recipient_name}
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

                {/* CHANGED: Use nested label URL for iframe source */}
                {selectedShipment.label_urls?.png && (
                  <div className="flex-1 min-h-0">
                    <iframe
                      src={selectedShipment.label_urls.png}
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