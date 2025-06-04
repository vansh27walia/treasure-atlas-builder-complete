
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye } from 'lucide-react';
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
  
  if (shipments.length === 0) return null;

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

  const handleDownloadLabel = () => {
    if (selectedShipment?.label_url) {
      onDownloadSingleLabel(selectedShipment.label_url, 'png');
      setPrintPreviewOpen(false);
    }
  };

  const handleDownload = async (shipment: BulkShipment, format: string = 'png') => {
    if (!shipment.label_url) {
      toast.error('No label URL available for this shipment');
      return;
    }

    try {
      console.log(`Downloading ${format.toUpperCase()} label for shipment:`, shipment.id);
      onDownloadSingleLabel(shipment.label_url, format);
      toast.success(`${format.toUpperCase()} label download started`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };
  
  const handleBulkDownload = async (format: 'png' | 'zip' = 'png') => {
    if (format === 'zip') {
      toast.loading('Preparing ZIP archive...');
      
      try {
        const validShipments = shipments.filter(s => s.label_url);
        
        if (validShipments.length === 0) {
          toast.error('No valid labels to download');
          return;
        }

        for (let i = 0; i < validShipments.length; i++) {
          const shipment = validShipments[i];
          setTimeout(() => {
            handleDownload(shipment, 'png');
          }, i * 500);
        }
        
        toast.dismiss();
        toast.success(`Downloaded ${validShipments.length} labels`);
        
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to create ZIP archive');
      }
      return;
    }
    
    const validShipments = shipments.filter(s => s.label_url);
    
    if (validShipments.length === 0) {
      toast.error('No valid labels to download');
      return;
    }

    toast.loading(`Preparing ${format.toUpperCase()} downloads...`);
    
    try {
      for (let i = 0; i < validShipments.length; i++) {
        const shipment = validShipments[i];
        setTimeout(() => {
          handleDownload(shipment, format);
        }, i * 300);
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
        <h5 className="font-medium text-green-800">Successfully Generated Labels ({shipments.length})</h5>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-green-200 hover:bg-green-50">
              <Download className="h-4 w-4" /> 
              Download All
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkDownload('png')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-blue-600" /> PNG Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('zip')} className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-amber-600" /> ZIP Archive
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
            {shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell>{shipment.row}</TableCell>
                <TableCell>{shipment.customer_name || shipment.recipient}</TableCell>
                <TableCell>{shipment.carrier}</TableCell>
                <TableCell>{shipment.tracking_code || shipment.trackingCode}</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Label Generated
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {/* Print Preview Button */}
                    {shipment.label_url && (
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
                      onClick={() => handleDownload(shipment, 'png')}
                      disabled={!shipment.label_url}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
                      Download PNG
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
