
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye, Printer, Package, MapPin } from 'lucide-react';
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
    return (
      <div className="p-4 text-center text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2" />
        <p>No shipments to display</p>
      </div>
    );
  }

  console.log('SuccessfulShipmentsTable received shipments:', shipments.length, shipments);

  // Separate shipments with and without labels
  const shipmentsWithLabels = shipments.filter(s => s.label_url);
  const shipmentsWithoutLabels = shipments.filter(s => !s.label_url);

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
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
      const trackingCode = selectedShipment.tracking_code || selectedShipment.trackingCode;
      await downloadFile(selectedShipment.label_url, `shipping_label_${trackingCode || Date.now()}.pdf`);
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
      const trackingCode = shipment.tracking_code || shipment.trackingCode;
      const filename = `shipping_label_${trackingCode || Date.now()}.${format}`;
      await downloadFile(shipment.label_url, filename);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };
  
  const handleBulkDownload = async (format: 'pdf' | 'zip' = 'pdf') => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No valid labels to download');
      return;
    }

    toast.loading(`Preparing ${format.toUpperCase()} downloads...`);
    
    try {
      for (let i = 0; i < shipmentsWithLabels.length; i++) {
        const shipment = shipmentsWithLabels[i];
        setTimeout(async () => {
          await handleDownload(shipment, format === 'zip' ? 'pdf' : format);
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
          Processed Shipments ({shipments.length})
          {shipmentsWithLabels.length > 0 && (
            <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
              {shipmentsWithLabels.length} with labels
            </span>
          )}
        </h5>
        
        {shipmentsWithLabels.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-green-200 hover:bg-green-50">
                <Download className="h-4 w-4" /> 
                Download All Labels
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
        )}
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              const hasLabel = !!shipment.label_url;
              const trackingNumber = shipment.tracking_code || shipment.trackingCode;
              const recipientName = shipment.customer_name || shipment.details?.to_name || shipment.recipient || 'Unknown';
              const recipientAddress = shipment.customer_address || 
                (shipment.details ? `${shipment.details.to_city}, ${shipment.details.to_state} ${shipment.details.to_zip}` : 'Address not available');
              
              return (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.row}</TableCell>
                  <TableCell>
                    <div className="font-medium">{recipientName}</div>
                    {shipment.customer_company && (
                      <div className="text-sm text-gray-500">{shipment.customer_company}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-600">{recipientAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center">
                        <Package className="h-3 w-3 mr-1 text-gray-400" />
                        <span>{shipment.details?.weight || 'N/A'} lbs</span>
                      </div>
                      {shipment.details && (
                        <div className="text-xs text-gray-500 mt-1">
                          {shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{shipment.carrier || 'N/A'}</div>
                      {shipment.service && (
                        <div className="text-xs text-gray-500">{shipment.service}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {trackingNumber ? (
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
                        Label Available
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
                            variant="ghost"
                            onClick={() => handlePrintPreview(shipment)}
                            className="flex items-center gap-1 h-8 px-2"
                          >
                            <Eye className="h-3 w-3" />
                            Preview
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDownload(shipment, 'pdf')}
                            className="flex items-center gap-1 h-8 px-2"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>

                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.open(shipment.label_url, '_blank')}
                            className="flex items-center gap-1 h-8 px-2"
                          >
                            <Printer className="h-3 w-3" />
                            Print
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500 px-2 py-1">No label available</span>
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
