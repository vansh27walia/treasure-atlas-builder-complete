import React, { useState } from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, PackageCheck, Edit, RefreshCcw, X, FileText, Truck, ArrowUp, ArrowDown, Check, Sparkles, TrendingDown, Clock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { formatWeightDisplay } from '@/utils/weightConversion';
import InsuranceOptions from './InsuranceOptions';
import AIRatePicker from './AIRatePicker';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: BulkShipment['details']) => void;
  onRefreshRates: (shipmentId: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates
}) => {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [insuranceSettings, setInsuranceSettings] = useState<Record<string, {
    enabled: boolean;
    value: number;
  }>>({});

  // Carrier logo mapping
  const getCarrierLogo = (carrier: string) => {
    const carrierName = carrier?.toLowerCase() || '';
    switch (true) {
      case carrierName.includes('ups'):
        return '🚚';
      case carrierName.includes('fedex'):
        return '✈️';
      case carrierName.includes('usps'):
        return '📮';
      case carrierName.includes('dhl'):
        return '🌍';
      default:
        return '📦';
    }
  };

  // Dynamic discount calculation
  const calculateDiscount = (rate: any) => {
    if (!rate || !rate.rate) return { discountAmount: 0, discountPercentage: 0, originalRate: 0 };
    
    const currentRate = parseFloat(rate.rate);
    // Simulate original higher rate (typically 25-40% higher than our negotiated rates)
    const originalRate = currentRate * 1.35; // 35% markup simulation
    const discountAmount = originalRate - currentRate;
    const discountPercentage = Math.round((discountAmount / originalRate) * 100);
    
    return {
      discountAmount,
      discountPercentage,
      originalRate
    };
  };

  // Enhanced Rate Display Component
  const EnhancedRateDisplay = ({ rate, shipmentId, isSelected }: { 
    rate: any; 
    shipmentId: string; 
    isSelected: boolean;
  }) => {
    const discount = calculateDiscount(rate);
    const insurance = getInsuranceSettings(shipmentId);
    const insuranceCost = insurance.enabled ? insurance.value * 0.02 : 0;
    const totalCost = parseFloat(rate.rate) + insuranceCost;

    return (
      <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50/50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}>
        {/* Carrier Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCarrierLogo(rate.carrier)}</span>
            <div>
              <div className="font-semibold text-gray-900 flex items-center">
                {rate.carrier}
                {isSelected && <Sparkles className="w-4 h-4 ml-2 text-blue-500" />}
              </div>
              <div className="text-sm text-gray-600">{rate.service}</div>
            </div>
          </div>
          
          {/* Delivery Badge */}
          {rate.delivery_days && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{rate.delivery_days} days</span>
            </Badge>
          )}
        </div>

        {/* Dynamic Discount Display */}
        {discount.discountPercentage > 0 && (
          <div className="mb-3 p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  You Save {discount.discountPercentage}%
                </span>
              </div>
              <div className="text-xs text-green-600">
                Save ${discount.discountAmount.toFixed(2)}
              </div>
            </div>
            <div className="mt-1 text-xs text-green-700">
              Our negotiated rate vs standard pricing
            </div>
          </div>
        )}

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          {/* Original Price (crossed out) */}
          {discount.discountPercentage > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Standard Rate:</span>
              <span className="text-gray-500 line-through">
                ${discount.originalRate.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Shipping Cost */}
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Shipping:</span>
            <span className="font-semibold text-lg text-green-600">
              ${parseFloat(rate.rate).toFixed(2)}
            </span>
          </div>
          
          {/* Insurance Cost */}
          {insurance.enabled && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-blue-500" />
                <span className="text-gray-600">Insurance:</span>
              </div>
              <span className="text-blue-600">+${insuranceCost.toFixed(2)}</span>
            </div>
          )}
          
          {/* Total */}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="font-bold text-xl text-blue-600">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleOpenEditDialog = (shipmentId: string) => {
    setOpenDialogs({
      ...openDialogs,
      [shipmentId]: true
    });
  };

  const handleCloseEditDialog = (shipmentId: string) => {
    setOpenDialogs({
      ...openDialogs,
      [shipmentId]: false
    });
  };

  const handleInsuranceToggle = (shipmentId: string, enabled: boolean) => {
    setInsuranceSettings(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        enabled,
        value: prev[shipmentId]?.value || 200
      }
    }));
  };

  const handleDeclaredValueChange = (shipmentId: string, value: number) => {
    setInsuranceSettings(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        value,
        enabled: prev[shipmentId]?.enabled ?? true
      }
    }));
  };

  const handleAIRateSelection = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
  };

  // Helper function to safely format rate as number
  const formatRate = (rate: string | number | undefined): string => {
    if (!rate) return '0.00';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return isNaN(numRate) ? '0.00' : numRate.toFixed(2);
  };

  // Helper function to get insurance settings with defaults
  const getInsuranceSettings = (shipmentId: string) => {
    return insuranceSettings[shipmentId] || {
      enabled: true,
      value: 200
    };
  };

  return (
    <div className="space-y-6">
      {/* AI Rate Picker */}
      <AIRatePicker shipments={shipments} onApplyAISelection={handleAIRateSelection} />

      {shipments.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No shipments found.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {shipments.map(shipment => {
            const insurance = getInsuranceSettings(shipment.id);
            const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
            
            return (
              <Card key={shipment.id} className="p-6 shadow-lg border-0 bg-white">
                {/* Shipment Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-bold text-blue-600">#{shipment.row}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{shipment.details.to_name}</h3>
                      <p className="text-sm text-gray-500">
                        {shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  {['completed', 'rate_selected', 'rates_fetched', 'label_purchased'].includes(shipment.status) ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <PackageCheck className="mr-1 h-3 w-3" />
                      Ready
                    </Badge>
                  ) : shipment.status === 'pending_rates' ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Package className="mr-1 h-3 w-3 animate-pulse" />
                      Processing
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <X className="mr-1 h-3 w-3" />
                      Error
                    </Badge>
                  )}
                </div>

                {/* Customer & Package Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Customer Details
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{shipment.details.to_name}</div>
                      {shipment.details.to_company && <div className="text-gray-500">{shipment.details.to_company}</div>}
                      {shipment.details.to_phone && <div className="text-blue-600">{shipment.details.to_phone}</div>}
                      {shipment.details.to_email && <div className="text-green-600">{shipment.details.to_email}</div>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Truck className="w-4 h-4 mr-2" />
                      Shipping Address
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>{shipment.details.to_street1}</div>
                      {shipment.details.to_street2 && <div className="text-gray-500">{shipment.details.to_street2}</div>}
                      <div>{shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}</div>
                      <div className="text-gray-500">{shipment.details.to_country}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Package Info</h4>
                    <div className="text-sm">
                      <div className="text-purple-600 font-medium">
                        {formatWeightDisplay(shipment.details.weight || 16)}
                      </div>
                      <div className="text-gray-500">
                        {shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"
                      </div>
                      {shipment.details.reference && (
                        <div className="text-gray-500">Ref: {shipment.details.reference}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Insurance Settings */}
                <div className="mb-6">
                  <InsuranceOptions 
                    shipmentId={shipment.id} 
                    insuranceEnabled={insurance.enabled} 
                    declaredValue={insurance.value} 
                    onInsuranceToggle={handleInsuranceToggle} 
                    onDeclaredValueChange={handleDeclaredValueChange} 
                  />
                </div>

                {/* Rate Selection */}
                {shipment.status !== 'failed' && shipment.status !== 'error' ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                      Choose Your Rate
                    </h4>
                    
                    {shipment.status === 'pending_rates' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="p-4 rounded-lg border border-gray-200">
                            <Skeleton className="h-20 w-full mb-2" />
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(shipment.availableRates || []).map(rate => (
                          <div 
                            key={rate.id}
                            className="cursor-pointer"
                            onClick={() => onSelectRate(shipment.id, rate.id)}
                          >
                            <EnhancedRateDisplay 
                              rate={rate}
                              shipmentId={shipment.id}
                              isSelected={shipment.selectedRateId === rate.id}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {shipment.error || 'Error loading rates'}
                    </Badge>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                  <Dialog open={openDialogs[shipment.id]} onOpenChange={open => {
                    if (!open) handleCloseEditDialog(shipment.id);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(shipment.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Customer & Shipment Details</DialogTitle>
                      </DialogHeader>
                      <ShipmentEditForm 
                        shipment={shipment} 
                        onSubmit={data => {
                          onEditShipment(shipment.id, data);
                          handleCloseEditDialog(shipment.id);
                        }} 
                        onCancel={() => handleCloseEditDialog(shipment.id)} 
                      />
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onRefreshRates(shipment.id)}
                    disabled={isFetchingRates}
                  >
                    <RefreshCcw className="h-4 w-4 mr-1" />
                    Refresh Rates
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onRemoveShipment(shipment.id)} 
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ShipmentEditFormProps {
  shipment: BulkShipment;
  onSubmit: (data: BulkShipment['details']) => void;
  onCancel: () => void;
}

const ShipmentEditForm: React.FC<ShipmentEditFormProps> = ({
  shipment,
  onSubmit,
  onCancel
}) => {
  const form = useForm({
    defaultValues: {
      to_name: shipment.details.to_name,
      to_company: shipment.details.to_company || '',
      to_street1: shipment.details.to_street1,
      to_street2: shipment.details.to_street2 || '',
      to_city: shipment.details.to_city,
      to_state: shipment.details.to_state,
      to_zip: shipment.details.to_zip,
      to_country: shipment.details.to_country,
      to_phone: shipment.details.to_phone || '',
      to_email: shipment.details.to_email || '',
      weight: shipment.details.weight || 1,
      length: shipment.details.length || 12,
      width: shipment.details.width || 8,
      height: shipment.details.height || 4,
      reference: shipment.details.reference || ''
    }
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="to_name">Customer Name *</Label>
          <Input id="to_name" {...form.register('to_name')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to_company">Company</Label>
          <Input id="to_company" {...form.register('to_company')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="to_phone">Phone</Label>
          <Input id="to_phone" {...form.register('to_phone')} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to_email">Email</Label>
          <Input id="to_email" type="email" {...form.register('to_email')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_street1">Address Line 1 *</Label>
        <Input id="to_street1" {...form.register('to_street1')} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_street2">Address Line 2</Label>
        <Input id="to_street2" {...form.register('to_street2')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="to_city">City *</Label>
          <Input id="to_city" {...form.register('to_city')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to_state">State *</Label>
          <Input id="to_state" {...form.register('to_state')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to_zip">ZIP Code *</Label>
          <Input id="to_zip" {...form.register('to_zip')} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="to_country">Country *</Label>
        <Input id="to_country" {...form.register('to_country')} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference/Order #</Label>
        <Input id="reference" {...form.register('reference')} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (oz) *</Label>
          <Input id="weight" type="number" step="0.1" {...form.register('weight', {
            valueAsNumber: true
          })} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="length">Length (in) *</Label>
          <Input id="length" type="number" step="0.1" {...form.register('length', {
            valueAsNumber: true
          })} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="width">Width (in) *</Label>
          <Input id="width" type="number" step="0.1" {...form.register('width', {
            valueAsNumber: true
          })} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Height (in) *</Label>
          <Input id="height" type="number" step="0.1" {...form.register('height', {
            valueAsNumber: true
          })} required />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Check className="h-4 w-4 mr-1" />
          Save Customer Details
        </Button>
      </div>
    </form>
  );
};

export default BulkShipmentsList;
