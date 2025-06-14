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
import { useForm } from 'react-hook-form';

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

  const handleOpenEditDialog = (shipmentId: string) => {
    setOpenDialogs(prev => ({ ...prev, [shipmentId]: true }));
  };

  const handleCloseEditDialog = (shipmentId: string) => {
    setOpenDialogs(prev => ({ ...prev, [shipmentId]: false }));
  };

  const formatRate = (rate: string | number | undefined): string => {
    if (rate === null || typeof rate === 'undefined') return '0.00';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return isNaN(numRate) ? '0.00' : numRate.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {shipments.length === 0 && !isFetchingRates ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No shipments found or all shipments have been processed.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/12">Row</TableHead>
                <TableHead className="w-2/12">Customer Details</TableHead>
                <TableHead className="w-2/12">Shipping Address</TableHead>
                <TableHead className="w-2/12">Carrier & Service</TableHead>
                <TableHead className="w-1/12">Rate</TableHead>
                <TableHead className="w-1/12">Status</TableHead>
                <TableHead className="w-3/12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>{shipment.row}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{shipment.details.to_name || shipment.customer_name}</div>
                      {(shipment.details.to_company || shipment.customer_company) && (
                        <div className="text-xs text-gray-500">{shipment.details.to_company || shipment.customer_company}</div>
                      )}
                      {(shipment.details.to_phone || shipment.customer_phone) && (
                        <div className="text-xs text-blue-600">{shipment.details.to_phone || shipment.customer_phone}</div>
                      )}
                      {(shipment.details.to_email || shipment.customer_email) && (
                        <div className="text-xs text-green-600">{shipment.details.to_email || shipment.customer_email}</div>
                      )}
                      {shipment.details.reference && (
                        <div className="text-xs text-gray-500">Ref: {shipment.details.reference}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{shipment.details.to_street1}</div>
                      {shipment.details.to_street2 && (
                        <div className="text-sm text-gray-500">{shipment.details.to_street2}</div>
                      )}
                      <div className="text-sm">
                        {shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}
                      </div>
                      <div className="text-xs text-gray-500">{shipment.details.to_country}</div>
                      <div className="text-xs text-purple-600">
                        {shipment.details.parcel?.weight || shipment.details.weight}oz • {shipment.details.parcel?.length || shipment.details.length}"×{shipment.details.parcel?.width || shipment.details.width}"×{shipment.details.parcel?.height || shipment.details.height}"
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {shipment.status === 'rates_fetched' || shipment.status === 'rate_selected' || shipment.status === 'completed' ? (
                      <div>
                        <Select 
                          value={shipment.selectedRateId || undefined}
                          onValueChange={(value) => onSelectRate(shipment.id, value)}
                          disabled={!shipment.availableRates || shipment.availableRates.length === 0}
                        >
                          <SelectTrigger className="min-w-[180px]">
                            <SelectValue placeholder="Select a carrier" />
                          </SelectTrigger>
                          <SelectContent>
                            {(shipment.availableRates || []).map((rate) => (
                              <SelectItem key={rate.id} value={rate.id}>
                                <span className="flex items-center">
                                  <Truck className="mr-2 h-4 w-4" />
                                  <span>
                                    {rate.carrier} - {rate.service}
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({rate.delivery_days || rate.est_delivery_days || 'N/A'} days) - ${formatRate(rate.rate)}
                                    </span>
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                             {(!shipment.availableRates || shipment.availableRates.length === 0) && shipment.status !== 'pending_rates' && (
                                <SelectItem value="no-rates" disabled>No rates available</SelectItem>
                             )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : shipment.status === 'pending_rates' || isFetchingRates ? (
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-[180px]" />
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {shipment.error || 'Error/No Rates'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(shipment.status === 'rates_fetched' || shipment.status === 'rate_selected' || shipment.status === 'completed') && shipment.selectedRateId ? (
                      <div className="font-semibold">
                        ${formatRate(shipment.availableRates?.find(r => r.id === shipment.selectedRateId)?.rate)}
                      </div>
                    ) : shipment.status === 'pending_rates' || isFetchingRates ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {shipment.status === 'completed' || shipment.status === 'label_purchased' ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <PackageCheck className="mr-1 h-3 w-3" />
                        Ready
                      </Badge>
                    ) : shipment.status === 'pending_rates' || isFetchingRates ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <Package className="mr-1 h-3 w-3 animate-pulse" />
                        Fetching Rates
                      </Badge>
                    ) : shipment.status === 'rates_fetched' || shipment.status === 'rate_selected' ? (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Package className="mr-1 h-3 w-3" />
                        Select Rate
                      </Badge>
                    ): (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <X className="mr-1 h-3 w-3" />
                        {shipment.error ? 'Error' : 'Unknown'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Dialog open={openDialogs[shipment.id]} onOpenChange={(open) => {
                        if (!open) handleCloseEditDialog(shipment.id); else handleOpenEditDialog(shipment.id);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
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
                        disabled={shipment.status === 'pending_rates' || isFetchingRates}
                      >
                        <RefreshCcw className={`h-4 w-4 mr-1 ${ (shipment.status === 'pending_rates' || (isFetchingRates && !shipment.availableRates)) ? 'animate-spin' : ''}`} />
                        Rates
                      </Button>

                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onRemoveShipment(shipment.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

const ShipmentEditForm: React.FC<ShipmentEditFormProps> = ({ shipment, onSubmit, onCancel }) => {
  const defaultDetails = shipment.details || {};
  const form = useForm({
    defaultValues: {
      to_name: defaultDetails.to_name || shipment.customer_name || '',
      to_company: defaultDetails.to_company || shipment.customer_company || '',
      to_street1: defaultDetails.to_street1 || '',
      to_street2: defaultDetails.to_street2 || '',
      to_city: defaultDetails.to_city || '',
      to_state: defaultDetails.to_state || '',
      to_zip: defaultDetails.to_zip || '',
      to_country: defaultDetails.to_country || 'US',
      to_phone: defaultDetails.to_phone || shipment.customer_phone || '',
      to_email: defaultDetails.to_email || shipment.customer_email || '',
      weight: defaultDetails.parcel?.weight || defaultDetails.weight || 1,
      length: defaultDetails.parcel?.length || defaultDetails.length || 12,
      width: defaultDetails.parcel?.width || defaultDetails.width || 8,
      height: defaultDetails.parcel?.height || defaultDetails.height || 4,
      reference: defaultDetails.reference || ''
    }
  });

  const handleFormSubmit = (data: any) => {
    const { weight, length, width, height, ...addressData } = data;
    const parcelData = { weight, length, width, height };
    // Construct the details object to match BulkShipment['details'] structure
    const updatedDetails: BulkShipment['details'] = {
      ...addressData, // Spread all address fields
      parcel: parcelData, // Nest parcel dimensions and weight
      // Ensure other potentially existing fields on shipment.details are preserved if not edited
      ...(shipment.details || {}), 
      ...addressData, // Re-spread to ensure form values take precedence
      parcel: { // Re-spread parcel to ensure form values take precedence
        ...(shipment.details?.parcel || {}),
        ...parcelData
      }
    };
    onSubmit(updatedDetails);
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
        <Input id="to_country" {...form.register('to_country')} defaultValue="US" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference/Order #</Label>
        <Input id="reference" {...form.register('reference')} />
      </div>

      <h3 className="text-md font-semibold pt-2">Package Details</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (oz) *</Label>
          <Input 
            id="weight" 
            type="number" 
            step="0.1"
            {...form.register('weight', { valueAsNumber: true, min: 0.1 })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="length">Length (in) *</Label>
          <Input 
            id="length" 
            type="number" 
            step="0.1"
            {...form.register('length', { valueAsNumber: true, min: 0.1 })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="width">Width (in) *</Label>
          <Input 
            id="width"
            type="number" 
            step="0.1"
            {...form.register('width', { valueAsNumber: true, min: 0.1 })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Height (in) *</Label>
          <Input 
            id="height"
            type="number"
            step="0.1"
            {...form.register('height', { valueAsNumber: true, min: 0.1 })} 
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
          Save Details
        </Button>
      </div>
    </form>
  );
};

export default BulkShipmentsList;
