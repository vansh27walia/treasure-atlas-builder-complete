
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown, Eye, FileText } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';

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
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
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
      onDownloadSingleLabel(selectedShipment.label_url, 'pdf');
      setPrintPreviewOpen(false);
    }
  };

  const handleDownload = async (shipment: BulkShipment, format: string = 'pdf') => {
    // Check if shipment has enhanced label URLs for all formats
    const labelUrls = (shipment as any).label_urls_all_formats;
    let downloadUrl = shipment.label_url;

    if (labelUrls && labelUrls[format]) {
      downloadUrl = labelUrls[format];
    }

    if (!downloadUrl) {
      toast.error(`No ${format.toUpperCase()} label URL available for this shipment`);
      return;
    }

    try {
      console.log(`Downloading ${format.toUpperCase()} label for shipment:`, shipment.id);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `shipping_label_${shipment.tracking_code || shipment.id}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} label download started`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };
  
  const handleBulkDownload = async (format: 'pdf' | 'png' | 'zpl' | 'zip' = 'pdf') => {
    setSelectedFormat(format);
    
    if (format === 'zip') {
      toast.loading('Preparing ZIP archive...');
      
      try {
        const validShipments = shipments.filter(s => s.label_url);
        
        if (validShipments.length === 0) {
          toast.error('No valid labels to download');
          return;
        }

        // Download all available formats for each shipment
        for (let i = 0; i < validShipments.length; i++) {
          const shipment = validShipments[i];
          const labelUrls = (shipment as any).label_urls_all_formats;
          
          if (labelUrls) {
            // Download PDF, PNG, and ZPL if available
            ['pdf', 'png', 'zpl'].forEach((fmt, fmtIndex) => {
              if (labelUrls[fmt]) {
                setTimeout(() => {
                  handleDownload(shipment, fmt);
                }, (i * 3 + fmtIndex) * 300);
              }
            });
          } else {
            // Fallback to main label URL
            setTimeout(() => {
              handleDownload(shipment, 'pdf');
            }, i * 500);
          }
        }
        
        toast.dismiss();
        toast.success(`Downloaded ${validShipments.length} shipments with all available formats`);
        
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to create ZIP archive');
      }
      return;
    }
    
    const validShipments = shipments.filter(s => {
      const labelUrls = (s as any).label_urls_all_formats;
      return s.label_url || (labelUrls && labelUrls[format]);
    });
    
    if (validShipments.length === 0) {
      toast.error(`No valid ${format.toUpperCase()} labels to download`);
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

  const getAvailableFormats = (shipment: BulkShipment): string[] => {
    const labelUrls = (shipment as any).label_urls_all_formats;
    if (!labelUrls) return shipment.label_url ? ['pdf'] : [];
    
    return Object.keys(labelUrls).filter(format => labelUrls[format]);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-green-800">Enhanced Processed Shipments</h5>
        
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
              <FileText className="h-4 w-4 text-red-600" /> PDF Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('png')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-blue-600" /> PNG Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('zpl')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-purple-600" /> ZPL Format
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleBulkDownload('zip')} className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-green-600" /> All Formats
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
              <TableHead>Available Formats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => {
              const availableFormats = getAvailableFormats(shipment);
              
              return (
                <TableRow key={shipment.id}>
                  <TableCell>{shipment.row}</TableCell>
                  <TableCell>{shipment.customer_name || shipment.recipient}</TableCell>
                  <TableCell>{shipment.carrier}</TableCell>
                  <TableCell>{shipment.tracking_code || shipment.trackingCode}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {availableFormats.map(format => (
                        <Badge 
                          key={format} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Enhanced Labels Generated
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
                      
                      {/* Enhanced Download Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {availableFormats.includes('pdf') && (
                            <DropdownMenuItem onClick={() => handleDownload(shipment, 'pdf')}>
                              <FileText className="h-4 w-4 text-red-600 mr-2" /> Download PDF
                            </DropdownMenuItem>
                          )}
                          {availableFormats.includes('png') && (
                            <DropdownMenuItem onClick={() => handleDownload(shipment, 'png')}>
                              <File className="h-4 w-4 text-blue-600 mr-2" /> Download PNG
                            </DropdownMenuItem>
                          )}
                          {availableFormats.includes('zpl') && (
                            <DropdownMenuItem onClick={() => handleDownload(shipment, 'zpl')}>
                              <File className="h-4 w-4 text-purple-600 mr-2" /> Download ZPL
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <DialogTitle>Enhanced Shipping Label Preview</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            {selectedShipment && (
              <>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold">Enhanced Shipment Details</h3>
                    <p className="text-sm text-gray-600">
                      <strong>Tracking:</strong> {selectedShipment.tracking_code || selectedShipment.trackingCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Carrier:</strong> {selectedShipment.carrier} - {selectedShipment.service}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>To:</strong> {selectedShipment.customer_name || selectedShipment.recipient}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {getAvailableFormats(selectedShipment).map(format => (
                        <Badge key={format} variant="secondary" className="text-xs">
                          {format.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
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
                      title="Enhanced Shipping Label Preview"
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
