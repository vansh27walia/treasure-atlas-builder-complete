import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Trash2, FileText } from 'lucide-react';
import { BulkShipment, CustomsInfo } from '@/types/shipping';
import RateDisplay from './RateDisplay';
import InsuranceOptions from './InsuranceOptions';
import AIRatePicker from './AIRatePicker';
import CustomsDocumentationModal from '../CustomsDocumentationModal';
import { displayWeightInPounds, parseWeightInput } from '@/utils/weightConversion';

// Local CustomsInfo interface to match the modal's expectations
interface LocalCustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type?: string;
  restriction_comments?: string;
  customs_items: {
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number?: string;
    origin_country: string;
  }[];
  eel_pfc?: string;
}

interface EditableShipmentRowProps {
  shipment: BulkShipment;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  pickupAddress?: any;
}

const EditableShipmentRow: React.FC<EditableShipmentRowProps> = ({
  shipment,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  pickupAddress
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCustomsModal, setShowCustomsModal] = useState(false);
  const [editData, setEditData] = useState({
    customer_name: shipment.customer_name || shipment.recipient,
    weight: shipment.details?.parcel?.weight || 1,
    length: shipment.details?.parcel?.length || 1,
    width: shipment.details?.parcel?.width || 1,
    height: shipment.details?.parcel?.height || 1,
    declared_value: shipment.details?.declared_value || 200
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    // Apply the changes to the shipment
    const updates = {
      customer_name: editData.customer_name,
      recipient: editData.customer_name,
      details: {
        ...shipment.details,
        parcel: {
          ...shipment.details.parcel,
          weight: parseWeightInput(editData.weight),
          length: editData.length,
          width: editData.width,
          height: editData.height
        },
        declared_value: editData.declared_value
      }
    };
    
    onEditShipment(shipment.id, updates);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      customer_name: shipment.customer_name || shipment.recipient,
      weight: shipment.details?.parcel?.weight || 1,
      length: shipment.details?.parcel?.length || 1,
      width: shipment.details?.parcel?.width || 1,
      height: shipment.details?.parcel?.height || 1,
      declared_value: shipment.details?.declared_value || 200
    });
    setIsEditing(false);
  };

  // Get street address safely
  const getStreetAddress = () => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).street1 || '';
    }
    if (shipment.details?.to_address?.street1) {
      return shipment.details.to_address.street1;
    }
    return '';
  };

  // Check if this is an international shipment
  const isInternational = () => {
    const pickupCountry = pickupAddress?.country || 'US';
    const dropoffCountry = shipment.details?.to_address?.country || 'US';
    return pickupCountry !== dropoffCountry;
  };

  // Handle customs documentation submission
  const handleCustomsSubmit = (customsInfo: LocalCustomsInfo) => {
    console.log('Saving customs info for shipment:', shipment.id, customsInfo);
    
    // Convert to the format expected by the shipment details with proper type mapping
    const convertedCustomsInfo: CustomsInfo = {
      contents_type: customsInfo.contents_type as CustomsInfo['contents_type'],
      customs_certify: customsInfo.customs_certify,
      customs_signer: customsInfo.customs_signer,
      non_delivery_option: customsInfo.non_delivery_option as CustomsInfo['non_delivery_option'],
      restriction_type: (customsInfo.restriction_type as CustomsInfo['restriction_type']) || 'none',
      eel_pfc: customsInfo.eel_pfc,
      customs_items: customsInfo.customs_items || []
    };
    
    // Update the shipment with customs information
    onEditShipment(shipment.id, {
      details: {
        ...shipment.details,
        customs_info: convertedCustomsInfo
      }
    });
    
    setShowCustomsModal(false);
  };

  // Check if customs info is saved
  const hasCustomsInfo = shipment.details?.customs_info && 
    shipment.details.customs_info.customs_items && 
    shipment.details.customs_info.customs_items.length > 0;

  return (
    <>
      <TableRow>
        <TableCell>
          {isEditing ? (
            <Input
              value={editData.customer_name}
              onChange={(e) => setEditData(prev => ({ ...prev, customer_name: e.target.value }))}
              className="w-full"
            />
          ) : (
            <div>
              <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
              <div className="text-sm text-gray-500">{getStreetAddress()}</div>
              {isInternational() && hasCustomsInfo && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 mt-1">
                  ✅ Custom Info Saved
                </Badge>
              )}
            </div>
          )}
        </TableCell>
        
        <TableCell>
          {isEditing ? (
            <div className="space-y-2">
              <Input
                type="number"
                value={editData.weight}
                onChange={(e) => setEditData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                placeholder="Weight (lb)"
                step="0.1"
              />
              <div className="grid grid-cols-3 gap-1">
                <Input
                  type="number"
                  value={editData.length}
                  onChange={(e) => setEditData(prev => ({ ...prev, length: Number(e.target.value) }))}
                  placeholder="L"
                  step="0.1"
                />
                <Input
                  type="number"
                  value={editData.width}
                  onChange={(e) => setEditData(prev => ({ ...prev, width: Number(e.target.value) }))}
                  placeholder="W"
                  step="0.1"
                />
                <Input
                  type="number"
                  value={editData.height}
                  onChange={(e) => setEditData(prev => ({ ...prev, height: Number(e.target.value) }))}
                  placeholder="H"
                  step="0.1"
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium">{displayWeightInPounds(shipment.details?.parcel?.weight || 1)}</div>
              <div className="text-sm text-gray-500">
                {shipment.details?.parcel?.length || 1}" × {shipment.details?.parcel?.width || 1}" × {shipment.details?.parcel?.height || 1}"
              </div>
            </div>
          )}
        </TableCell>
        
        <TableCell>
          {shipment.availableRates && shipment.availableRates.length > 0 ? (
            <div className="space-y-2">
              {shipment.selectedRateId ? (
                (() => {
                  const selectedRate = shipment.availableRates.find(r => r.id === shipment.selectedRateId);
                  return selectedRate ? (
                    <RateDisplay
                      actualRate={selectedRate.rate}
                      carrier={selectedRate.carrier}
                      service={selectedRate.service}
                      deliveryDays={selectedRate.delivery_days}
                    />
                  ) : (
                    <Badge variant="outline">No rate selected</Badge>
                  );
                })()
              ) : (
                <Badge variant="outline">No rate selected</Badge>
              )}
            </div>
          ) : (
            <Badge variant="secondary">Loading rates...</Badge>
          )}
        </TableCell>
        
        <TableCell>
          <InsuranceOptions
            shipmentId={shipment.id}
            insuranceEnabled={shipment.details?.insurance_enabled !== false}
            declaredValue={editData.declared_value}
            onInsuranceToggle={(id, enabled) => {
              onEditShipment(id, {
                details: { ...shipment.details, insurance_enabled: enabled }
              });
            }}
            onDeclaredValueChange={(id, value) => {
              setEditData(prev => ({ ...prev, declared_value: value }));
              onEditShipment(id, {
                details: { ...shipment.details, declared_value: value }
              });
            }}
          />
        </TableCell>
        
        <TableCell>
          <div className="flex items-center space-x-2">
            {/* Show Custom Documents button only for international shipments */}
            {isInternational() && (
              <Button
                onClick={() => setShowCustomsModal(true)}
                size="sm"
                variant={hasCustomsInfo ? "default" : "outline"}
                className={hasCustomsInfo ? "bg-green-600 hover:bg-green-700 text-white" : ""}
              >
                <FileText className="h-4 w-4" />
              </Button>
            )}
            
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleCancel}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEdit}
                size="sm"
                variant="outline"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
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

      {/* Customs Documentation Modal */}
      <CustomsDocumentationModal
        isOpen={showCustomsModal}
        onClose={() => setShowCustomsModal(false)}
        onSubmit={handleCustomsSubmit}
        fromCountry={pickupAddress?.country || 'US'}
        toCountry={shipment.details?.to_address?.country || 'US'}
        initialData={shipment.details?.customs_info as any}
      />
    </>
  );
};

export default EditableShipmentRow;
