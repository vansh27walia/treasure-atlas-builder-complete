
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from 'lucide-react';

interface ProcessedShipment {
  id: string;
  tracking_code: string;
  label_url: string;
  status: string;
  row: number;
  recipient: string;
  carrier: string;
}

interface SuccessfulShipmentsTableProps {
  shipments: ProcessedShipment[];
  onDownloadSingleLabel: (labelUrl: string) => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({
  shipments,
  onDownloadSingleLabel
}) => {
  if (shipments.length === 0) return null;
  
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
                <TableCell>{shipment.tracking_code}</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Label Generated
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onDownloadSingleLabel(shipment.label_url)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
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
