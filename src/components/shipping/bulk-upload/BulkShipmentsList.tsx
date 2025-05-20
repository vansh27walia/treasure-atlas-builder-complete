
import React from 'react';
import { BulkShipment, ShippingRate } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, RefreshCw, Trash2, Truck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rate: ShippingRate) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipment: BulkShipment) => void;
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
      <ScrollArea>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Recipient</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Carrier/Service</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <TableRow key={shipment.id}>
                <TableCell className="font-medium">{shipment.recipient}</TableCell>
                <TableCell>
                  {shipment.details.street1}, {shipment.details.city}, {shipment.details.state} {shipment.details.zip}, {shipment.details.country}
                </TableCell>
                <TableCell>
                  {isFetchingRates ? (
                    <div className="flex items-center justify-center">
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Fetching Rates...
                    </div>
                  ) : shipment.availableRates && shipment.availableRates.length > 0 ? (
                    <div className="flex flex-col">
                      {shipment.availableRates.map((rate) => (
                        <Button
                          key={rate.id}
                          variant="outline"
                          className="mb-1 text-sm"
                          onClick={() => onSelectRate(shipment.id, rate)}
                        >
                          {rate.carrier} - {rate.service}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-sm"
                      onClick={() => onRefreshRates(shipment.id)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Rates
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  {shipment.selectedRateId ? (
                    (() => {
                      const selectedRate = shipment.availableRates.find((rate) => rate.id === shipment.selectedRateId);
                      if (selectedRate) {
                        // Fix the toFixed issue by ensuring we have a number before calling toFixed
                        let formattedRate = '0.00';
                        
                        if (typeof selectedRate.rate === 'string') {
                          formattedRate = parseFloat(selectedRate.rate).toFixed(2);
                        } else if (typeof selectedRate.rate === 'number') {
                          formattedRate = selectedRate.rate.toFixed(2);
                        }

                        return `$${formattedRate}`;
                      }
                      return 'N/A';
                    })()
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEditShipment(shipment)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500" onClick={() => onRemoveShipment(shipment.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default BulkShipmentsList;
