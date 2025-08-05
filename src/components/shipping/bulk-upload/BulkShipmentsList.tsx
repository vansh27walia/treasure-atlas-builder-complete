import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, AlertTriangle, Package, Globe } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import EditableShipmentRow from './EditableShipmentRow';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => Promise<void>;
  onAIAnalysis: (shipment?: any) => void;
  onShipmentUpdate?: (index: number, updates: Partial<BulkShipment>) => void;
  onShipmentSelect?: (index: number, selected: boolean) => void;
  selectedShipments?: number[];
  onBulkAction?: (action: string) => void;
  pickupAddress?: any;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis,
  onShipmentUpdate,
  onShipmentSelect,
  selectedShipments = [],
  onBulkAction,
  pickupAddress
}) => {
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [selectedShipmentIndex, setSelectedShipmentIndex] = useState<number | null>(null);

  // Check if shipment is international
  const isInternational = (shipment: BulkShipment) => {
    const fromCountry = pickupAddress?.country || shipment.details.from_address?.country || 'US';
    const toCountry = shipment.details.to_address?.country;
    
    return fromCountry !== toCountry;
  };

  // Check if customs data exists
  const hasCustomsData = (shipment: BulkShipment) => {
    return shipment.details.customs_info && 
           shipment.details.customs_info.customs_items && 
           shipment.details.customs_info.customs_items.length > 0 &&
           shipment.details.customs_info.customs_signer;
  };

  const handleCustomsClearance = (index: number) => {
    setSelectedShipmentIndex(index);
    setCustomsModalOpen(true);
  };

  const handleCustomsSubmit = (customsInfo: any) => {
    if (selectedShipmentIndex !== null && onShipmentUpdate) {
      // Ensure contents_type has a default value
      const customsInfoWithDefaults = {
        ...customsInfo,
        contents_type: customsInfo.contents_type || 'merchandise'
      };
      
      onShipmentUpdate(selectedShipmentIndex, {
        details: {
          ...shipments[selectedShipmentIndex].details,
          customs_info: customsInfoWithDefaults
        }
      });
      setCustomsModalOpen(false);
      setSelectedShipmentIndex(null);
    }
  };

  const getStatusBadge = (shipment: BulkShipment) => {
    if (shipment.status === 'error') {
      return <Badge variant="destructive">Error</Badge>;
    }
    
    if (isInternational(shipment)) {
      if (hasCustomsData(shipment)) {
        return <Badge className="bg-green-100 text-green-800">Customs ✓</Badge>;
      } else {
        return <Badge variant="secondary">Needs Customs</Badge>;
      }
    }
    
    if (shipment.availableRates && shipment.availableRates.length > 0) {
      return <Badge className="bg-blue-100 text-blue-800">Rates Ready</Badge>;
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const canProceedToLabels = () => {
    return shipments.every(shipment => {
      if (isInternational(shipment)) {
        return hasCustomsData(shipment);
      }
      return shipment.availableRates && shipment.availableRates.length > 0;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Shipments ({shipments.length})</h3>
        {canProceedToLabels() && selectedShipments.length > 0 && (
          <Button 
            onClick={() => onBulkAction?.('ready')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Package className="mr-2 h-4 w-4" />
            Ready for Labels ({selectedShipments.length})
          </Button>
        )}
      </div>

      {shipments.map((shipment, index) => (
        <Card key={shipment.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedShipments.includes(index)}
                onCheckedChange={(checked) => onShipmentSelect?.(index, !!checked)}
                className="mt-1"
              />
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{index + 1}</span>
                  {getStatusBadge(shipment)}
                  {isInternational(shipment) && (
                    <Badge variant="outline" className="text-blue-600">
                      <Globe className="mr-1 h-3 w-3" />
                      International
                    </Badge>
                  )}
                </div>
                
                <EditableShipmentRow
                  shipment={shipment}
                  onUpdate={(updates) => onShipmentUpdate?.(index, updates)}
                />
                
                {shipment.error && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertTriangle className="mr-1 h-4 w-4" />
                    {shipment.error}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {isInternational(shipment) && !hasCustomsData(shipment) && (
                <Button
                  onClick={() => handleCustomsClearance(index)}
                  variant="outline"
                  size="sm"
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Custom Clearance
                </Button>
              )}
              
              {isInternational(shipment) && hasCustomsData(shipment) && (
                <div className="flex items-center text-green-600 text-sm">
                  <Check className="mr-1 h-4 w-4" />
                  Customs Information Saved
                </div>
              )}
              
              {shipment.selectedRateId && shipment.rate && (
                <div className="text-right">
                  <div className="font-semibold">${shipment.rate.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{shipment.carrier} - {shipment.service}</div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Customs Documentation Modal */}
      {selectedShipmentIndex !== null && (
        <CustomsDocumentationModal
          isOpen={customsModalOpen}
          onClose={() => {
            setCustomsModalOpen(false);
            setSelectedShipmentIndex(null);
          }}
          onSubmit={handleCustomsSubmit}
          fromCountry={pickupAddress?.country || shipments[selectedShipmentIndex]?.details.from_address?.country || 'US'}
          toCountry={shipments[selectedShipmentIndex]?.details.to_address?.country || ''}
          initialData={shipments[selectedShipmentIndex]?.details.customs_info}
        />
      )}

      {shipments.some(s => isInternational(s) && !hasCustomsData(s)) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-yellow-800">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span className="font-medium">International Shipments Detected</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Please complete customs clearance for all international shipments before proceeding to label creation.
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkShipmentsList;
