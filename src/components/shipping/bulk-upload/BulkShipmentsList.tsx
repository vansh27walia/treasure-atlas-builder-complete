
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Trash2, Edit, FileText, AlertCircle } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import EditableShipmentRow from './EditableShipmentRow';
import CustomsDocumentationModal from '../CustomsDocumentationModal';
import { CustomsInfo } from '@/types/shipping';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis: (shipment?: any) => void;
  onCustomsUpdate: (shipmentId: string, customsInfo: CustomsInfo) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis,
  onCustomsUpdate
}) => {
  const [editingShipment, setEditingShipment] = useState<string | null>(null);
  const [customsModalOpen, setCustomsModalOpen] = useState<string | null>(null);

  const handleEditShipment = (shipmentId: string) => {
    setEditingShipment(shipmentId);
  };

  const handleSaveEdit = (shipmentId: string, updatedData: any) => {
    onEditShipment(shipmentId);
    setEditingShipment(null);
  };

  const handleCancelEdit = () => {
    setEditingShipment(null);
  };

  const isInternationalShipment = (shipment: BulkShipment): boolean => {
    const destCountry = shipment.details?.to_address?.country || 'US';
    return destCountry.toUpperCase() !== 'US';
  };

  const handleCustomsSubmit = (shipmentId: string, customsInfo: CustomsInfo) => {
    onCustomsUpdate(shipmentId, customsInfo);
    setCustomsModalOpen(null);
  };

  const getCustomsModalShipment = () => {
    if (!customsModalOpen) return null;
    return shipments.find(s => s.id === customsModalOpen);
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No shipments uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment, index) => (
        <Card key={shipment.id} className="overflow-hidden">
          <CardContent className="p-6">
            {editingShipment === shipment.id ? (
              <EditableShipmentRow
                shipment={shipment}
                onSave={(updatedData) => handleSaveEdit(shipment.id, updatedData)}
                onCancel={handleCancelEdit}
              />
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {shipment.recipient || shipment.customer_name || 'Unknown Recipient'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {shipment.customer_address || `${shipment.details?.to_address?.city}, ${shipment.details?.to_address?.state}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        shipment.status === 'rates_fetched' ? 'default' :
                        shipment.status === 'error' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {shipment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Destination:</span>
                    <p className="text-gray-600">
                      {shipment.details?.to_address?.street1}
                      <br />
                      {shipment.details?.to_address?.city}, {shipment.details?.to_address?.state} {shipment.details?.to_address?.zip}
                      <br />
                      {shipment.details?.to_address?.country}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Package:</span>
                    <p className="text-gray-600">
                      {shipment.details?.parcel?.length}"×{shipment.details?.parcel?.width}"×{shipment.details?.parcel?.height}" 
                      , {shipment.details?.parcel?.weight} lbs
                    </p>
                  </div>
                </div>

                {/* Rates */}
                {shipment.availableRates && shipment.availableRates.length > 0 && (
                  <RateDisplay
                    rates={shipment.availableRates}
                    selectedRateId={shipment.selectedRateId}
                    onSelectRate={(rateId) => onSelectRate(shipment.id, rateId)}
                    isFetching={isFetchingRates}
                  />
                )}

                {/* Error Display */}
                {shipment.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-800 text-sm">{shipment.error}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    {/* Customs Information Button - Only for international shipments with rates */}
                    {isInternationalShipment(shipment) && shipment.availableRates && shipment.availableRates.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCustomsModalOpen(shipment.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Customs Information
                        {shipment.customs_info && <Badge variant="secondary" className="ml-1">✓</Badge>}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditShipment(shipment.id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRefreshRates(shipment.id)}
                      disabled={isFetchingRates}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${isFetchingRates ? 'animate-spin' : ''}`} />
                      Refresh Rates
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveShipment(shipment.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Customs Documentation Modal */}
      {customsModalOpen && (
        <CustomsDocumentationModal
          isOpen={true}
          onClose={() => setCustomsModalOpen(null)}
          onSubmit={(customsInfo) => handleCustomsSubmit(customsModalOpen, customsInfo)}
          fromCountry="US"
          toCountry={getCustomsModalShipment()?.details?.to_address?.country || 'Unknown'}
          initialData={getCustomsModalShipment()?.customs_info}
        />
      )}
    </div>
  );
};

export default BulkShipmentsList;
