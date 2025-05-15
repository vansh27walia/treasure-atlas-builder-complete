
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader, ArrowRight, X, RefreshCcw, Edit, ShoppingBag } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import EditShipmentDialog from './EditShipmentDialog';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: BulkShipment['details']) => void;
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
  const [editingShipment, setEditingShipment] = useState<BulkShipment | null>(null);
  
  if (shipments.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300" />
        <p className="mt-4 text-gray-500">No shipments found matching your filters</p>
      </div>
    );
  }
  
  const handleEditClick = (shipment: BulkShipment) => {
    setEditingShipment(shipment);
  };
  
  const handleEditSave = (shipmentId: string, details: BulkShipment['details']) => {
    onEditShipment(shipmentId, details);
    setEditingShipment(null);
  };
  
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-0 md:p-0">
          <ScrollArea className="w-full max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Carrier Options</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => {
                  const isProcessing = shipment.status === 'processing';
                  const hasError = shipment.status === 'error';
                  const hasRates = shipment.availableRates && shipment.availableRates.length > 0;
                  
                  // Format address for display
                  const address = `${shipment.details.street1}, ${shipment.details.city}, ${shipment.details.state} ${shipment.details.zip}`;
                  
                  // Package info
                  const packageInfo = shipment.details.parcel_weight
                    ? `${shipment.details.parcel_weight} lbs${shipment.details.parcel_length ? `, ${shipment.details.parcel_length}×${shipment.details.parcel_width}×${shipment.details.parcel_height} in` : ''}`
                    : 'Default package';
                  
                  return (
                    <TableRow key={shipment.id} className={hasError ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono text-xs">{shipment.row}</TableCell>
                      <TableCell>
                        <div className="font-medium">{shipment.details.name}</div>
                        {shipment.details.company && (
                          <div className="text-sm text-gray-500">{shipment.details.company}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{address}</div>
                        <div className="text-xs text-gray-500">{shipment.details.country}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{packageInfo}</div>
                      </TableCell>
                      <TableCell>
                        {isProcessing ? (
                          <div className="flex items-center">
                            <Loader className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Loading rates...</span>
                          </div>
                        ) : hasError ? (
                          <div className="text-red-500 text-sm flex items-center">
                            <X className="h-4 w-4 mr-1" />
                            {shipment.error || 'Failed to load rates'}
                          </div>
                        ) : hasRates ? (
                          <Select 
                            value={shipment.selectedRateId} 
                            onValueChange={(value) => onSelectRate(shipment.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Select a carrier" />
                            </SelectTrigger>
                            <SelectContent>
                              {shipment.availableRates.map((rate) => (
                                <SelectItem key={rate.id} value={rate.id}>
                                  <div className="flex justify-between w-full">
                                    <span>{rate.carrier} - {rate.service}</span>
                                    <span className="font-medium">${parseFloat(rate.rate).toFixed(2)}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">No rates available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipment.selectedRateId && hasRates && (
                          <div className="font-medium">
                            {(() => {
                              const selectedRate = shipment.availableRates?.find(
                                rate => rate.id === shipment.selectedRateId
                              );
                              return selectedRate ? `$${parseFloat(selectedRate.rate).toFixed(2)}` : '-';
                            })()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(shipment)}
                          title="Edit shipment"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRefreshRates(shipment.id)}
                          title="Refresh rates"
                          disabled={isProcessing}
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveShipment(shipment.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Remove shipment"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {editingShipment && (
        <EditShipmentDialog
          shipment={editingShipment}
          open={!!editingShipment}
          onClose={() => setEditingShipment(null)}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
};

export default BulkShipmentsList;
