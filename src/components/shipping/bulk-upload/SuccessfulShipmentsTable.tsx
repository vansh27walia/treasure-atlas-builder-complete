
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye, Printer } from 'lucide-react';
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
  
  if (!shipments || shipments.length === 0) {
    console.log('No shipments to display in SuccessfulShipmentsTable');
    return null;
  }

  console.log('SuccessfulShipmentsTable received shipments:', shipments.length, shipments);

  // Show all shipments, not just ones with labels
  const displayShipments = shipments;

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      // Append to body, click, and remove
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
    if (!shipment.label_url) {
      toast.error('No label available for preview');
      return;
    }
    setSelectedShipment(shipment);
    setPrintPreviewOpen(true);
  };

  const handlePrintLabel = () => {
    if (selectedShipment?.label_url) {
      window.open(selectedShipment.label_url, '_blank');
      setPrintPreviewOpen(false);
    }
  };

  const handleDownloadLabel = async () => {
    if (selectedShipment?.label_url) {
      await downloadFile(selectedShipment.label_url, `shipping_label_${Date.now()}.pdf`);
      setPrintPreviewOpen(false);
    }
  };

  const handleDownload = async (shipment: BulkShipment, format: string = 'pdf') => {
    if (!shipment.label_url) {
      toast.error('No label URL available for this shipment');
      return;
    }

    try {
      console.log(`Downloading ${format.toUpperCase()} label for shipment:`, shipment.id);
      const filename = `shipping_label_${shipment.tracking_code || shipment.trackingCode || Date.now()}.${format}`;
      await downloadFile(shipment.label_url, filename);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };
  
  const handleBulkDownload = async (format: 'pdf' | 'zip' = 'pdf') => {
    const validShipments = displayShipments.filter(s => s.label_url);
    
    if (validShipments.length === 0) {
      toast.error('No valid labels to download');
      return;
    }

    toast.loading(`Preparing ${format.toUpperCase()} downloads...`);
    
    try {
      for (let i = 0; i < validShipments.length; i++) {
        const shipment = validShipments[i];
        setTimeout(async () => {
          await handleDownload(shipment, format === 'zip' ? 'pdf' : format);
        }, i * 500);
      }
      
      toast.dismiss();
      toast.success(`Started ${validShipments.length} ${format.toUpperCase()} downloads`);
      
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to download ${format.toUpperCase()} labels`);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-green-800">Successfully Processed Shipments ({displayShipments.length})</h5>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-green-200 hover:bg-green-50">
              <Download className="h-4 w-4" /> 
              Download All
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkDownload('pdf')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-blue-600" /> PDF Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('zip')} className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-amber-600" /> Multiple Downloads
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayShipments.map((shipment) => {
              const hasLabel = !!shipment.label_url;
              const trackingNumber = shipment.tracking_code || shipment.trackingCode;
              const recipientName = shipment.customer_name || shipment.details?.to_name || shipment.recipient || 'Unknown';
              
              return (
                <TableRow key={shipment.id}>
                  <TableCell>{shipment.row}</TableCell>
                  <TableCell>{recipientName}</TableCell>
                  <TableCell>{shipment.carrier || 'N/A'}</TableCell>
                  <TableCell>
                    {trackingNumber ? (
                      <div className="font-mono text-sm bg-gray-100 p-1 rounded">
                        {trackingNumber}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No tracking</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {hasLabel ? (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Label Generated
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        Processed
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {/* Preview Button */}
                      {hasLabel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePrintPreview(shipment)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                      )}
                      
                      {/* Download Button */}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDownload(shipment, 'pdf')}
                        disabled={!hasLabel}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>

                      {/* Print Button */}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => window.open(shipment.label_url, '_blank')}
                        disabled={!hasLabel}
                        className="flex items-center gap-1"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
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
                      <strong>Tracking:</strong> {selectedShipment.tracking_code || selectedShipment.trackingCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Carrier:</strong> {selectedShipment.carrier} - {selectedShipment.service}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>To:</strong> {selectedShipment.customer_name || selectedShipment.recipient}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePrintLabel} variant="outline">
                      Print Label
                    </Button>
                    <Button onClick={handleDownloadLabel}>
                      Download PDF
                    </Button>
                  </div>
                </div>
                
                {selectedShipment.label_url && (
                  <div className="flex-1 min-h-0">
                    <iframe
                      src={selectedShipment.label_url}
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
