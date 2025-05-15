
import React from 'react';
import { BulkShipment } from '@/types/shipping';
import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuccessfulShipmentsTableProps {
  shipments: BulkShipment[];
  onDownloadSingleLabel: (labelUrl: string) => void;
  onViewLabel?: (shipment: BulkShipment) => void;
}

const SuccessfulShipmentsTable: React.FC<SuccessfulShipmentsTableProps> = ({ 
  shipments, 
  onDownloadSingleLabel,
  onViewLabel 
}) => {
  if (!shipments.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
            <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td className="py-2 px-3 text-sm">{shipment.details.name}</td>
              <td className="py-2 px-3 text-sm">
                {shipment.details.street1}, {shipment.details.city}, {shipment.details.state} {shipment.details.zip}
              </td>
              <td className="py-2 px-3 text-sm">{shipment.carrier}</td>
              <td className="py-2 px-3 text-sm">{shipment.service}</td>
              <td className="py-2 px-3 text-sm">${shipment.rate?.toFixed(2)}</td>
              <td className="py-2 px-3 text-sm">
                {shipment.tracking_code ? (
                  <span className="text-blue-600 font-medium">{shipment.tracking_code}</span>
                ) : (
                  <span className="text-gray-500">Not available</span>
                )}
              </td>
              <td className="py-2 px-3 text-sm">
                {shipment.label_url ? (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onDownloadSingleLabel(shipment.label_url || '')}
                    >
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    
                    {onViewLabel && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onViewLabel(shipment)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">Not generated</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SuccessfulShipmentsTable;
