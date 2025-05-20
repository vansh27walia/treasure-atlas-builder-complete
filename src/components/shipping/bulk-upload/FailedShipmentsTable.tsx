
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FailedShipment {
  row: number;
  error: string;
  details: string;
}

interface FailedShipmentsTableProps {
  shipments: FailedShipment[];
}

const FailedShipmentsTable: React.FC<FailedShipmentsTableProps> = ({
  shipments
}) => {
  if (shipments.length === 0) return null;
  
  return (
    <div className="p-4 border-t border-green-100">
      <h5 className="font-medium text-red-800 mb-3">Failed Shipments</h5>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Row</TableHead>
              <TableHead>Error Type</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment, index) => (
              <TableRow key={index}>
                <TableCell>{shipment.row}</TableCell>
                <TableCell>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {shipment.error}
                  </span>
                </TableCell>
                <TableCell>{shipment.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FailedShipmentsTable;
