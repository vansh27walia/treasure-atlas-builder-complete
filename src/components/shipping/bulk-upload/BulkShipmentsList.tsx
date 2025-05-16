import React from 'react';
import { Button } from '@/components/ui/button';
import { BulkShipment, ShippingOption } from '@/types/shipping';
import { CircleCheck, RefreshCw, Edit2, Trash2 } from 'lucide-react';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: BulkShipment) => void;
  onRefreshRates: (shipmentId: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recipient
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Carrier / Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {shipments.map((shipment) => (
            <tr key={shipment.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {shipment.recipient}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {shipment.details.street1}, {shipment.details.city}, {shipment.details.state}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {shipment.availableRates && shipment.availableRates.length > 0 ? (
                  <select
                    value={shipment.selectedRateId || ''}
                    onChange={(e) => onSelectRate(shipment.id, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {shipment.availableRates.map((rate) => (
                      <option key={rate.id} value={rate.id}>
                        {rate.carrier} - {rate.service} (${rate.rate.toFixed(2)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    {shipment.carrier} - {shipment.service}
                  </>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${shipment.rate?.toFixed(2) || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button 
                  variant="ghost"
                  onClick={() => onRefreshRates(shipment.id)}
                  disabled={isFetchingRates}
                >
                  {isFetchingRates ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => onEditShipment(shipment.id, shipment)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => onRemoveShipment(shipment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {shipment.status === 'completed' && shipment.tracking_code && (
                  <a href={`https://example.com/tracking/${shipment.tracking_code}`} target="_blank" rel="noopener noreferrer">
                    <CircleCheck className="h-4 w-4 text-green-500" />
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BulkShipmentsList;
