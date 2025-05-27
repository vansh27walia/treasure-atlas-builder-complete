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

  // Helper function to safely format rate as number
  const formatRate = (rate: string | number | undefined): string => {
    if (!rate) return '0.00';
    const numRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    return isNaN(numRate) ? '0.00' : numRate.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {shipments.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No shipments found.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/12">Row</TableHead>
                <TableHead className="w-2/12">Recipient</TableHead>
                <TableHead className="w-2/12">Address</TableHead>
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
                    <div className="font-medium">{shipment.details.name}</div>
                    {shipment.details.company && (
                      <div className="text-xs text-gray-500">{shipment.details.company}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{shipment.details.street1}</div>
                    <div>
                      {shipment.details.city}, {shipment.details.state} {shipment.details.zip}
                    </div>
                    <div className="text-xs">{shipment.details.country}</div>
                  </TableCell>
                  <TableCell>
                    {shipment.status === 'completed' ? (
                      <div>
                        <Select 
                          value={shipment.selectedRateId}
                          onValueChange={(value) => onSelectRate(shipment.id, value)}
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
                                      ({rate.delivery_days} days)
                                    </span>
                                  </span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : shipment.status === 'processing' ? (
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-[180px]" />
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {shipment.error || 'Error loading rates'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {shipment.status === 'completed' && shipment.selectedRateId ? (
                      <div className="font-semibold">
                        ${formatRate(shipment.availableRates?.find(r => r.id === shipment.selectedRateId)?.rate)}
                      </div>
                    ) : shipment.status === 'processing' ? (
                      <Skeleton className="h-6 w-16" />
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {shipment.status === 'completed' ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <PackageCheck className="mr-1 h-3 w-3" />
                        Ready
                      </Badge>
                    ) : shipment.status === 'processing' ? (
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
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
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Shipment Details</DialogTitle>
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
                        disabled={shipment.status === 'processing'}
                      >
                        <RefreshCcw className={`h-4 w-4 mr-1 ${shipment.status === 'processing' ? 'animate-spin' : ''}`} />
                        Rates
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
  const form = useForm({
    defaultValues: {
      name: shipment.details.name,
      company: shipment.details.company || '',
      street1: shipment.details.street1,
      street2: shipment.details.street2 || '',
      city: shipment.details.city,
      state: shipment.details.state,
      zip: shipment.details.zip,
      country: shipment.details.country,
      phone: shipment.details.phone || '',
      parcel_length: shipment.details.parcel_length || 12,
      parcel_width: shipment.details.parcel_width || 8,
      parcel_height: shipment.details.parcel_height || 2,
      parcel_weight: shipment.details.parcel_weight || 16
    }
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register('name')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...form.register('company')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street1">Address Line 1</Label>
        <Input id="street1" {...form.register('street1')} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="street2">Address Line 2</Label>
        <Input id="street2" {...form.register('street2')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register('city')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" {...form.register('state')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input id="zip" {...form.register('zip')} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register('country')} required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register('phone')} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parcel_length">Length (in)</Label>
          <Input 
            id="parcel_length" 
            type="number" 
            {...form.register('parcel_length', { valueAsNumber: true })} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parcel_width">Width (in)</Label>
          <Input 
            id="parcel_width"
            type="number" 
            {...form.register('parcel_width', { valueAsNumber: true })} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parcel_height">Height (in)</Label>
          <Input 
            id="parcel_height"
            type="number"
            {...form.register('parcel_height', { valueAsNumber: true })} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="parcel_weight">Weight (lbs)</Label>
          <Input 
            id="parcel_weight"
            type="number" 
            {...form.register('parcel_weight', { valueAsNumber: true })} 
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Check className="h-4 w-4 mr-1" />
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default BulkShipmentsList;
