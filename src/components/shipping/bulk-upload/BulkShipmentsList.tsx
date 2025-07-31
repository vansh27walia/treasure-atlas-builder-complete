import React, { useState, useEffect } from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Edit2, Save, X, RefreshCw, Bot, TrendingUp, Award, MessageCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '../CarrierLogo';
import EnhancedAISidePanel from './EnhancedAISidePanel';
import CSVTemplateDownloader from './CSVTemplateDownloader';

interface BulkShipmentDetails {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  parcel_length: number;
  parcel_width: number;
  parcel_height: number;
  parcel_weight: number;
  insurance_amount?: number;
}

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  onShipmentUpdate: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onRefreshRates: (shipmentId: string) => void;
  isFetchingRates: boolean;
  onBulkApplyCarrier: (carrier: string) => void;
}

const getStatusBadge = (status: string, error?: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline">Pending</Badge>;
    case 'processing':
      return <Badge variant="secondary">Processing</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
    case 'error':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-300">
          Error: {error || 'Unknown'}
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
};

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  onShipmentUpdate,
  onRefreshRates,
  isFetchingRates,
  onBulkApplyCarrier
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [selectedShipment, setSelectedShipment] = useState<BulkShipment | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const handleEdit = (shipment: BulkShipment) => {
    setEditingId(shipment.id);
    setEditFormData({ ...shipment.details });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleSaveEdit = (shipmentId: string) => {
    onShipmentUpdate(shipmentId, { details: editFormData });
    setEditingId(null);
    setEditFormData({});
    toast.success('Shipment details updated');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShowAIAnalysis = (shipment: BulkShipment) => {
    setSelectedShipment(shipment);
    setShowAIPanel(true);
  };

  const handleCloseAIPanel = () => {
    setShowAIPanel(false);
    setSelectedShipment(null);
  };

  const handleAIShipmentUpdate = (shipmentId: string, updates: any) => {
    onShipmentUpdate(shipmentId, updates);
    // Refresh the selected shipment data
    const updatedShipment = shipments.find(s => s.id === shipmentId);
    if (updatedShipment) {
      setSelectedShipment(updatedShipment);
    }
  };

  const handleBulkApply = (carrier: string) => {
    onBulkApplyCarrier(carrier);
  };

  return (
    <div className="space-y-6">
      {/* Header Section with CSV Template */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Shipments</h3>
          <p className="text-sm text-gray-600">{shipments.length} shipments loaded</p>
        </div>
        <div className="space-y-4">
          <CSVTemplateDownloader />
          {/* Bulk Actions */}
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkApply('USPS')}>
              Apply USPS
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkApply('UPS')}>
              Apply UPS
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkApply('FedEx')}>
              Apply FedEx
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Shipments Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Selected Rate</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shipments.map((shipment, index) => (
              <TableRow key={shipment.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{index + 1}</TableCell>
                
                <TableCell>
                  <div>
                    <div className="font-medium">{shipment.details.name}</div>
                    {shipment.details.company && (
                      <div className="text-sm text-gray-500">{shipment.details.company}</div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div>{shipment.details.city}, {shipment.details.state}</div>
                    <div className="text-gray-500">{shipment.details.zip}</div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div>{shipment.details.parcel_weight} oz</div>
                    <div className="text-gray-500">
                      {shipment.details.parcel_length}×{shipment.details.parcel_width}×{shipment.details.parcel_height}"
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  {shipment.availableRates && shipment.availableRates.length > 0 ? (
                    <Select
                      value={shipment.selectedRateId || ''}
                      onValueChange={(rateId) => {
                        const selectedRate = shipment.availableRates?.find(r => r.id === rateId);
                        if (selectedRate) {
                          onShipmentUpdate(shipment.id, {
                            selectedRateId: rateId,
                            carrier: selectedRate.carrier,
                            service: selectedRate.service,
                            rate: parseFloat(selectedRate.rate.toString())
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select rate" />
                      </SelectTrigger>
                      <SelectContent>
                        {shipment.availableRates.map((rate) => (
                          <SelectItem key={rate.id} value={rate.id}>
                            <div className="flex items-center gap-2">
                              <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                              <div>
                                <div className="font-medium">{rate.carrier} {rate.service}</div>
                                <div className="text-xs text-gray-500">
                                  ${parseFloat(rate.rate).toFixed(2)} - {rate.delivery_days} days
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CarrierLogo carrier={shipment.carrier} className="w-4 h-4" />
                      <div className="text-sm">
                        <div className="font-medium">{shipment.carrier} {shipment.service}</div>
                        <div className="text-gray-500">No rates available</div>
                      </div>
                    </div>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <div className="font-semibold text-green-600">
                      ${(shipment.rate || 0).toFixed(2)}
                    </div>
                    {shipment.details.insurance_amount && (
                      <div className="text-xs text-gray-500">
                        +${((shipment.details.insurance_amount || 0) * 0.01).toFixed(2)} ins
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(shipment.status, shipment.error)}
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShowAIAnalysis(shipment)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Bot className="w-4 h-4" />
                    </Button>
                    
                    {shipment.availableRates && shipment.availableRates.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRefreshRates(shipment.id)}
                        disabled={isFetchingRates}
                      >
                        <RefreshCw className={`w-4 h-4 ${isFetchingRates ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(shipment)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Enhanced AI Side Panel */}
      <EnhancedAISidePanel
        selectedShipment={selectedShipment}
        allShipments={shipments}
        isOpen={showAIPanel}
        onClose={handleCloseAIPanel}
        onShipmentUpdate={handleAIShipmentUpdate}
      />

      {editingId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Shipment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <Input
                  type="text"
                  name="name"
                  value={editFormData.name || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <Input
                  type="text"
                  name="company"
                  value={editFormData.company || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street 1</label>
                <Input
                  type="text"
                  name="street1"
                  value={editFormData.street1 || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street 2</label>
                <Input
                  type="text"
                  name="street2"
                  value={editFormData.street2 || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <Input
                  type="text"
                  name="city"
                  value={editFormData.city || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <Input
                  type="text"
                  name="state"
                  value={editFormData.state || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP</label>
                <Input
                  type="text"
                  name="zip"
                  value={editFormData.zip || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <Input
                  type="text"
                  name="country"
                  value={editFormData.country || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input
                  type="text"
                  name="phone"
                  value={editFormData.phone || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="text"
                  name="email"
                  value={editFormData.email || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parcel Length</label>
                <Input
                  type="number"
                  name="parcel_length"
                  value={editFormData.parcel_length || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parcel Width</label>
                <Input
                  type="number"
                  name="parcel_width"
                  value={editFormData.parcel_width || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parcel Height</label>
                <Input
                  type="number"
                  name="parcel_height"
                  value={editFormData.parcel_height || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parcel Weight</label>
                <Input
                  type="number"
                  name="parcel_weight"
                  value={editFormData.parcel_weight || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Insurance Amount</label>
                <Input
                  type="number"
                  name="insurance_amount"
                  value={editFormData.insurance_amount || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="ghost" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button onClick={() => handleSaveEdit(editingId)}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BulkShipmentsList;
