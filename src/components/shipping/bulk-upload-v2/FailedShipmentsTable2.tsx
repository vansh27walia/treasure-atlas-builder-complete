
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle } from 'lucide-react';
import { BulkShipment, BulkShipmentError } from '@/types/shipping';

interface FailedShipmentsTable2Props {
  shipments: BulkShipment[];
  failedShipments: BulkShipmentError[];
}

const FailedShipmentsTable2: React.FC<FailedShipmentsTable2Props> = ({
  shipments,
  failedShipments
}) => {
  if (shipments.length === 0 && failedShipments.length === 0) return null;
  
  return (
    <div className="p-4 bg-white rounded-md border border-gray-200">
      <h5 className="font-medium text-red-800 mb-3">Failed Shipments</h5>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell>{shipment.row}</TableCell>
                <TableCell>{shipment.recipient}</TableCell>
                <TableCell>
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{shipment.error}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {failedShipments.map((shipment, idx) => (
              <TableRow key={`failed-${shipment.row}-${idx}`}>
                <TableCell>{shipment.row}</TableCell>
                <TableCell>Row {shipment.row}</TableCell>
                <TableCell>
                  <div className="flex items-center text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm">{shipment.error}</span>
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

export default FailedShipmentsTable2;
