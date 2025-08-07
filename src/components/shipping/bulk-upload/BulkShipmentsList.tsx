
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Trash2, Edit, RefreshCw, MapPin, Package, DollarSign } from 'lucide-react';
import { BulkShipment, ShippingOption } from '@/types/shipping';
import { standardizeCarrierName } from '@/utils/carrierUtils';
import CarrierLogo from '../CarrierLogo';

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 8, etc.

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipment: BulkShipment) => void;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRefreshRates: (shipmentId: string) => void;
  onBulkApplyCarrier: (carrierName: string) => void;
  isFetchingRates: boolean;
  searchTerm: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  selectedCarrierFilter: string;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onRemoveShipment,
  onEditShipment,
  onSelectRate,
  onRefreshRates,
  onBulkApplyCarrier,
  isFetchingRates,
  searchTerm,
  sortField,
  sortDirection,
  selectedCarrierFilter,
}) => {
  const [editingShipment, setEditingShipment] = useState<BulkShipment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedRates, setExpandedRates] = useState<Record<string, {
    isExpanded: boolean;
    value: number;
  }>>({});
  const [editingShipments, setEditingShipments] = useState<Set<string>>(new Set());

  // Helper function to get carrier color styling
  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'UPS':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'FedEx':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'USPS':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DHL':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  // Apply markup to rates
  const applyRateMarkup = (originalRate: number): number => {
    const markupAmount = originalRate * (RATE_MARKUP_PERCENTAGE / 100);
    return originalRate + markupAmount;
  };

  // Handle post-payment refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleEditClick = (shipment: BulkShipment) => {
    setEditingShipment({ ...shipment });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingShipment) return;
    
    console.log('Saving shipment edit:', editingShipment.id);
    setEditingShipments(prev => new Set([...prev, editingShipment.id]));
    
    try {
      // Save the edited shipment
      await onEditShipment(editingShipment);
      
      setIsEditDialogOpen(false);
      setEditingShipment(null);
      
      toast.success('Shipment updated successfully! Refreshing rates...');
      
      // Refresh rates after successful edit
      setTimeout(() => {
        onRefreshRates(editingShipment.id);
        setEditingShipments(prev => {
          const newSet = new Set(prev);
          newSet.delete(editingShipment.id);
          return newSet;
        });
      }, 500);
      
    } catch (error) {
      console.error('Error saving shipment edit:', error);
      toast.error('Failed to update shipment');
      setEditingShipments(prev => {
        const newSet = new Set(prev);
        newSet.delete(editingShipment.id);
        return newSet;
      });
    }
  };

  const handleRateToggle = (shipmentId: string) => {
    setExpandedRates(prev => ({
      ...prev,
      [shipmentId]: {
        isExpanded: !prev[shipmentId]?.isExpanded,
        value: prev[shipmentId]?.value || 0
      }
    }));
  };

  const handleRateSelect = (shipmentId: string, rateId: string) => {
    console.log('Rate selected:', { shipmentId, rateId });
    onSelectRate(shipmentId, rateId);
    
    // Close the expanded rates after selection
    setExpandedRates(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        isExpanded: false
      }
    }));
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = searchTerm === '' || 
      shipment.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.details?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = selectedCarrierFilter === 'all' || 
      shipment.carrier === selectedCarrierFilter;
    
    return matchesSearch && matchesCarrier;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let valueA: any = '';
    let valueB: any = '';
    
    switch (sortField) {
      case 'recipient':
        valueA = a.recipient || a.customer_name || '';
        valueB = b.recipient || b.customer_name || '';
        break;
      case 'carrier':
        valueA = a.carrier || '';
        valueB = b.carrier || '';
        break;
      case 'rate':
        valueA = a.rate || 0;
        valueB = b.rate || 0;
        break;
      default:
        return 0;
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      const comparison = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
  });

  const getDiscountPercentage = (rate: ShippingOption) => {
    if (rate.original_rate && rate.rate) {
      const originalRate = parseFloat(rate.original_rate.toString());
      const discountedRate = parseFloat(rate.rate.toString());
      const discount = ((originalRate - discountedRate) / originalRate) * 100;
      return Math.round(discount);
    }
    return rate.discount_percentage || 0;
  };

  if (sortedShipments.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No shipments found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm || selectedCarrierFilter !== 'all' 
            ? 'Try adjusting your search or filters.' 
            : 'Upload a CSV file to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedShipments.map((shipment) => (
        <div key={shipment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Customer Information */}
              <div className="space-y-1">
                <div className="font-semibold text-gray-900">
                  {shipment.recipient || shipment.customer_name || 'Unknown Customer'}
                </div>
                
                {/* Address */}
                <div className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {shipment.details?.street1 && (
                    <span>
                      {shipment.details.street1}
                      {shipment.details.street2 && `, ${shipment.details.street2}`}
                      {shipment.details.city && `, ${shipment.details.city}`}
                      {shipment.details.state && `, ${shipment.details.state}`}
                      {shipment.details.zip && ` ${shipment.details.zip}`}
                    </span>
                  )}
                </div>

                {/* Package Dimensions */}
                <div className="text-sm text-gray-600 flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  <span className="bg-gray-50 px-2 py-1 rounded text-xs">
                    {shipment.details?.parcel_length || 8}" × {shipment.details?.parcel_width || 6}" × {shipment.details?.parcel_height || 4}"
                    {' '} • {shipment.details?.parcel_weight || 16} lbs
                  </span>
                </div>
              </div>

              {/* Rate Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Selected Rate:</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRefreshRates(shipment.id)}
                      disabled={isFetchingRates || editingShipments.has(shipment.id)}
                    >
                      <RefreshCw className={`h-4 w-4 ${isFetchingRates || editingShipments.has(shipment.id) ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {shipment.availableRates && shipment.availableRates.length > 0 ? (
                    <Select
                      value={shipment.selectedRateId || ''}
                      onValueChange={(rateId) => handleRateSelect(shipment.id, rateId)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a rate">
                          {shipment.selectedRateId && (() => {
                            const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
                            if (selectedRate) {
                              const standardizedCarrier = standardizeCarrierName(selectedRate.carrier);
                              const discountPercent = getDiscountPercentage(selectedRate);
                              const markedUpRate = applyRateMarkup(parseFloat(selectedRate.rate.toString()));
                              
                              return (
                                <div className={`flex items-center justify-between w-full px-2 py-1 rounded border ${getCarrierColor(standardizedCarrier)}`}>
                                  <div className="flex items-center space-x-2">
                                    <CarrierLogo carrier={standardizedCarrier} className="w-4 h-4" />
                                    <span className="font-medium">{standardizedCarrier}</span>
                                    <span className="text-sm">{selectedRate.service}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {discountPercent > 0 && (
                                      <span className="text-xs font-bold text-red-600">
                                        {discountPercent}% OFF
                                      </span>
                                    )}
                                    <span className="font-bold text-green-600">
                                      ${markedUpRate.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 w-full">
                        {shipment.availableRates.map((rate) => {
                          const standardizedCarrier = standardizeCarrierName(rate.carrier);
                          const discountPercent = getDiscountPercentage(rate);
                          const markedUpRate = applyRateMarkup(parseFloat(rate.rate.toString()));
                          
                          return (
                            <SelectItem key={rate.id} value={rate.id}>
                              <div className={`flex items-center justify-between w-full px-2 py-1 rounded border ${getCarrierColor(standardizedCarrier)}`}>
                                <div className="flex items-center space-x-2">
                                  <CarrierLogo carrier={standardizedCarrier} className="w-4 h-4" />
                                  <span className="font-medium">{standardizedCarrier}</span>
                                  <span className="text-sm">{rate.service}</span>
                                  {rate.delivery_days && (
                                    <span className="text-xs text-blue-600">
                                      {rate.delivery_days} days
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {discountPercent > 0 && (
                                    <span className="text-xs font-bold text-red-600">
                                      {discountPercent}% OFF
                                    </span>
                                  )}
                                  <span className="font-bold text-green-600">
                                    ${markedUpRate.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      {isFetchingRates || editingShipments.has(shipment.id) ? 'Fetching rates...' : 'No rates available'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-start space-x-2 ml-4">
              <Dialog open={isEditDialogOpen && editingShipment?.id === shipment.id} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(shipment)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Shipment</DialogTitle>
                  </DialogHeader>
                  {editingShipment && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="customer_name">Customer Name</Label>
                        <Input
                          id="customer_name"
                          value={editingShipment.customer_name || editingShipment.recipient || ''}
                          onChange={(e) => setEditingShipment(prev => prev ? {
                            ...prev,
                            customer_name: e.target.value,
                            recipient: e.target.value
                          } : null)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="street1">Street Address</Label>
                        <Input
                          id="street1"
                          value={editingShipment.details?.street1 || ''}
                          onChange={(e) => setEditingShipment(prev => prev ? {
                            ...prev,
                            details: { ...prev.details, street1: e.target.value }
                          } : null)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={editingShipment.details?.city || ''}
                          onChange={(e) => setEditingShipment(prev => prev ? {
                            ...prev,
                            details: { ...prev.details, city: e.target.value }
                          } : null)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={editingShipment.details?.state || ''}
                            onChange={(e) => setEditingShipment(prev => prev ? {
                              ...prev,
                              details: { ...prev.details, state: e.target.value }
                            } : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input
                            id="zip"
                            value={editingShipment.details?.zip || ''}
                            onChange={(e) => setEditingShipment(prev => prev ? {
                              ...prev,
                              details: { ...prev.details, zip: e.target.value }
                            } : null)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="weight">Weight (lbs)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={editingShipment.details?.parcel_weight || ''}
                            onChange={(e) => setEditingShipment(prev => prev ? {
                              ...prev,
                              details: { ...prev.details, parcel_weight: parseFloat(e.target.value) || 0 }
                            } : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="length">Length (in)</Label>
                          <Input
                            id="length"
                            type="number"
                            value={editingShipment.details?.parcel_length || ''}
                            onChange={(e) => setEditingShipment(prev => prev ? {
                              ...prev,
                              details: { ...prev.details, parcel_length: parseFloat(e.target.value) || 0 }
                            } : null)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRemoveShipment(shipment.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BulkShipmentsList;
