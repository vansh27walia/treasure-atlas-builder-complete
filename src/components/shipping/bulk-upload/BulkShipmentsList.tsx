
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Package, FileText, AlertCircle, Sparkles } from 'lucide-react';
import { BulkShipment, Rate, CustomsInfo } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

export interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string) => void;
  onRefreshRates?: (shipmentId: string) => void;
  onAIAnalysis?: (shipment?: any) => void;
  isFetchingRates?: boolean;
  onCustomsUpdate?: (shipmentId: string, customsInfo: CustomsInfo) => void;
  pickupAddress?: any;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis,
  isFetchingRates = false,
  onCustomsUpdate,
  pickupAddress
}) => {
  const [customsModalShipmentId, setCustomsModalShipmentId] = useState<string | null>(null);

  const formatRate = (rate: Rate) => {
    const rateValue = parseFloat(rate.rate?.toString() || '0');
    const deliveryInfo = rate.delivery_days ? ` (${rate.delivery_days} days)` : '';
    return `$${rateValue.toFixed(2)}${deliveryInfo}`;
  };

  const getRateDisplayName = (rate: Rate) => {
    return `${rate.carrier} ${rate.service}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rates_fetched': return 'bg-blue-100 text-blue-800';
      case 'rate_selected': return 'bg-purple-100 text-purple-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCustomsSubmit = (shipmentId: string, customsInfo: CustomsInfo) => {
    if (onCustomsUpdate) {
      onCustomsUpdate(shipmentId, customsInfo);
      toast.success('Customs information saved successfully');
    }
    setCustomsModalShipmentId(null);
  };

  const isInternationalShipment = (shipment: BulkShipment): boolean => {
    const fromCountry = pickupAddress?.country || 'US';
    const toCountry = shipment.details?.to_address?.country || 'US';
    return fromCountry.toUpperCase() !== toCountry.toUpperCase();
  };

  const selectedCustomsShipment = customsModalShipmentId 
    ? shipments.find(s => s.id === customsModalShipmentId)
    : null;

  if (shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Shipments</h3>
        <p className="text-gray-600">Upload a CSV file to get started with bulk shipping.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {shipments.map((shipment, index) => {
          const isInternational = isInternationalShipment(shipment);
          const needsCustoms = isInternational && shipment.status === 'rates_fetched' && !shipment.customs_info;
          
          return (
            <Card key={shipment.id} className={`transition-all duration-200 hover:shadow-md ${needsCustoms ? 'border-orange-200 bg-orange-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">#{index + 1}</span>
                        <Badge className={getStatusColor(shipment.status)}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                        {isInternational && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            International
                          </Badge>
                        )}
                        {needsCustoms && (
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Customs Required
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Recipient</p>
                        <p className="text-sm text-gray-900">
                          {shipment.customer_name || shipment.recipient || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-sm text-gray-900">
                          {shipment.details?.to_address ? 
                            `${shipment.details.to_address.city}, ${shipment.details.to_address.state} ${shipment.details.to_address.country}` :
                            shipment.customer_address || 'N/A'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Package</p>
                        <p className="text-sm text-gray-900">
                          {shipment.details?.parcel ? 
                            `${shipment.details.parcel.weight}lb - ${shipment.details.parcel.length}×${shipment.details.parcel.width}×${shipment.details.parcel.height}"` :
                            'Package info missing'
                          }
                        </p>
                      </div>
                    </div>

                    {shipment.availableRates && shipment.availableRates.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Select Shipping Rate</p>
                        <Select 
                          value={shipment.selectedRateId || ''} 
                          onValueChange={(rateId) => onSelectRate(shipment.id, rateId)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a shipping rate..." />
                          </SelectTrigger>
                          <SelectContent>
                            {shipment.availableRates.map((rate) => (
                              <SelectItem key={rate.id} value={rate.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{getRateDisplayName(rate)}</span>
                                  <span className="font-medium">{formatRate(rate)}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {shipment.error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          {shipment.error}
                        </p>
                      </div>
                    )}

                    {needsCustoms && (
                      <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Customs Documentation Required</p>
                            <p className="text-sm text-orange-600">
                              This is an international shipment. Please provide customs information.
                            </p>
                          </div>
                          <Button
                            onClick={() => setCustomsModalShipmentId(shipment.id)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Add Customs Info
                          </Button>
                        </div>
                      </div>
                    )}

                    {shipment.customs_info && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">Customs Information Provided</p>
                            <p className="text-sm text-green-600">
                              Contents: {shipment.customs_info.contents_type} | 
                              Signer: {shipment.customs_info.customs_signer} |
                              Items: {shipment.customs_info.customs_items?.length || 0}
                            </p>
                          </div>
                          <Button
                            onClick={() => setCustomsModalShipmentId(shipment.id)}
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Edit Customs
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {onAIAnalysis && (
                      <Button 
                        onClick={() => onAIAnalysis(shipment)} 
                        size="sm" 
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        <Sparkles className="w-4 h-4" />
                      </Button>
                    )}
                    <Button onClick={() => onEditShipment(shipment.id)} size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => onRemoveShipment(shipment.id)} 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Customs Documentation Modal */}
      {customsModalShipmentId && selectedCustomsShipment && (
        <CustomsDocumentationModal
          isOpen={!!customsModalShipmentId}
          onClose={() => setCustomsModalShipmentId(null)}
          onSubmit={(customs) => handleCustomsSubmit(customsModalShipmentId, customs)}
          fromCountry={pickupAddress?.country || 'US'}
          toCountry={selectedCustomsShipment.details?.to_address?.country || 'US'}
          initialData={selectedCustomsShipment.customs_info}
        />
      )}
    </>
  );
};

export default BulkShipmentsList;
