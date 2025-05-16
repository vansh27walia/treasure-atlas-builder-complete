
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, Printer } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { toast } from 'sonner';

interface SuccessfulShipmentsTable2Props {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string) => void;
}

const SuccessfulShipmentsTable2: React.FC<SuccessfulShipmentsTable2Props> = ({
  shipments,
  onDownloadSingleLabel
}) => {
  if (shipments.length === 0) return null;
  
  const handleLabelDownload = (labelUrl: string) => {
    try {
      if (!labelUrl) {
        toast.error('Label URL is missing. There may have been an issue with the EasyPost API.');
        return;
      }
      
      onDownloadSingleLabel(labelUrl);
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label. Please try again.');
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-md border border-gray-200">
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
                    {shipment.label_url ? 'Label Generated' : 'Ready'}
                  </span>
                </TableCell>
                <TableCell>
                  {shipment.label_url ? (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleLabelDownload(shipment.label_url || '')}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-500">Pending label generation</span>
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

export default SuccessfulShipmentsTable2;
