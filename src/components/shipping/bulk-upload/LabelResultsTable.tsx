
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';

interface LabelResultsTableProps {
  shipments: BulkShipment[];
  onDownloadLabel: (labelUrl: string) => void;
  onPreviewLabel?: (labelUrl: string, trackingCode: string | null) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({
  shipments,
  onDownloadLabel,
  onPreviewLabel
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Generated Labels</h3>
        <p className="text-sm text-gray-600">
          {shipments.length} labels created successfully
        </p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Tracking Code</TableHead>
            <TableHead>Carrier</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shipments.map((shipment) => (
            <TableRow key={shipment.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
                  <div className="text-sm text-gray-500">
                    {typeof shipment.customer_address === 'string' 
                      ? shipment.customer_address 
                      : shipment.customer_address?.street1 || 'No address'
                    }
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  {shipment.tracking_code || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{shipment.carrier}</span>
                </div>
              </TableCell>
              <TableCell>{shipment.service}</TableCell>
              <TableCell>${shipment.rate?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>
                <Badge variant={shipment.status === 'success' ? 'default' : 'destructive'}>
                  {shipment.status === 'success' ? 'Completed' : 'Failed'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {onPreviewLabel && shipment.label_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPreviewLabel(shipment.label_url!, shipment.tracking_code)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  )}
                  {shipment.label_url && (
                    <Button
                      size="sm"
                      onClick={() => onDownloadLabel(shipment.label_url!)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LabelResultsTable;
