import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye, Printer, Package } from 'lucide-react';
import { BulkShipment } from '@/types/shipping'; // Assuming this type is updated as per previous recommendation
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

  // --- DEBUGGING: Log the received data to inspect its structure ---
  // This will help you see exactly what data the component is receiving.
  console.log('SuccessfulShipmentsTable received shipments prop:', shipments);

  if (!shipments || shipments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>No shipments to display</p>
      </div>
    );
  }
  
  // FIX: Make filtering more robust against malformed data.
  const shipmentsWithLabels = shipments.filter(s => 
    s && typeof s.label_urls?.png === 'string' && s.label_urls.png.trim() !== ''
  );

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
    // FIX: Use robust check for the label URL.
    if (typeof shipment.label_urls?.png !== 'string' || !shipment.label_urls.png) {
      toast.error('No label available for preview');
      return;
    }
    setSelectedShipment(shipment);
    setPrintPreviewOpen(true);
  };

  const handlePrintLabel = () => {
    // FIX: Use optional chaining to prevent crash.
    const url = selectedShipment?.label_urls?.png;
    if (url) {
      window.open(url, '_blank');
      setPrintPreviewOpen(false);
    }
  };

  const handleDownloadLabel = async () => {
    // FIX: Use optional chaining and ensure URL exists.
    const url = selectedShipment?.label_urls?.png;
    if (url) {
      const trackingCode = selectedShipment.tracking_number;
      await downloadFile(url, `shipping_label_${trackingCode || Date.now()}.png`);
      setPrintPreviewOpen(false);
    }
  };

  const handleDownload = async (shipment: BulkShipment, format: string = 'png') => {
    // FIX: Ensure URL is a non-empty string before proceeding. This is a key fix.
    const url = shipment.label_urls?.png;
    if (typeof url !== 'string' || !url) {
      toast.error('No label URL available for this shipment');
      return;
    }

    try {
      const trackingCode = shipment.tracking_number;
      const filename = `shipping_label_${trackingCode || Date.now()}.${format}`;
      await downloadFile(url, filename);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };
  
  // The bulk download handler uses handleDownload, which is now safe.
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
      {/* ... The header section with the title and dropdown remains the same ... */}
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
                <Download className="h-4 w-4" /> Download Options <ChevronDown className="h-4 w-4" />
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
              <TableHead>Address</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* FIX: Add a check to ensure shipment object exists before mapping */}
            {shipments.map((shipment, index) => {
              if (!shipment) {
                // If a null/undefined entry exists in the array, skip it.
                return null; 
              }

              const hasLabel = typeof shipment.label_urls?.png === 'string' && shipment.label_urls.png.trim() !== '';
              const trackingNumber = shipment.tracking_number || 'N/A';
              const recipientName = shipment.recipient_name || 'Unknown';
              const recipientAddress = 'Not provided in API response';
              const carrier = shipment.carrier || 'N/A';
              const service = shipment.service || 'N/A';

              return (
                <TableRow key={shipment.shipment_id || `shipment-${index}`}>
                  <TableCell className="font-medium">{shipment.shipment_id || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="font-medium">{recipientName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">{recipientAddress}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{carrier}</div>
                      {service && service !== 'N/A' && <div className="text-xs text-gray-500">{service}</div>}
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
                    {/* FIX: Safely access status using optional chaining */}
                    {shipment.status?.startsWith('success') ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Label Ready</span>
                    ) : shipment.status?.startsWith('error') ? (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded" title={shipment.error || 'An error occurred'}>Failed</span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Processed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hasLabel ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handlePrintPreview(shipment)} className="flex items-center gap-1 h-8 px-2 text-xs">
                            <Eye className="h-3 w-3" /> Preview
                          </Button>
                          <Button size="sm" onClick={() => handleDownload(shipment, 'png')} className="flex items-center gap-1 h-8 px-2 text-xs bg-green-600 hover:bg-green-700 text-white">
                            <Download className="h-3 w-3" /> Download
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(shipment.label_urls?.png, '_blank')} className="flex items-center gap-1 h-8 px-2 text-xs">
                            <Printer className="h-3 w-3" /> Print
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 px-2 py-1">
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
                    <p className="text-sm text-gray-600"><strong>Tracking:</strong> {selectedShipment.tracking_number || 'N/A'}</p>
                    <p className="text-sm text-gray-600"><strong>Carrier:</strong> {selectedShipment.carrier || 'N/A'} - {selectedShipment.service || 'N/A'}</p>
                    <p className="text-sm text-gray-600"><strong>To:</strong> {selectedShipment.recipient_name || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePrintLabel} variant="outline"><Printer className="h-4 w-4 mr-2" /> Print Label</Button>
                    <Button onClick={handleDownloadLabel}><Download className="h-4 w-4 mr-2" /> Download PNG</Button>
                  </div>
                </div>
                {/* FIX: Use optional chaining for the iframe src to prevent crash */}
                {selectedShipment.label_urls?.png && (
                  <div className="flex-1 min-h-0">
                    <iframe src={selectedShipment.label_urls.png} className="w-full h-[600px] border rounded" title="Shipping Label Preview" />
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