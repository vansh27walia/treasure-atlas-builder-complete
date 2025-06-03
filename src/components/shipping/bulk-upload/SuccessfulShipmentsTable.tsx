
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, File, FileArchive, ChevronDown } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/sonner';

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onDownloadAllLabels?: (format?: string) => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({
  shipments,
  onDownloadSingleLabel,
  onDownloadAllLabels
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zip'>('png');
  
  if (shipments.length === 0) return null;
  
  const handleDownload = (labelUrl: string, format: string = 'png') => {
    if (!labelUrl) {
      toast.error('Label not available for download');
      return;
    }
    
    console.log('Downloading label:', labelUrl, 'as format:', format);
    
    // Direct download from stored URL
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `shipping_label.${format}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onDownloadSingleLabel(labelUrl, format);
    toast.success(`Downloaded ${format.toUpperCase()} label`);
  };
  
  const handleBulkDownload = (format: 'pdf' | 'png' | 'zip' = 'png') => {
    setSelectedFormat(format);
    
    if (onDownloadAllLabels) {
      onDownloadAllLabels(format);
      toast.success(`Downloading bulk ${format.toUpperCase()} labels`);
    } else {
      // Download each label individually
      const labelsWithUrls = shipments.filter(shipment => shipment.label_url);
      
      if (labelsWithUrls.length === 0) {
        toast.error('No labels available for download');
        return;
      }
      
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownload(shipment.label_url || '', format);
        }, index * 500);
      });
      
      toast.success(`Downloading ${labelsWithUrls.length} individual ${format.toUpperCase()} labels`);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-green-800">Successfully Created Labels ({shipments.length})</h5>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 border-green-200 hover:bg-green-50">
              <Download className="h-4 w-4" /> 
              Download All Labels
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkDownload('png')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-green-600" /> PNG Format
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkDownload('pdf')} className="flex items-center gap-2">
              <File className="h-4 w-4 text-blue-600" /> PDF Format
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
                <TableCell>
                  {shipment.recipient || shipment.details?.to_name || 'Unknown'}
                </TableCell>
                <TableCell>{shipment.carrier}</TableCell>
                <TableCell>{shipment.tracking_code || shipment.trackingCode}</TableCell>
                <TableCell>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-green-100 text-green-800">
                    Label Ready
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'png')}>
                        <File className="h-4 w-4 text-green-600 mr-2" /> Download PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'pdf')}>
                        <File className="h-4 w-4 text-blue-600 mr-2" /> Download PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
