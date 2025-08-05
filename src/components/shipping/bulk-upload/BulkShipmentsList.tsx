
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, RefreshCw, Sparkles, FileText, Users } from 'lucide-react';
import { BulkShipment, Rate, CustomsInfo } from '@/types/shipping';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: any) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis: (shipment?: any) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis
}) => {
  const [editingShipments, setEditingShipments] = useState<{ [key: string]: boolean }>({});
  const [editData, setEditData] = useState<{ [key: string]: any }>({});
  const [customsModalOpen, setCustomsModalOpen] = useState(false);
  const [selectedShipmentForCustoms, setSelectedShipmentForCustoms] = useState<string | null>(null);
  const [bulkCustomsModalOpen, setBulkCustomsModalOpen] = useState(false);

  // Check if shipment is international (destination country is not US) with null safety
  const isInternationalShipment = (shipment: BulkShipment) => {
    return shipment.details?.to_address?.country !== 'US' || shipment.is_international === true;
  };

  // Count international shipments
  const internationalShipments = shipments.filter(isInternationalShipment);
  const hasInternationalShipments = internationalShipments.length > 0;

  const handleEditToggle = (shipmentId: string) => {
    setEditingShipments(prev => {
      const newState = { ...prev };
      if (newState[shipmentId]) {
        // Save changes
        const data = editData[shipmentId];
        if (data) {
          onEditShipment(shipmentId, data);
        }
        delete newState[shipmentId];
        setEditData(prev => {
          const newData = { ...prev };
          delete newData[shipmentId];
          return newData;
        });
      } else {
        // Start editing
        const shipment = shipments.find(s => s.id === shipmentId);
        if (shipment) {
          newState[shipmentId] = true;
          setEditData(prev => ({
            ...prev,
            [shipmentId]: {
              ...shipment.details
            }
          }));
        }
      }
      return newState;
    });
  };

  const handleCustomsClick = (shipmentId: string) => {
    setSelectedShipmentForCustoms(shipmentId);
    setCustomsModalOpen(true);
  };

  const handleBulkCustomsClick = () => {
    setBulkCustomsModalOpen(true);
  };

  const handleCustomsSubmit = (customsData: CustomsInfo) => {
    if (selectedShipmentForCustoms) {
      // Find the shipment and update it with customs data
      const shipment = shipments.find(s => s.id === selectedShipmentForCustoms);
      if (shipment) {
        // Update shipment with customs info
        const updatedShipment = {
          ...shipment,
          customs_info: customsData,
          details: {
            ...shipment.details,
            customs_info: customsData
          }
        };
        
        // Call onEditShipment to update the shipment
        onEditShipment(selectedShipmentForCustoms, updatedShipment.details);
      }
    }
    setCustomsModalOpen(false);
    setSelectedShipmentForCustoms(null);
  };

  const handleBulkCustomsSubmit = (customsData: CustomsInfo) => {
    // Apply customs data to all international shipments
    internationalShipments.forEach(shipment => {
      const updatedShipment = {
        ...shipment,
        customs_info: customsData,
        details: {
          ...shipment.details,
          customs_info: customsData
        }
      };
      
      onEditShipment(shipment.id, updatedShipment.details);
    });

    setBulkCustomsModalOpen(false);
  };

  const getSelectedShipmentForCustomsModal = () => {
    if (!selectedShipmentForCustoms) return null;
    return shipments.find(s => s.id === selectedShipmentForCustoms);
  };

  if (shipments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No shipments to display</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Bulk Customs Button */}
        {hasInternationalShipments && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-900">
                    International Shipments Detected
                  </h3>
                  <p className="text-sm text-blue-700">
                    {internationalShipments.length} shipment{internationalShipments.length !== 1 ? 's' : ''} require{internationalShipments.length === 1 ? 's' : ''} customs documentation
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBulkCustomsClick}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Bulk Apply Customs
              </Button>
            </div>
          </div>
        )}

        {shipments.map((shipment) => {
          const isEditing = editingShipments[shipment.id];
          const currentData = isEditing ? editData[shipment.id] : shipment.details;
          const isInternational = isInternationalShipment(shipment);
          const hasCustomsData = shipment.customs_info && shipment.customs_info.customs_items.length > 0;

          return (
            <Card key={shipment.id} className="border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      {shipment.recipient || currentData.to_name || 'Unknown Recipient'}
                    </CardTitle>
                    {isInternational && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        International
                      </Badge>
                    )}
                    {hasCustomsData && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Customs ✓
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isInternational && (
                      <Button
                        onClick={() => handleCustomsClick(shipment.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {hasCustomsData ? 'Edit Clearance' : 'Clearance'}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleEditToggle(shipment.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                    <Button
                      onClick={() => onAIAnalysis(shipment)}
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => onRefreshRates(shipment.id)}
                      variant="ghost"
                      size="sm"
                      disabled={isFetchingRates}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <RefreshCw className={`w-4 h-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      onClick={() => onRemoveShipment(shipment.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Address Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Shipping Address</h4>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Name"
                          value={currentData.to_name || ''}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            [shipment.id]: { ...prev[shipment.id], to_name: e.target.value }
                          }))}
                        />
                        <Input
                          placeholder="Street Address"
                          value={currentData.to_street1 || ''}
                          onChange={(e) => setEditData(prev => ({
                            ...prev,
                            [shipment.id]: { ...prev[shipment.id], to_street1: e.target.value }
                          }))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="City"
                            value={currentData.to_city || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], to_city: e.target.value }
                            }))}
                          />
                          <Input
                            placeholder="State"
                            value={currentData.to_state || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], to_state: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="ZIP Code"
                            value={currentData.to_zip || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], to_zip: e.target.value }
                            }))}
                          />
                          <Input
                            placeholder="Country"
                            value={currentData.to_country || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], to_country: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p>{currentData?.to_name || 'No name'}</p>
                        <p>{currentData?.to_street1 || 'No street'}</p>
                        <p>{currentData?.to_city || 'No city'}, {currentData?.to_state || 'No state'} {currentData?.to_zip || 'No zip'}</p>
                        <p>{currentData?.to_country || 'No country'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Package Details</h4>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Weight (lbs)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={currentData.weight || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], weight: parseFloat(e.target.value) }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Length (in)</Label>
                          <Input
                            type="number"
                            value={currentData.length || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], length: parseInt(e.target.value) }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Width (in)</Label>
                          <Input
                            type="number"
                            value={currentData.width || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], width: parseInt(e.target.value) }
                            }))}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Height (in)</Label>
                          <Input
                            type="number"
                            value={currentData.height || ''}
                            onChange={(e) => setEditData(prev => ({
                              ...prev,
                              [shipment.id]: { ...prev[shipment.id], height: parseInt(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p>Weight: {currentData?.weight || 0} lbs</p>
                        <p>Dimensions: {currentData?.length || 0} × {currentData?.width || 0} × {currentData?.height || 0} in</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rate Selection */}
                {shipment.availableRates && shipment.availableRates.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Select Shipping Rate</h4>
                    <Select
                      value={shipment.selectedRateId || ''}
                      onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose shipping option" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipment.availableRates.map((rate: Rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{rate.carrier} - {rate.service}</span>
                              <div className="flex items-center gap-2 ml-4">
                                <span className="font-semibold">${parseFloat(rate.rate.toString()).toFixed(2)}</span>
                                {rate.delivery_days && (
                                  <Badge variant="outline" className="text-xs">
                                    {rate.delivery_days} days
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Badge */}
                <div className="flex justify-between items-center">
                  <Badge
                    variant={
                      shipment.status === 'completed' ? 'default' :
                      shipment.status === 'error' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {shipment.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {shipment.rate && (
                    <span className="text-lg font-bold text-green-600">
                      ${shipment.rate.toFixed(2)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Individual Customs Documentation Modal */}
      <CustomsDocumentationModal
        isOpen={customsModalOpen}
        onClose={() => {
          setCustomsModalOpen(false);
          setSelectedShipmentForCustoms(null);
        }}
        onSubmit={handleCustomsSubmit}
        fromCountry="US"
        toCountry={getSelectedShipmentForCustomsModal()?.details?.to_address?.country || 'US'}
        initialData={getSelectedShipmentForCustomsModal()?.customs_info}
      />

      {/* Bulk Customs Documentation Modal */}
      <CustomsDocumentationModal
        isOpen={bulkCustomsModalOpen}
        onClose={() => setBulkCustomsModalOpen(false)}
        onSubmit={handleBulkCustomsSubmit}
        fromCountry="US"
        toCountry="Various"
        initialData={undefined}
      />
    </>
  );
};

export default BulkShipmentsList;
