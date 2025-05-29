
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
import PrintPreview from '../PrintPreview';

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
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zip'>('pdf');
  
  if (shipments.length === 0) return null;

  const handleDownload = async (shipment: BulkShipment, format: string = 'pdf') => {
    if (!shipment.label_url) {
      toast.error('No label URL available for this shipment');
      return;
    }

    try {
      console.log(`Downloading ${format.toUpperCase()} label for shipment:`, shipment.id);
      
      // Create a download link with proper filename
      const link = document.createElement('a');
      link.href = shipment.label_url;
      link.download = `shipping_label_${shipment.tracking_code || shipment.id}.${format}`;
      link.target = '_blank';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} label download started`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} label`);
    }
  };
  
  const handleBulkDownload = async (format: 'pdf' | 'png' | 'zip' = 'pdf') => {
    setSelectedFormat(format);
    
    if (format === 'zip') {
      // For ZIP download, we'll download all labels and package them
      toast.loading('Preparing ZIP archive...');
      
      try {
        const validShipments = shipments.filter(s => s.label_url);
        
        if (validShipments.length === 0) {
          toast.error('No valid labels to download');
          return;
        }

        // Download each label individually for now
        // In a real implementation, you'd create a ZIP on the backend
        for (let i = 0; i < validShipments.length; i++) {
          const shipment = validShipments[i];
          setTimeout(() => {
            handleDownload(shipment, 'pdf');
          }, i * 500); // Stagger downloads to avoid browser blocking
        }
        
        toast.dismiss();
        toast.success(`Downloaded ${validShipments.length} labels`);
        
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to create ZIP archive');
      }
      return;
    }
    
    // For PDF/PNG bulk download
    const validShipments = shipments.filter(s => s.label_url);
    
    if (validShipments.length === 0) {
      toast.error('No valid labels to download');
      return;
    }

    toast.loading(`Preparing ${format.toUpperCase()} downloads...`);
    
    try {
      // Download each label with staggered timing
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
        <h5 className="font-medium text-green-800">Successfully Processed Shipments</h5>
        
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
            <DropdownMenuItem onClick={() => handleBulkDownload('png')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-green-600" /> PNG Format
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
                      <PrintPreview
                        labelUrl={shipment.label_url}
                        trackingCode={shipment.tracking_code || shipment.trackingCode}
                        shipmentId={shipment.easypost_id}
                        shipmentDetails={{
                          fromAddress: `${shipment.details?.from_name || 'Sender'}\n${shipment.details?.from_street1 || ''}\n${shipment.details?.from_city || ''}, ${shipment.details?.from_state || ''} ${shipment.details?.from_zip || ''}`,
                          toAddress: `${shipment.customer_name || shipment.recipient}\n${shipment.customer_address || ''}`,
                          weight: `${shipment.details?.weight || 0} oz`,
                          dimensions: `${shipment.details?.length || 0}" x ${shipment.details?.width || 0}" x ${shipment.details?.height || 0}"`,
                          service: shipment.service,
                          carrier: shipment.carrier
                        }}
                      />
                    )}
                    
                    {/* Download Dropdown */}
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
                        <DropdownMenuItem onClick={() => handleDownload(shipment, 'pdf')}>
                          <File className="h-4 w-4 text-blue-600 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(shipment, 'png')}>
                          <File className="h-4 w-4 text-green-600 mr-2" /> Download PNG
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SuccessfulShipmentsTable;
