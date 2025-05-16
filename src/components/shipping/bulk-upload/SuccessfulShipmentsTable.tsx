
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer, ChevronDown } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string) => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({
  shipments,
  onDownloadSingleLabel
}) => {
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  
  if (shipments.length === 0) return null;
  
  const handlePrintLabel = (labelUrl: string) => {
    const printWindow = window.open(labelUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };

  return (
    <div className="p-4">
      <h5 className="font-medium text-green-800 mb-3">Successfully Processed Shipments</h5>
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
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Label Generated
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span>Actions</span>
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => onDownloadSingleLabel(shipment.label_url || '')}
                        className="cursor-pointer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        <span>Download PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handlePrintLabel(shipment.label_url || '')}
                        className="cursor-pointer"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        <span>Print Label</span>
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
