
import React, { useState } from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, PackageCheck, Edit, RefreshCcw, X, FileText, Truck, ArrowUp, ArrowDown, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { formatWeightDisplay } from '@/utils/weightConversion';
import InsuranceOptions from './InsuranceOptions';
import AIRatePicker from './AIRatePicker';
import EnhancedRateDisplay from './EnhancedRateDisplay';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [openRateSelectors, setOpenRateSelectors] = useState<Record<string, boolean>>({});
  const [insuranceSettings, setInsuranceSettings] = useState<Record<string, { enabled: boolean; value: number }>>({});

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

  const toggleRateSelector = (shipmentId: string) => {
    setOpenRateSelectors(prev => ({
      ...prev,
      [shipmentId]: !prev[shipmentId]
    }));
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

  const formatRate = (rate: string | number | undefined): string => {
    if (!rate) return '0.00';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return isNaN(numRate) ? '0.00' : numRate.toFixed(2);
  };

  const getInsuranceSettings = (shipmentId: string) => {
    return insuranceSettings[shipmentId] || { enabled: true, value: 200 };
  };

  return (
    <div className="space-y-6">
      {/* AI Rate Picker */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <AIRatePicker 
          shipments={shipments}
          onApplyAISelection={handleAIRateSelection}
        />
      </div>

      {shipments.length === 0 ? (
        <Card className="p-6 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No shipments found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment) => {
            const insurance = getInsuranceSettings(shipment.id);
            const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
            const isRatesSectionOpen = openRateSelectors[shipment.id];
            
            return (
              <Card key={shipment.id} className="overflow-hidden">
                <div className="p-6">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          #{shipment.row}
                        </Badge>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {shipment.details.to_name}
                        </h3>
                        {shipment.details.to_company && (
                          <p className="text-sm text-gray-600">{shipment.details.to_company}</p>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          {shipment.details.to_street1}, {shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>📦 {formatWeightDisplay(shipment.details.weight || 16)}</span>
                          <span>📏 {shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"</span>
                          {shipment.details.reference && (
                            <span>🏷️ {shipment.details.reference}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center space-x-2">
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
                  </div>

                  {/* Selected Rate Display */}
                  {selectedRate && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Selected Rate</Label>
                      <EnhancedRateDisplay
                        actualRate={formatRate(selectedRate.rate)}
                        carrier={selectedRate.carrier}
                        service={selectedRate.service}
                        deliveryDays={selectedRate.delivery_days}
                        isSelected={true}
                      />
                    </div>
                  )}

                  {/* Rate Selection Section */}
                  {shipment.status !== 'failed' && shipment.status !== 'error' && (
                    <Collapsible open={isRatesSectionOpen} onOpenChange={() => toggleRateSelector(shipment.id)}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between"
                          disabled={shipment.status === 'pending_rates'}
                        >
                          <span>
                            {shipment.status === 'pending_rates' 
                              ? 'Fetching rates...' 
                              : selectedRate 
                                ? 'Change Rate Selection' 
                                : 'Select Shipping Rate'
                            }
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isRatesSectionOpen ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-3 mt-4">
                        {shipment.status === 'pending_rates' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map(i => (
                              <Skeleton key={i} className="h-24 w-full" />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(shipment.availableRates || []).map((rate) => (
                              <div 
                                key={rate.id}
                                className="cursor-pointer"
                                onClick={() => onSelectRate(shipment.id, rate.id)}
                              >
                                <EnhancedRateDisplay
                                  actualRate={formatRate(rate.rate)}
                                  carrier={rate.carrier}
                                  service={rate.service}
                                  deliveryDays={rate.delivery_days}
                                  isSelected={rate.id === shipment.selectedRateId}
                                  isRecommended={rate.carrier === 'USPS'}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Insurance Section */}
                  <div className="mt-4">
                    <InsuranceOptions
                      shipmentId={shipment.id}
                      insuranceEnabled={insurance.enabled}
                      declaredValue={insurance.value}
                      onInsuranceToggle={handleInsuranceToggle}
                      onDeclaredValueChange={handleDeclaredValueChange}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                    <Dialog open={openDialogs[shipment.id]} onOpenChange={(open) => {
                      if (!open) handleCloseEditDialog(shipment.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenEditDialog(shipment.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Customer & Shipment Details</DialogTitle>
                        </DialogHeader>
                        <ShipmentEditForm
                          shipment={shipment}
                          onSubmit={(data) => {
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
                      disabled={shipment.status === 'pending_rates'}
                    >
                      <RefreshCcw className={`h-4 w-4 mr-1 ${shipment.status === 'pending_rates' ? 'animate-spin' : ''}`} />
                      Refresh
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
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Keep the existing ShipmentEditForm component
interface ShipmentEditFormProps {
  shipment: BulkShipment;
  onSubmit: (data: BulkShipment['details']) => void;
  onCancel: () => void;
}

const ShipmentEditForm: React.FC<ShipmentEditFormProps> = ({ shipment, onSubmit, onCancel }) => {
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
          <Input 
            id="weight" 
            type="number" 
            step="0.1"
            {...form.register('weight', { valueAsNumber: true })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="length">Length (in) *</Label>
          <Input 
            id="length" 
            type="number" 
            step="0.1"
            {...form.register('length', { valueAsNumber: true })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="width">Width (in) *</Label>
          <Input 
            id="width"
            type="number" 
            step="0.1"
            {...form.register('width', { valueAsNumber: true })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Height (in) *</Label>
          <Input 
            id="height"
            type="number"
            step="0.1"
            {...form.register('height', { valueAsNumber: true })} 
            required
          />
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
