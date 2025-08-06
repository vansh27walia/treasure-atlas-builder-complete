
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, RefreshCw, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { BulkShipment, Rate, CustomsInfo } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import RateDisplay from './RateDisplay';
import CustomsButton from './CustomsButton';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis?: (shipment: BulkShipment) => void;
  onCustomsSave?: (shipmentId: string, customsInfo: CustomsInfo) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis,
  onCustomsSave
}) => {
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(null);

  const handleEditClick = (shipmentId: string) => {
    setEditingShipmentId(shipmentId);
  };

  const handleEditSave = (updatedData: any) => {
    if (editingShipmentId) {
      onEditShipment(editingShipmentId, updatedData);
      setEditingShipmentId(null);
    }
  };

  const handleEditCancel = () => {
    setEditingShipmentId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_rates':
        return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Fetching Rates</Badge>;
      case 'rates_fetched':
        return <Badge variant="outline" className="text-xs"><Package className="w-3 h-3 mr-1" />Select Rate</Badge>;
      case 'rate_selected':
        return <Badge variant="default" className="text-xs bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const handleCustomsSave = (shipmentId: string, customsInfo: CustomsInfo) => {
    if (onCustomsSave) {
      onCustomsSave(shipmentId, customsInfo);
    }
  };

  if (shipments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No shipments found</h3>
          <p className="text-gray-600">Upload a CSV file to see your shipments here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment, index) => (
        <Card key={shipment.id} className="border border-gray-200">
          <CardContent className="p-4">
            {editingShipmentId === shipment.id ? (
              <EditableShipmentRow
                shipment={shipment}
                onSave={handleEditSave}
                onCancel={handleEditCancel}
              />
            ) : (
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-semibold text-gray-600">#{index + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        {shipment.recipient || shipment.customer_name || 'Unknown Recipient'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {shipment.customer_address || 
                         `${shipment.details?.to_address?.city}, ${shipment.details?.to_address?.state} ${shipment.details?.to_address?.zip}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(shipment.status)}
                    
                    <CustomsButton
                      shipment={shipment}
                      onCustomsSave={handleCustomsSave}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(shipment.id)}
                      className="h-8 px-2"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRefreshRates(shipment.id)}
                      disabled={isFetchingRates}
                      className="h-8 px-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveShipment(shipment.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Rates Section */}
                {shipment.availableRates && shipment.availableRates.length > 0 && (
                  <RateDisplay
                    rates={shipment.availableRates}
                    selectedRateId={shipment.selectedRateId || ''}
                    onSelectRate={(rateId) => onSelectRate(shipment.id, rateId)}
                    isFetching={isFetchingRates}
                  />
                )}

                {/* Error Display */}
                {shipment.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{shipment.error}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
