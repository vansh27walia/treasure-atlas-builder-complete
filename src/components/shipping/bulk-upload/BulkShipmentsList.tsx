
import React, { useState } from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import EditableShipmentRow from './EditableShipmentRow';
import { BulkShipment, CustomsInfo } from '@/types/shipping';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  pickupCountry?: string;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  pickupCountry = 'US'
}) => {
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [selectedShipmentForCustoms, setSelectedShipmentForCustoms] = useState<string | null>(null);

  const handleCustomsToggle = (shipmentId: string, enabled: boolean) => {
    if (!enabled) {
      // Remove customs info if disabled
      const shipment = shipments.find(s => s.id === shipmentId);
      if (shipment) {
        onEditShipment(shipmentId, {
          details: {
            ...shipment.details,
            customs_info: undefined
          }
        });
      }
    }
  };

  const handleCustomsEdit = (shipmentId: string) => {
    setSelectedShipmentForCustoms(shipmentId);
    setCustomsModalOpen(true);
  };

  const handleCustomsSubmit = (customsData: any) => {
    if (selectedShipmentForCustoms) {
      const shipment = shipments.find(s => s.id === selectedShipmentForCustoms);
      if (shipment) {
        // Convert the modal's customs data to our shipping type format
        const customsInfo: CustomsInfo = {
          contents_type: customsData.contents_type || 'merchandise',
          customs_certify: customsData.customs_certify || true,
          customs_signer: customsData.customs_signer || '',
          non_delivery_option: customsData.non_delivery_option || 'return',
          restriction_type: customsData.restriction_type,
          customs_items: customsData.customs_items || [],
          eel_pfc: customsData.eel_pfc
        };
        
        onEditShipment(selectedShipmentForCustoms, {
          details: {
            ...shipment.details,
            customs_info: customsInfo
          }
        });
      }
    }
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  const handleCustomsClose = () => {
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  const selectedShipment = selectedShipmentForCustoms 
    ? shipments.find(s => s.id === selectedShipmentForCustoms)
    : null;

  const getDropoffCountry = (shipment: BulkShipment) => {
    if (shipment.details?.to_address?.country) {
      return shipment.details.to_address.country;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).country || 'US';
    }
    return 'US';
  };

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Package Details</TableHead>
              <TableHead>Selected Rate</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <EditableShipmentRow
                key={shipment.id}
                shipment={shipment}
                onSelectRate={onSelectRate}
                onRemoveShipment={onRemoveShipment}
                onEditShipment={onEditShipment}
                onCustomsToggle={handleCustomsToggle}
                onCustomsEdit={handleCustomsEdit}
                pickupCountry={pickupCountry}
              />
            ))}
          </TableBody>
        </Table>
      </Card>

      {selectedShipment && (
        <CustomsDocumentationModal
          isOpen={customsModalOpen}
          onClose={handleCustomsClose}
          onSubmit={handleCustomsSubmit}
          fromCountry={pickupCountry}
          toCountry={getDropoffCountry(selectedShipment)}
          initialData={selectedShipment.details?.customs_info}
        />
      )}
    </>
  );
};

export default BulkShipmentsList;
