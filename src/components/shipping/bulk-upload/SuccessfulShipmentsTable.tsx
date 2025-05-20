
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
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
                <TableCell>{shipment.row || '-'}</TableCell>
                <TableCell>{shipment.recipient || shipment.details?.name || shipment.toAddress.name}</TableCell>
                <TableCell>{shipment.carrier || '-'}</TableCell>
                <TableCell>{shipment.tracking_code || shipment.trackingCode || '-'}</TableCell>
                <TableCell>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Label Generated
                  </span>
                </TableCell>
                <TableCell>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onDownloadSingleLabel(shipment.label_url || '')}
                    disabled={!shipment.label_url}
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
