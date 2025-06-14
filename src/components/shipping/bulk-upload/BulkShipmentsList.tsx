import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BulkShipment, Rate, ShipmentDetails, ParcelDetails } from '@/types/shipping';
import { ChevronDown, ChevronUp, Edit3, RefreshCcw, Trash2, XCircle, CheckCircle, AlertTriangle, Truck, PackageSearch } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  isCreatingLabels: boolean; // Added this prop
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updatedDetails: ShipmentDetails) => void;
  onRefreshRates: (shipmentId: string) => Promise<void>;
}

const ShipmentEditForm: React.FC<{
  shipment: BulkShipment;
  onSave: (updatedDetails: ShipmentDetails) => void;
  onCancel: () => void;
}> = ({ shipment, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    to_name: shipment.details.to_address.name || '',
    to_company: shipment.details.to_address.company || '',
    to_street1: shipment.details.to_address.street1 || '',
    to_street2: shipment.details.to_address.street2 || '',
    to_city: shipment.details.to_address.city || '',
    to_state: shipment.details.to_address.state || '',
    to_zip: shipment.details.to_address.zip || '',
    to_country: shipment.details.to_address.country || 'US',
    to_phone: shipment.details.to_address.phone || '',
    to_email: shipment.details.to_address.email || '',
    weight: shipment.details.parcel.weight.toString(),
    length: shipment.details.parcel.length.toString(),
    width: shipment.details.parcel.width.toString(),
    height: shipment.details.parcel.height.toString(),
    predefined_package: shipment.details.parcel.predefined_package || '',
    reference: shipment.details.reference || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const currentParcel = shipment.details.parcel;
    const newParcelDetails: ParcelDetails = {
      weight: parseFloat(formData.weight) || currentParcel.weight,
      length: parseFloat(formData.length) || currentParcel.length,
      width: parseFloat(formData.width) || currentParcel.width,
      height: parseFloat(formData.height) || currentParcel.height,
      predefined_package: formData.predefined_package || currentParcel.predefined_package || null,
    };

    const updatedDetails: ShipmentDetails = {
      ...shipment.details, // Keep existing details like customs_info, options etc.
      to_address: {
        ...shipment.details.to_address, // Keep existing parts of to_address
        name: formData.to_name,
        company: formData.to_company,
        street1: formData.to_street1,
        street2: formData.to_street2,
        city: formData.to_city,
        state: formData.to_state,
        zip: formData.to_zip,
        country: formData.to_country,
        phone: formData.to_phone,
        email: formData.to_email,
      },
      // from_address can remain as is from original shipment details or be updated if needed
      // from_address: shipment.details.from_address, 
      parcel: newParcelDetails,
      reference: formData.reference,
    };
    onSave(updatedDetails);
  };

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Shipment: {shipment.customer_name || shipment.id}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
        <h4 className="font-semibold col-span-2">Recipient Address</h4>
        {[
          { label: 'Name', name: 'to_name', type: 'text' },
          { label: 'Company', name: 'to_company', type: 'text' },
          { label: 'Street 1', name: 'to_street1', type: 'text' },
          { label: 'Street 2', name: 'to_street2', type: 'text' },
          { label: 'City', name: 'to_city', type: 'text' },
          { label: 'State', name: 'to_state', type: 'text' },
          { label: 'Zip Code', name: 'to_zip', type: 'text' },
          { label: 'Country', name: 'to_country', type: 'text' },
          { label: 'Phone', name: 'to_phone', type: 'tel' },
          { label: 'Email', name: 'to_email', type: 'email' },
        ].map(field => (
          <div className="grid grid-cols-4 items-center gap-4" key={field.name}>
            <Label htmlFor={field.name} className="text-right">{field.label}</Label>
            <Input id={field.name} name={field.name} type={field.type} value={(formData as any)[field.name]} onChange={handleChange} className="col-span-3" />
          </div>
        ))}
        <h4 className="font-semibold col-span-2 mt-4">Package Details</h4>
        {[
          { label: 'Weight (oz/lb)', name: 'weight', type: 'number' },
          { label: 'Length (in)', name: 'length', type: 'number' },
          { label: 'Width (in)', name: 'width', type: 'number' },
          { label: 'Height (in)', name: 'height', type: 'number' },
          { label: 'Predefined Package', name: 'predefined_package', type: 'text' },
          { label: 'Reference', name: 'reference', type: 'text' },
        ].map(field => (
           <div className="grid grid-cols-4 items-center gap-4" key={field.name}>
            <Label htmlFor={field.name} className="text-right">{field.label}</Label>
            <Input id={field.name} name={field.name} type={field.type} value={(formData as any)[field.name]} onChange={handleChange} className="col-span-3" step={field.type === 'number' ? '0.01' : undefined} />
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </DialogContent>
  );
};


const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  isCreatingLabels,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
}) => {
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);
  const [editingShipment, setEditingShipment] = useState<BulkShipment | null>(null);

  const toggleExpand = (shipmentId: string) => {
    setExpandedShipmentId(expandedShipmentId === shipmentId ? null : shipmentId);
  };
  
  const handleEdit = (shipment: BulkShipment) => {
    setEditingShipment(shipment);
  };

  const handleSaveEdit = (updatedDetails: ShipmentDetails) => {
    if (editingShipment) {
      onEditShipment(editingShipment.id, updatedDetails);
    }
    setEditingShipment(null);
  };

  const getStatusIndicator = (status: BulkShipment['status']) => {
    switch (status) {
      case 'pending_rates':
      case 'pending_upload':
        return <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />;
      case 'rates_fetched':
      case 'rate_selected':
        return <Truck className="h-5 w-5 text-blue-500 mr-2" />;
      case 'label_purchased':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500 mr-2" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500 mr-2" />;
      default:
        return null;
    }
  };
  
  const getStatusTooltip = (status: BulkShipment['status']) => {
    const statusMap: Record<BulkShipment['status'], string> = {
      pending_upload: 'Pending upload processing',
      pending_rates: 'Pending rate fetching',
      rates_fetched: 'Rates fetched, select a rate',
      rate_selected: 'Rate selected, ready to purchase label',
      label_purchased: 'Label purchased, pending finalization',
      completed: 'Label creation complete',
      failed: 'Shipment processing failed',
      error: 'Error occurred',
    };
    return statusMap[status] || 'Unknown status';
  };


  if (!shipments || shipments.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="p-6 text-center text-gray-500">
          <PackageSearch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="font-semibold">No shipments to display.</p>
          <p className="text-sm">Upload a CSV file or adjust your filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Selected Rate</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment) => (
              <React.Fragment key={shipment.id}>
                <TableRow className={shipment.status === 'failed' || shipment.status === 'error' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleExpand(shipment.id)}>
                      {expandedShipmentId === shipment.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center" title={getStatusTooltip(shipment.status)}>
                      {getStatusIndicator(shipment.status)}
                      <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{shipment.customer_name || 'N/A'}</TableCell>
                  <TableCell>{shipment.customer_address || 'N/A'}</TableCell>
                  <TableCell>
                    {shipment.selectedRateId && shipment.availableRates?.find(r => r.id === shipment.selectedRateId) ? (
                      <>
                        ${shipment.availableRates.find(r => r.id === shipment.selectedRateId)?.rate}
                        <span className="text-xs text-gray-500 ml-1">
                          ({shipment.availableRates.find(r => r.id === shipment.selectedRateId)?.carrier} - {shipment.availableRates.find(r => r.id === shipment.selectedRateId)?.service})
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-500 italic">No rate selected</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(shipment)} title="Edit Shipment" disabled={isCreatingLabels || shipment.status === 'completed' || shipment.status === 'label_purchased'}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onRefreshRates(shipment.id)} title="Refresh Rates" disabled={isFetchingRates || isCreatingLabels || shipment.status === 'completed' || shipment.status === 'label_purchased'}>
                      <RefreshCcw className={`h-4 w-4 ${isFetchingRates && expandedShipmentId === shipment.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveShipment(shipment.id)} title="Remove Shipment" disabled={isCreatingLabels || shipment.status === 'completed' || shipment.status === 'label_purchased'}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedShipmentId === shipment.id && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-4 bg-gray-50 border-t">
                        <h4 className="font-semibold mb-2 text-sm">Available Rates for {shipment.customer_name || 'Shipment'}</h4>
                        {isFetchingRates && <p className="text-sm text-blue-600">Fetching rates...</p>}
                        {(!shipment.availableRates || shipment.availableRates.length === 0) && !isFetchingRates && (
                          <p className="text-sm text-gray-500">No rates available or yet to be fetched. Click refresh if needed.</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {shipment.availableRates?.map((rate) => (
                            <Card 
                              key={rate.id} 
                              className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${shipment.selectedRateId === rate.id ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}
                              onClick={() => onSelectRate(shipment.id, rate.id)}
                            >
                              <div className="flex justify-between items-center">
                                <p className="font-semibold text-sm">{rate.carrier} {rate.service}</p>
                                <p className="font-bold text-md text-blue-600">${rate.rate}</p>
                              </div>
                              <p className="text-xs text-gray-500">
                                Delivery: {rate.delivery_days ? `${rate.delivery_days} days` : rate.est_delivery_days ? `${rate.est_delivery_days} days (est.)` : 'N/A'}
                              </p>
                            </Card>
                          ))}
                        </div>
                        {shipment.error_message && (
                          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-xs">
                            <strong>Error:</strong> {shipment.error_message}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {editingShipment && (
        <Dialog open={!!editingShipment} onOpenChange={(isOpen) => !isOpen && setEditingShipment(null)}>
          <ShipmentEditForm
            shipment={editingShipment}
            onSave={handleSaveEdit}
            onCancel={() => setEditingShipment(null)}
          />
        </Dialog>
      )}
    </>
  );
};

export default BulkShipmentsList;
