
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
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zip'>('pdf');
  
  if (shipments.length === 0) return null;
  
  const handleDownload = (labelUrl: string, format: string = 'pdf') => {
    if (!labelUrl) {
      toast.error('Label not available for download');
      return;
    }
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = labelUrl;
    link.download = `shipping_label.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onDownloadSingleLabel(labelUrl, format);
    toast.success(`Downloading ${format.toUpperCase()} label`);
  };
  
  const handleBulkDownload = (format: 'pdf' | 'png' | 'zip' = 'pdf') => {
    setSelectedFormat(format);
    
    if (format === 'zip' && onDownloadAllLabels) {
      // Use the bulk download function for ZIP
      onDownloadAllLabels(format);
      toast.success(`Preparing ${format.toUpperCase()} labels for download`);
    } else {
      // Download each label individually for PDF/PNG
      const labelsWithUrls = shipments.filter(shipment => shipment.label_url);
      
      if (labelsWithUrls.length === 0) {
        toast.error('No labels available for download');
        return;
      }
      
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownload(shipment.label_url || '', format);
        }, index * 500); // Stagger downloads to avoid browser blocking
      });
      
      toast.success(`Downloading ${labelsWithUrls.length} ${format.toUpperCase()} labels`);
    }
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h5 className="font-medium text-green-800">Successfully Processed Shipments ({shipments.length})</h5>
        
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
                <TableCell>{shipment.recipient}</TableCell>
                <TableCell>{shipment.carrier}</TableCell>
                <TableCell>{shipment.tracking_code || shipment.trackingCode}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                    shipment.label_url 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {shipment.label_url ? 'Label Ready' : 'Processing'}
                  </span>
                </TableCell>
                <TableCell>
                  {shipment.label_url ? (
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
                        <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'pdf')}>
                          <File className="h-4 w-4 text-blue-600 mr-2" /> Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(shipment.label_url || '', 'png')}>
                          <File className="h-4 w-4 text-green-600 mr-2" /> Download PNG
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-sm text-gray-500">Label pending</span>
                  )}
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
