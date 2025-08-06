
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Edit, Download, Mail, ExternalLink, AlertCircle } from 'lucide-react';
import { BulkShipment, Rate } from '@/types/shipping';
import BulkRateDisplay from './BulkRateDisplay';
import InsuranceOptions from './InsuranceOptions';
import AIRatePicker from './AIRatePicker';
import CustomsClearanceButton from './CustomsClearanceButton';
import { displayWeightInPounds } from '@/utils/weightConversion';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onDownloadSingleLabel: (shipment: BulkShipment) => void;
  onEmailLabels: (shipments: BulkShipment[]) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onDownloadSingleLabel,
  onEmailLabels
}) => {
  const handleCustomsUpdate = (shipmentId: string, customsInfo: any) => {
    onEditShipment(shipmentId, {
      details: {
        ...shipments.find(s => s.id === shipmentId)?.details,
        customs_info: customsInfo
      }
    });
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
                      : shipment.customer_address?.street1 || ''
                    }
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <div>
                  <div className="font-medium">{displayWeightInPounds(shipment.details?.weight || 1)}</div>
                  <div className="text-sm text-gray-500">
                    {shipment.details?.length || 1}" × {shipment.details?.width || 1}" × {shipment.details?.height || 1}"
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <BulkRateDisplay
                  shipment={shipment}
                  onSelectRate={onSelectRate}
                />
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
