
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FailedShipmentInfo } from '@/types/shipping';

interface FailedShipmentsTableProps {
  shipments: FailedShipmentInfo[];
}

const FailedShipmentsTable: React.FC<FailedShipmentsTableProps> = ({
  shipments
}) => {
  if (shipments.length === 0) return null;
  
  return (
    <div className="mt-6 p-4 border border-red-200 rounded-lg bg-red-50">
      <Alert className="mb-4 border-red-300 bg-red-100">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>{shipments.length} shipments failed to process.</strong> Please review the errors below and fix the data in your file before re-uploading.
        </AlertDescription>
      </Alert>
      
      <div className="flex items-center mb-3">
        <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
        <h5 className="font-medium text-red-800">Failed Shipments Details</h5>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Row #</TableHead>
              <TableHead className="font-semibold">Error Type</TableHead>
              <TableHead className="font-semibold">What's Missing/Wrong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment, index) => (
              <TableRow key={index} className="hover:bg-red-100">
                <TableCell className="font-mono">
                  <span className="bg-red-200 text-red-900 text-xs font-bold px-2 py-1 rounded">
                    Row {shipment.row || 'Unknown'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {shipment.error}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="max-w-md">
                    {shipment.details}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <h6 className="font-medium text-blue-800 mb-2">💡 How to Fix These Errors:</h6>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Missing required data:</strong> Ensure each row has recipient name, complete address, and package dimensions</li>
          <li>• <strong>Invalid dimensions/weight:</strong> Make sure weight, length, width, and height are valid numbers greater than 0</li>
          <li>• <strong>Empty rows:</strong> Remove any completely empty rows from your file</li>
          <li>• <strong>Address format:</strong> Use full state names or 2-letter codes (CA, NY, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default FailedShipmentsTable;
