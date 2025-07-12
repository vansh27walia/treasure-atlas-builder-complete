import React, { useState } from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, PackageCheck, Edit, RefreshCcw, X, FileText, Truck, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { formatWeightDisplay } from '@/utils/weightConversion';
import InsuranceOptions from './InsuranceOptions';
import AIRatePicker from './AIRatePicker';
import RateDisplay from './RateDisplay';
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
  return <div className="space-y-4">
      {/* AI Rate Picker */}
      <AIRatePicker shipments={shipments} onApplyAISelection={handleAIRateSelection} />

      {shipments.length === 0 ? <Card className="p-6 text-center">
          <p className="text-gray-500">No shipments found.</p>
        </Card> : <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/12">Row</TableHead>
                <TableHead className="w-2/12">Customer Details</TableHead>
                <TableHead className="w-2/12">Shipping Address</TableHead>
                <TableHead className="w-2/12">Carrier & Service</TableHead>
                <TableHead className="w-2/12">Insurance</TableHead>
                <TableHead className="w-1/12">Rate</TableHead>
                <TableHead className="w-1/12">Status</TableHead>
                
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map(shipment => {
            const insurance = getInsuranceSettings(shipment.id);
            const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
            return <TableRow key={shipment.id}>
                    <TableCell>{shipment.row}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{shipment.details.to_name}</div>
                        {shipment.details.to_company && <div className="text-xs text-gray-500">{shipment.details.to_company}</div>}
                        {shipment.details.to_phone && <div className="text-xs text-blue-600">{shipment.details.to_phone}</div>}
                        {shipment.details.to_email && <div className="text-xs text-green-600">{shipment.details.to_email}</div>}
                        {shipment.details.reference && <div className="text-xs text-gray-500">Ref: {shipment.details.reference}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{shipment.details.to_street1}</div>
                        {shipment.details.to_street2 && <div className="text-sm text-gray-500">{shipment.details.to_street2}</div>}
                        <div className="text-sm">
                          {shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}
                        </div>
                        <div className="text-xs text-gray-500">{shipment.details.to_country}</div>
                        <div className="text-xs text-purple-600">
                          {formatWeightDisplay(shipment.details.weight || 16)} • {shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {shipment.status !== 'failed' && shipment.status !== 'error' ? <div className="space-y-2">
                          <Select value={shipment.selectedRateId} onValueChange={value => onSelectRate(shipment.id, value)} disabled={shipment.status === 'pending_rates'}>
                            <SelectTrigger className="min-w-[180px]">
                              <SelectValue placeholder={shipment.status === 'pending_rates' ? "Fetching rates..." : "Select a carrier"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(shipment.availableRates || []).map(rate => <SelectItem key={rate.id} value={rate.id}>
                                  <div className="w-full">
                                    <RateDisplay actualRate={rate.rate} carrier={rate.carrier} service={rate.service} deliveryDays={rate.delivery_days} />
                                  </div>
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div> : <Badge variant="outline" className="bg-red-50 text-red-700">
                          {shipment.error || 'Error loading rates'}
                        </Badge>}
                    </TableCell>
                    <TableCell>
                      <InsuranceOptions shipmentId={shipment.id} insuranceEnabled={insurance.enabled} declaredValue={insurance.value} onInsuranceToggle={handleInsuranceToggle} onDeclaredValueChange={handleDeclaredValueChange} />
                    </TableCell>
                    <TableCell>
                      {shipment.status !== 'pending_rates' && shipment.selectedRateId && selectedRate ? <div className="space-y-1">
                          <div className="font-semibold">
                            ${formatRate(selectedRate.rate)}
                          </div>
                          {insurance.enabled && <div className="text-xs text-blue-600">
                              +${(insurance.value * 0.02).toFixed(2)} ins.
                            </div>}
                        </div> : shipment.status === 'pending_rates' ? <Skeleton className="h-6 w-16" /> : <span className="text-gray-500">-</span>}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Dialog open={openDialogs[shipment.id]} onOpenChange={open => {
                    if (!open) handleCloseEditDialog(shipment.id);
                  }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(shipment.id)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Customer & Shipment Details</DialogTitle>
                            </DialogHeader>
                            <ShipmentEditForm shipment={shipment} onSubmit={data => {
                        onEditShipment(shipment.id, data);
                        handleCloseEditDialog(shipment.id);
                      }} onCancel={() => handleCloseEditDialog(shipment.id)} />
                          </DialogContent>
                        </Dialog>

                        

                        <Button variant="outline" size="sm" onClick={() => onRemoveShipment(shipment.id)} className="text-red-500 border-red-200 hover:bg-red-50">
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>;
          })}
            </TableBody>
          </Table>
        </div>}
    </div>;
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
  return <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
    </form>;
};
export default BulkShipmentsList;