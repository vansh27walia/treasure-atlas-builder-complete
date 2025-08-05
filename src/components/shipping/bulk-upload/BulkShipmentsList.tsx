
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, FileText, Globe } from 'lucide-react';
import { BulkShipment, CustomsInfo as ShippingCustomsInfo } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipment: BulkShipment) => void;
  onRefreshRates: (shipmentId: string) => void;
  pickupAddress?: any;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  pickupAddress
}) => {
  const [editingShipment, setEditingShipment] = useState<string | null>(null);
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [selectedShipmentForCustoms, setSelectedShipmentForCustoms] = useState<string | null>(null);

  // Check if shipment is international
  const isInternational = (shipment: BulkShipment) => {
    const fromCountry = pickupAddress?.country || 'US';
    const toCountry = shipment.details?.to_address?.country || 'US';
    return fromCountry !== toCountry;
  };

  const handleCustomsClick = (shipmentId: string) => {
    setSelectedShipmentForCustoms(shipmentId);
    setCustomsModalOpen(true);
  };

  const handleCustomsSubmit = (customs: any) => {
    if (selectedShipmentForCustoms) {
      const shipment = shipments.find(s => s.id === selectedShipmentForCustoms);
      if (shipment) {
        const customsInfo: ShippingCustomsInfo = {
          ...customs,
          contents_type: (customs.contents_type || 'merchandise') as 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other'
        };
        
        const updatedShipment = {
          ...shipment,
          customs_info: customsInfo,
          is_international: true,
          details: {
            ...shipment.details,
            customs_info: customsInfo
          }
        };
        onEditShipment(updatedShipment);
      }
    }
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  const handleApplyCustomsToAll = () => {
    const firstInternationalShipment = shipments.find(s => isInternational(s) && s.customs_info);
    if (!firstInternationalShipment?.customs_info) return;

    const customsData: ShippingCustomsInfo = {
      ...firstInternationalShipment.customs_info,
      contents_type: (firstInternationalShipment.customs_info.contents_type || 'merchandise') as 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other'
    };
    
    shipments.forEach(shipment => {
      if (isInternational(shipment)) {
        const updatedShipment = {
          ...shipment,
          customs_info: customsData,
          is_international: true,
          details: {
            ...shipment.details,
            customs_info: customsData
          }
        };
        onEditShipment(updatedShipment);
      }
    });
  };

  if (!shipments.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No shipments to display</p>
        </CardContent>
      </Card>
    );
  }

  const hasInternationalShipments = shipments.some(s => isInternational(s));

  return (
    <div className="space-y-4">
      {hasInternationalShipments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              International Shipping Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              International shipments detected. You can set customs information individually or apply the same customs data to all international shipments.
            </p>
            <Button
              onClick={handleApplyCustomsToAll}
              variant="outline"
              className="w-full"
              disabled={!shipments.some(s => isInternational(s) && s.customs_info)}
            >
              Apply Same Customs Info to All International Shipments
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shipments ({shipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipments.map((shipment) => (
              <div key={shipment.id}>
                {editingShipment === shipment.id ? (
                  <EditableShipmentRow
                    shipment={shipment}
                    onSaveShipment={(updates) => {
                      onEditShipment({ ...shipment, ...updates });
                      setEditingShipment(null);
                    }}
                    onCancel={() => setEditingShipment(null)}
                  />
                ) : (
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{shipment.recipient || shipment.customer_name}</h4>
                        <p className="text-sm text-gray-600">{shipment.customer_address}</p>
                        {isInternational(shipment) && (
                          <Badge variant="secondary" className="mt-1">
                            <Globe className="w-3 h-3 mr-1" />
                            International
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {isInternational(shipment) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCustomsClick(shipment.id)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            {shipment.customs_info ? 'Edit Clearance' : 'Clearance'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingShipment(shipment.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveShipment(shipment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {shipment.customs_info && (
                      <div className="mb-3 p-2 bg-blue-50 rounded border">
                        <p className="text-xs font-medium text-blue-800">Customs Information Set</p>
                        <p className="text-xs text-blue-600">
                          Contents: {shipment.customs_info.contents_type} | 
                          Items: {shipment.customs_info.customs_items?.length || 0} | 
                          Signer: {shipment.customs_info.customs_signer}
                        </p>
                      </div>
                    )}

                    {shipment.availableRates && shipment.availableRates.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">Available Rates:</h5>
                        {shipment.availableRates.map((rate) => (
                          <div
                            key={rate.id}
                            className={`flex justify-between items-center p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                              shipment.selectedRateId === rate.id ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={() => onSelectRate(shipment.id, rate.id)}
                          >
                            <div>
                              <span className="font-medium">{rate.carrier}</span>
                              <span className="text-sm text-gray-600 ml-2">{rate.service}</span>
                              {rate.delivery_days && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({rate.delivery_days} days)
                                </span>
                              )}
                            </div>
                            <span className="font-bold">${rate.rate}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">
                          {shipment.status === 'pending_rates' ? 'Fetching rates...' : 'No rates available'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CustomsDocumentationModal
        isOpen={customsModalOpen}
        onClose={() => {
          setCustomsModalOpen(false);
          setSelectedShipmentForCustoms(null);
        }}
        onSubmit={handleCustomsSubmit}
        fromCountry={pickupAddress?.country || 'US'}
        toCountry={
          selectedShipmentForCustoms
            ? shipments.find(s => s.id === selectedShipmentForCustoms)?.details?.to_address?.country || 'US'
            : 'US'
        }
        initialData={
          selectedShipmentForCustoms
            ? shipments.find(s => s.id === selectedShipmentForCustoms)?.customs_info
            : undefined
        }
      />
    </div>
  );
};

export default BulkShipmentsList;
