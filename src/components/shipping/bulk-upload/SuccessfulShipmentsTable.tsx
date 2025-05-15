
import React from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string) => void;
  onPreviewLabel?: (shipmentId: string) => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({ 
  shipments, 
  onDownloadSingleLabel,
  onPreviewLabel
}) => {
  if (shipments.length === 0) return null;

  const completeShipments = shipments.filter(s => s.status === 'completed');
  
  if (completeShipments.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-4 mt-3">
      <div className="px-4 pb-2">
        <h5 className="font-medium text-gray-700 flex items-center">
          <FileText className="h-4 w-4 mr-2 text-gray-500" />
          Successful Shipments ({completeShipments.length})
        </h5>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Recipient</th>
              <th className="px-4 py-2 text-left">Carrier</th>
              <th className="px-4 py-2 text-left">Cost</th>
              <th className="px-4 py-2 text-left">Tracking</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {completeShipments.map((shipment) => (
              <tr key={shipment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{shipment.row}</td>
                <td className="px-4 py-3">
                  {shipment.details.name}
                  {shipment.details.company && <span className="text-gray-500 text-xs block">{shipment.details.company}</span>}
                </td>
                <td className="px-4 py-3">
                  {shipment.carrier} {shipment.service && <span> - {shipment.service}</span>}
                </td>
                <td className="px-4 py-3 font-medium">${shipment.rate?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-3 text-xs text-blue-600 font-mono">
                  {shipment.tracking_code || shipment.trackingCode || 'N/A'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end space-x-2">
                    {shipment.label_url && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onPreviewLabel && onPreviewLabel(shipment.id)}
                          title="Preview Label"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => onDownloadSingleLabel(shipment.label_url!)}
                          title="Download Label"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuccessfulShipmentsTable;
