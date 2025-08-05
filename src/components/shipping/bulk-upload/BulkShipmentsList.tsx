
import React, { useState } from 'react';
import { BulkShipment, CustomsInfo } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Globe } from 'lucide-react';
import CustomsDocumentationModal from '@/components/shipping/CustomsDocumentationModal';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  pickupCountry: string;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  pickupCountry
}) => {
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [selectedShipmentForCustoms, setSelectedShipmentForCustoms] = useState<BulkShipment | null>(null);
  const [bulkCustomsMode, setBulkCustomsMode] = useState(false);

  // Check if shipment is international
  const isInternational = (shipment: BulkShipment): boolean => {
    const destinationCountry = shipment.details?.to_address?.country || 'US';
    const pickup = pickupCountry || 'US';
    return pickup.toUpperCase() !== destinationCountry.toUpperCase();
  };

  // Get international shipments
  const internationalShipments = shipments.filter(isInternational);

  // Handle customs documentation for individual shipment
  const handleCustomsClick = (shipment: BulkShipment) => {
    setSelectedShipmentForCustoms(shipment);
    setBulkCustomsMode(false);
    setCustomsModalOpen(true);
  };

  // Handle bulk customs for all international shipments
  const handleBulkCustomsClick = () => {
    setBulkCustomsMode(true);
    setSelectedShipmentForCustoms(internationalShipments[0] || null);
    setCustomsModalOpen(true);
  };

  // Handle customs submission
  const handleCustomsSubmit = (customsData: any) => {
    // Ensure proper typing for contents_type
    const customs: CustomsInfo = {
      ...customsData,
      contents_type: customsData.contents_type as "merchandise" | "documents" | "gift" | "returned_goods" | "sample" | "other"
    };

    if (bulkCustomsMode) {
      // Apply to all international shipments
      internationalShipments.forEach(shipment => {
        onEditShipment(shipment.id, {
          ...shipment,
          customsInfo: customs
        });
      });
    } else if (selectedShipmentForCustoms) {
      // Apply to selected shipment only
      onEditShipment(selectedShipmentForCustoms.id, {
        ...selectedShipmentForCustoms,
        customsInfo: customs
      });
    }
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No shipments uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Customs Controls */}
      {internationalShipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              International Shipments
              <Badge variant="secondary">{internationalShipments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                {internationalShipments.length} shipment{internationalShipments.length !== 1 ? 's' : ''} require customs documentation
              </p>
              <Button
                onClick={handleBulkCustomsClick}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Apply Customs to All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipments List */}
      <div className="space-y-4">
        {shipments.map((shipment, index) => (
          <div key={shipment.id} className="relative">
            <EditableShipmentRow
              shipment={shipment}
              index={index}
              onSelectRate={onSelectRate}
              onRemove={onRemoveShipment}
              onEdit={(shipmentId: string, details: any) => onEditShipment(shipmentId, details)}
              showCustomsButton={isInternational(shipment)}
              onCustomsClick={() => handleCustomsClick(shipment)}
              hasCustomsData={!!shipment.customsInfo}
            />
          </div>
        ))}
      </div>

      {/* Customs Modal */}
      <CustomsDocumentationModal
        isOpen={customsModalOpen}
        onClose={() => {
          setCustomsModalOpen(false);
          setSelectedShipmentForCustoms(null);
        }}
        onSubmit={handleCustomsSubmit}
        fromCountry={pickupCountry || 'US'}
        toCountry={selectedShipmentForCustoms?.details?.to_address?.country || 'US'}
        initialData={selectedShipmentForCustoms?.customsInfo}
      />
    </div>
  );
};

export default BulkShipmentsList;
