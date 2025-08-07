
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BulkShipment } from '@/types/shipping';
import { Edit, RefreshCw, Trash2, Package, Truck, Clock, DollarSign, Award, Zap, Sparkles } from 'lucide-react';
import { standardizeCarrierName } from '@/utils/carrierUtils';
import CarrierLogo from '../CarrierLogo';
import { toast } from '@/components/ui/sonner';

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 10, etc.

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipment: BulkShipment) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis?: (shipment: any) => void;
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
  const [editingShipment, setEditingShipment] = useState<BulkShipment | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Helper function to get carrier colors
  const getCarrierColor = (carrier: string) => {
    const normalizedCarrier = carrier.toLowerCase();
    if (normalizedCarrier.includes('ups')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (normalizedCarrier.includes('fedex')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (normalizedCarrier.includes('usps')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (normalizedCarrier.includes('dhl')) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Calculate discount percentage
  const calculateDiscount = (rate: any) => {
    if (rate.original_rate && rate.rate) {
      const originalRate = parseFloat(rate.original_rate.toString());
      const currentRate = parseFloat(rate.rate.toString());
      if (originalRate > currentRate) {
        return Math.round(((originalRate - currentRate) / originalRate) * 100);
      }
    }
    return rate.discount_percentage || 0;
  };

  // Check if rate is AI recommended
  const isAIRecommended = (rate: any, shipment: BulkShipment) => {
    // AI recommends rates that are balanced between price and speed
    const ratePrice = parseFloat(rate.rate.toString());
    const deliveryDays = rate.delivery_days || 5;
    
    // AI logic: recommend rates under $25 with 3 days or less delivery
    return ratePrice < 25 && deliveryDays <= 3 && !rate.service.toLowerCase().includes('ground');
  };

  const handleEditClick = (shipment: BulkShipment) => {
    setEditingShipment({ ...shipment });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingShipment) return;
    
    try {
      // Update the shipment details
      await onEditShipment(editingShipment);
      
      // Refresh rates for this specific shipment after successful edit
      await onRefreshRates(editingShipment.id);
      
      setEditDialogOpen(false);
      setEditingShipment(null);
      
      toast.success('Shipment updated and rates refreshed successfully');
    } catch (error) {
      console.error('Error saving shipment edit:', error);
      toast.error('Failed to update shipment');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!editingShipment) return;
    
    setEditingShipment(prev => ({
      ...prev!,
      details: {
        ...prev!.details,
        [field]: value
      }
    }));
  };

  const calculateTotalCost = (shipment: BulkShipment) => {
    const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
    const ratePrice = selectedRate ? parseFloat(selectedRate.rate.toString()) : 0;
    const insuranceCost = shipment.details?.insurance_amount ? parseFloat(shipment.details.insurance_amount.toString()) * 0.01 : 0; // 1% of insured value
    return ratePrice + insuranceCost;
  };

  if (!shipments || shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
        <p className="text-gray-500">Upload a CSV file to get started with bulk shipping.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shipments.map((shipment) => {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
        const totalCost = calculateTotalCost(shipment);
        
        return (
          <Card key={shipment.id} className="border border-gray-200 hover:shadow-md transition-shadow duration-200 max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-4">
                  {/* Customer Name and Address */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {shipment.details?.name || 'Unknown Recipient'}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1 leading-relaxed">
                      <div className="font-medium">{shipment.details?.street1}</div>
                      {shipment.details?.street2 && <div className="text-gray-500">{shipment.details.street2}</div>}
                      <div>
                        {shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}
                      </div>
                      {shipment.details?.country && shipment.details.country !== 'US' && (
                        <div className="font-medium">{shipment.details.country}</div>
                      )}
                    </div>
                  </div>

                  {/* Package Dimensions */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center mb-3">
                      <Package className="w-5 h-5 text-gray-600 mr-2" />
                      <span className="text-base font-semibold text-gray-800">Package Details</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="font-medium text-gray-700">Dimensions:</span> 
                        <span className="text-gray-900 font-mono">
                          {shipment.details?.parcel_length || 12}" × {shipment.details?.parcel_width || 8}" × {shipment.details?.parcel_height || 4}"
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="font-medium text-gray-700">Weight:</span> 
                        <span className="text-gray-900 font-mono">{shipment.details?.parcel_weight || 16} lbs</span>
                      </div>
                    </div>
                  </div>

                  {/* Rate Selection */}
                  <div className="mb-4">
                    <Label className="text-base font-semibold text-gray-800 mb-3 block">
                      Select Shipping Rate
                    </Label>
                    
                    {shipment.availableRates && shipment.availableRates.length > 0 ? (
                      <Select
                        value={shipment.selectedRateId || ''}
                        onValueChange={(value) => onSelectRate(shipment.id, value)}
                      >
                        <SelectTrigger className="w-full h-14 bg-white border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-left">
                          <SelectValue placeholder="Choose a shipping option">
                            {selectedRate && (
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center space-x-4">
                                  <CarrierLogo 
                                    carrier={standardizeCarrierName(selectedRate.carrier)} 
                                    className="w-10 h-10 flex-shrink-0" 
                                  />
                                  <div className="text-left">
                                    <div className="font-bold text-gray-900 text-base">
                                      {standardizeCarrierName(selectedRate.carrier)} - {selectedRate.service}
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {selectedRate.delivery_days} business days
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600 text-lg">
                                    ${parseFloat(selectedRate.rate.toString()).toFixed(2)}
                                  </div>
                                  {calculateDiscount(selectedRate) > 0 && (
                                    <div className="text-xs text-green-600 font-medium">
                                      {calculateDiscount(selectedRate)}% discount
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="w-full max-w-4xl bg-white border border-gray-200 shadow-xl z-50">
                          {shipment.availableRates.map((rate) => {
                            const discount = calculateDiscount(rate);
                            const aiRecommended = isAIRecommended(rate, shipment);
                            
                            return (
                              <SelectItem 
                                key={rate.id} 
                                value={rate.id}
                                className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center justify-between w-full min-w-[500px]">
                                  <div className="flex items-center space-x-4">
                                    <CarrierLogo 
                                      carrier={standardizeCarrierName(rate.carrier)} 
                                      className="w-12 h-12 flex-shrink-0" 
                                    />
                                    <div>
                                      <div className="flex items-center gap-3 mb-1">
                                        <span className="font-bold text-gray-900 text-lg">
                                          {standardizeCarrierName(rate.carrier)}
                                        </span>
                                        {aiRecommended && (
                                          <Badge className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 text-xs flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            AI Recommended
                                          </Badge>
                                        )}
                                        {discount > 0 && (
                                          <Badge className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 text-xs">
                                            {discount}% OFF
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-base text-gray-700 font-medium mb-1">
                                        {rate.service}
                                      </div>
                                      <div className="text-sm text-blue-600 flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {rate.delivery_days} business days delivery
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-xl text-green-600 mb-1">
                                      ${parseFloat(rate.rate.toString()).toFixed(2)}
                                    </div>
                                    {rate.original_rate && discount > 0 && (
                                      <div className="text-sm text-gray-500 line-through">
                                        Was ${parseFloat(rate.original_rate.toString()).toFixed(2)}
                                      </div>
                                    )}
                                    {discount > 0 && (
                                      <div className="text-xs font-bold text-green-600">
                                        Save ${(parseFloat(rate.original_rate?.toString() || '0') - parseFloat(rate.rate.toString())).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <Truck className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          {isFetchingRates ? 'Fetching rates...' : 'No rates available'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Total Cost Display */}
                  <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-base">Total Cost (Rate + Insurance):</span>
                      <span className="text-xl font-bold text-green-600">
                        ${totalCost.toFixed(2)}
                      </span>
                    </div>
                    {shipment.details?.insurance_amount && (
                      <div className="text-sm text-gray-600 mt-2 flex justify-between">
                        <span>Insurance (1% of ${parseFloat(shipment.details.insurance_amount.toString()).toFixed(2)}):</span>
                        <span className="font-medium">${(parseFloat(shipment.details.insurance_amount.toString()) * 0.01).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(shipment)}
                        className="flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Edit Shipment Details</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh] pr-4">
                        {editingShipment && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Recipient Name</Label>
                                <Input
                                  id="name"
                                  value={editingShipment.details?.name || ''}
                                  onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="company">Company</Label>
                                <Input
                                  id="company"
                                  value={editingShipment.details?.company || ''}
                                  onChange={(e) => handleInputChange('company', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label htmlFor="street1">Street Address</Label>
                              <Input
                                id="street1"
                                value={editingShipment.details?.street1 || ''}
                                onChange={(e) => handleInputChange('street1', e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="street2">Apartment/Unit</Label>
                              <Input
                                id="street2"
                                value={editingShipment.details?.street2 || ''}
                                onChange={(e) => handleInputChange('street2', e.target.value)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="city">City</Label>
                                <Input
                                  id="city"
                                  value={editingShipment.details?.city || ''}
                                  onChange={(e) => handleInputChange('city', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="state">State</Label>
                                <Input
                                  id="state"
                                  value={editingShipment.details?.state || ''}
                                  onChange={(e) => handleInputChange('state', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="zip">ZIP Code</Label>
                                <Input
                                  id="zip"
                                  value={editingShipment.details?.zip || ''}
                                  onChange={(e) => handleInputChange('zip', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <Label htmlFor="parcel_length">Length (in)</Label>
                                <Input
                                  id="parcel_length"
                                  type="number"
                                  value={editingShipment.details?.parcel_length || ''}
                                  onChange={(e) => handleInputChange('parcel_length', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="parcel_width">Width (in)</Label>
                                <Input
                                  id="parcel_width"
                                  type="number"
                                  value={editingShipment.details?.parcel_width || ''}
                                  onChange={(e) => handleInputChange('parcel_width', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="parcel_height">Height (in)</Label>
                                <Input
                                  id="parcel_height"
                                  type="number"
                                  value={editingShipment.details?.parcel_height || ''}
                                  onChange={(e) => handleInputChange('parcel_height', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="parcel_weight">Weight (lbs)</Label>
                                <Input
                                  id="parcel_weight"
                                  type="number"
                                  value={editingShipment.details?.parcel_weight || ''}
                                  onChange={(e) => handleInputChange('parcel_weight', e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="insurance_amount">Insurance Value ($)</Label>
                              <Input
                                id="insurance_amount"
                                type="number"
                                value={editingShipment.details?.insurance_amount || ''}
                                onChange={(e) => handleInputChange('insurance_amount', e.target.value)}
                                placeholder="Optional insurance amount"
                              />
                            </div>
                          </div>
                        )}
                      </ScrollArea>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRefreshRates(shipment.id)}
                    disabled={isFetchingRates}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>

                  {onAIAnalysis && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAIAnalysis(shipment)}
                      className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 border-blue-200"
                    >
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600">AI</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveShipment(shipment.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default BulkShipmentsList;
