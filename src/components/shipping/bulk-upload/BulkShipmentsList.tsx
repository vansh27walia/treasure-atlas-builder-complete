
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Edit, Download, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { BulkShipment, Rate } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import InsuranceOptions from './InsuranceOptions';
import CustomsClearanceButton from './CustomsClearanceButton';
import { displayWeightInPounds } from '@/utils/weightConversion';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates?: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onDownloadSingleLabel: (shipment: BulkShipment) => void;
  onEmailLabels: (shipments: BulkShipment[]) => void;
  onRefreshRates?: (shipmentId: string) => Promise<void>;
  onAIAnalysis?: (shipment?: any) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onDownloadSingleLabel,
  onEmailLabels,
  onRefreshRates,
  onAIAnalysis
}) => {
  const handleCustomsUpdate = (shipmentId: string, customsInfo: any) => {
    onEditShipment(shipmentId, {
      details: {
        ...shipments.find(s => s.id === shipmentId)?.details,
        customs_info: customsInfo
      }
    });
  };

  const handleRateSelect = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
  };

  if (!shipments || shipments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          No shipments to display
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Package Details</TableHead>
            <TableHead>Shipping Rate</TableHead>
            <TableHead>Insurance</TableHead>
            <TableHead>Custom Clearance</TableHead>
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
                      : (shipment.customer_address as any)?.street1 || shipment.details?.to_address?.street1 || ''
                    }
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <div className="font-medium">{displayWeightInPounds(shipment.details?.parcel?.weight || 1)}</div>
                  <div className="text-sm text-gray-500">
                    {shipment.details?.parcel?.length || 1}" × {shipment.details?.parcel?.width || 1}" × {shipment.details?.parcel?.height || 1}"
                  </div>
                </div>
              </TableCell>

              <TableCell>
                {shipment.availableRates && shipment.availableRates.length > 0 ? (
                  <div className="space-y-2">
                    {shipment.selectedRateId ? (
                      // Show selected rate
                      (() => {
                        const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                        if (selectedRate) {
                          return (
                            <RateDisplay
                              actualRate={selectedRate.rate}
                              carrier={selectedRate.carrier}
                              service={selectedRate.service}
                              deliveryDays={selectedRate.delivery_days || selectedRate.est_delivery_days}
                            />
                          );
                        }
                        return <span className="text-gray-500">No rate selected</span>;
                      })()
                    ) : (
                      // Show rate selection options
                      <div className="space-y-1">
                        {shipment.availableRates.slice(0, 3).map((rate) => (
                          <Button
                            key={rate.id}
                            onClick={() => handleRateSelect(shipment.id, rate.id)}
                            variant="outline"
                            size="sm"
                            className="w-full justify-between text-xs"
                          >
                            <span>{rate.carrier} {rate.service}</span>
                            <span>${typeof rate.rate === 'string' ? parseFloat(rate.rate).toFixed(2) : rate.rate.toFixed(2)}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">Loading rates...</div>
                )}
              </TableCell>

              <TableCell>
                <InsuranceOptions
                  shipmentId={shipment.id}
                  insuranceEnabled={shipment.details?.insurance_enabled !== false}
                  declaredValue={shipment.details?.declared_value || 200}
                  onInsuranceToggle={(id, enabled) => {
                    onEditShipment(id, {
                      details: { ...shipment.details, insurance_enabled: enabled }
                    });
                  }}
                  onDeclaredValueChange={(id, value) => {
                    onEditShipment(id, {
                      details: { ...shipment.details, declared_value: value }
                    });
                  }}
                />
              </TableCell>

              <TableCell>
                <CustomsClearanceButton
                  shipment={shipment}
                  onCustomsUpdate={handleCustomsUpdate}
                />
              </TableCell>

              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => console.log('Edit shipment:', shipment.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onRemoveShipment(shipment.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BulkShipmentsList;
