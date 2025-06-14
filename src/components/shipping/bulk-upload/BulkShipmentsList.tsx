import React, { useState } from 'react';
import { BulkShipment, ShipmentDetails } from '@/types/shipping'; // Import ShipmentDetails
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, PackageCheck, Edit, RefreshCcw, X, Truck, Check, Info } from 'lucide-react'; // Removed unused icons
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  isCreatingLabels: boolean; // Added to disable actions during label creation
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: ShipmentDetails) => void; // Use ShipmentDetails type
  onRefreshRates: (shipmentId: string) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  isCreatingLabels,
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
                    {shipment.status === 'rates_fetched' || shipment.status === 'rate_selected' || shipment.status === 'completed' || shipment.status === 'label_purchased' ? (
                      <div>
                        <Select 
                          value={shipment.selectedRateId || undefined}
                          onValueChange={(value) => onSelectRate(shipment.id, value)}
                          disabled={(!shipment.availableRates || shipment.availableRates.length === 0) || isCreatingLabels}
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
                             {(!shipment.availableRates || shipment.availableRates.length === 0) && ( 
                                <SelectItem value="no-rates" disabled>No rates available</SelectItem>
                             )}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : shipment.status === 'pending_rates' || (isFetchingRates && !shipment.availableRates?.length) ? ( // Clarified condition for skeleton
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-[180px]" />
                      </div>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                         <Info size={12} className="mr-1" /> {shipment.error || 'No Rates/Error'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {(shipment.status === 'rates_fetched' || shipment.status === 'rate_selected' || shipment.status === 'completed' || shipment.status === 'label_purchased') && shipment.selectedRateId ? (
                      <div className="font-semibold">
                        ${formatRate(shipment.availableRates?.find(r => r.id === shipment.selectedRateId)?.rate)}
                      </div>
                    ) : shipment.status === 'pending_rates' || (isFetchingRates && !shipment.availableRates?.length) ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {shipment.status === 'completed' || shipment.status === 'label_purchased' ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <PackageCheck className="mr-1 h-3 w-3" />
                        Label Ready
                      </Badge>
                    ) : shipment.status === 'pending_rates' || (isFetchingRates && !shipment.availableRates?.length) ? (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        <Package className="mr-1 h-3 w-3 animate-pulse" />
                        Fetching Rates
                      </Badge>
                    ) : shipment.status === 'rates_fetched' || shipment.status === 'rate_selected' ? (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <Package className="mr-1 h-3 w-3" />
                        Select Rate
                      </Badge>
                    ): shipment.status === 'failed' || shipment.status === 'error' ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <X className="mr-1 h-3 w-3" />
                        {shipment.error ? 'Error' : 'Failed'}
                      </Badge>
                    ) : (
                       <Badge variant="outline">Needs Attention</Badge>
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
                            disabled={isCreatingLabels || shipment.status === 'completed' || shipment.status === 'label_purchased'}
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
                        disabled={isCreatingLabels || shipment.status === 'pending_rates' || (isFetchingRates && !shipment.availableRates?.length) || shipment.status === 'completed' || shipment.status === 'label_purchased'}
                      >
                        <RefreshCcw className={`h-4 w-4 mr-1 ${ (shipment.status === 'pending_rates' || (isFetchingRates && !shipment.availableRates?.length)) ? 'animate-spin' : ''}`} />
                        Rates
                      </Button>

                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onRemoveShipment(shipment.id)}
                        disabled={isCreatingLabels}
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
  onSubmit: (data: ShipmentDetails) => void; // Use ShipmentDetails type
  onCancel: () => void;
}

const ShipmentEditForm: React.FC<ShipmentEditFormProps> = ({ shipment, onSubmit, onCancel }) => {
  const sDetails = shipment.details; // Can be undefined

  const form = useForm<ShipmentDetails>({ // Provide type to useForm
    defaultValues: {
      to_name: sDetails?.to_name || shipment.customer_name || '',
      to_company: sDetails?.to_company || shipment.customer_company || '',
      to_street1: sDetails?.to_street1 || '',
      to_street2: sDetails?.to_street2 || '',
      to_city: sDetails?.to_city || '',
      to_state: sDetails?.to_state || '',
      to_zip: sDetails?.to_zip || '',
      to_country: sDetails?.to_country || 'US',
      to_phone: sDetails?.to_phone || shipment.customer_phone || '',
      to_email: sDetails?.to_email || shipment.customer_email || '',
      parcel: { // Ensure parcel is always an object in form state
        weight: sDetails?.parcel?.weight || sDetails?.weight || 1,
        length: sDetails?.parcel?.length || sDetails?.length || 12,
        width: sDetails?.parcel?.width || sDetails?.width || 8,
        height: sDetails?.parcel?.height || sDetails?.height || 4,
      },
      reference: sDetails?.reference || ''
    }
  });

  const handleFormSubmit = (data: ShipmentDetails) => { // data is now typed as ShipmentDetails
    // The data from react-hook-form will have the parcel nested correctly if form is setup for it
    // or flat if not. Based on defaultValues, 'parcel' is a nested object.
    
    const updatedDetails: ShipmentDetails = {
      ...(shipment.details || {}), // Start with original details (if any)
      ...data, // Override with all form data (includes to_name, parcel object, etc.)
      parcel: { // Specifically merge parcel to ensure all original parcel fields are kept if not in form
        ...(shipment.details?.parcel || {}),
        ...(data.parcel || {}) // data.parcel from form should override
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
        <Input id="to_country" {...form.register('to_country')} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Reference/Order #</Label>
        <Input id="reference" {...form.register('reference')} />
      </div>

      <h3 className="text-md font-semibold pt-2">Package Details</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parcel.weight">Weight (oz) *</Label>
          <Input 
            id="parcel.weight" 
            type="number" 
            step="0.1"
            {...form.register('parcel.weight', { valueAsNumber: true, min: 0.1 })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parcel.length">Length (in) *</Label>
          <Input 
            id="parcel.length" 
            type="number" 
            step="0.1"
            {...form.register('parcel.length', { valueAsNumber: true, min: 0.1 })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parcel.width">Width (in) *</Label>
          <Input 
            id="parcel.width"
            type="number" 
            step="0.1"
            {...form.register('parcel.width', { valueAsNumber: true, min: 0.1 })} 
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parcel.height">Height (in) *</Label>
          <Input 
            id="parcel.height"
            type="number"
            step="0.1"
            {...form.register('parcel.height', { valueAsNumber: true, min: 0.1 })} 
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
