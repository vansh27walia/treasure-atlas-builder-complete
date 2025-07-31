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
import CarrierLogo from '../CarrierLogo';
import AIPoweredSidePanel from '../AIPoweredSidePanel';

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
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [selectedShipmentForAI, setSelectedShipmentForAI] = useState<BulkShipment | null>(null);

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

  const handleRateSelection = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
    
    // Find the shipment and open AI sidebar
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment && shipment.availableRates && shipment.availableRates.length > 0) {
      setSelectedShipmentForAI(shipment);
      setAiSidebarOpen(true);
    }
  };

  const handleAISidebarClose = () => {
    setAiSidebarOpen(false);
    setSelectedShipmentForAI(null);
  };

  const handleOptimizationChange = (filter: string) => {
    if (!selectedShipmentForAI) return;

    let bestRate;
    const rates = selectedShipmentForAI.availableRates || [];

    switch (filter) {
      case 'cheapest':
        bestRate = rates.reduce((prev, curr) => {
          const currRate = typeof curr.rate === 'string' ? parseFloat(curr.rate) : curr.rate;
          const prevRate = typeof prev.rate === 'string' ? parseFloat(prev.rate) : prev.rate;
          return currRate < prevRate ? curr : prev;
        });
        break;
      case 'fastest':
        bestRate = rates.reduce((prev, curr) => 
          (curr.delivery_days || 999) < (prev.delivery_days || 999) ? curr : prev
        );
        break;
      default:
        bestRate = rates[0];
    }

    if (bestRate) {
      onSelectRate(selectedShipmentForAI.id, bestRate.id);
    }
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

  // Helper function to calculate insurance cost
  const calculateInsuranceCost = (declaredValue: number): number => {
    return (declaredValue * 0.02); // $2 for every $100
  };

  // Helper function to get discount percentage
  const getDiscountPercentage = (rate: any): number => {
    if (!rate) return 0;
    const currentRate = typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate;
    const inflatedRate = currentRate * 4; // Same as RateDisplay component
    return Math.round(((inflatedRate - currentRate) / inflatedRate) * 100);
  };

  return (
    <div className={`space-y-4 transition-all duration-300 ${aiSidebarOpen ? 'mr-80' : ''}`}>
      {/* AI Rate Picker */}
      <AIRatePicker shipments={shipments} onApplyAISelection={handleAIRateSelection} />

      {shipments.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No shipments found.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Card className="shadow-lg">
            <Table>
              <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <TableRow className="border-b-2 border-blue-100">
                  <TableHead className="w-1/12 font-semibold text-blue-900">Row</TableHead>
                  <TableHead className="w-2/12 font-semibold text-blue-900">Customer Details</TableHead>
                  <TableHead className="w-2/12 font-semibold text-blue-900">Shipping Address</TableHead>
                  <TableHead className="w-2/12 font-semibold text-blue-900">Carrier & Service</TableHead>
                  <TableHead className="w-2/12 font-semibold text-blue-900">Insurance</TableHead>
                  <TableHead className="w-1/12 font-semibold text-blue-900">Rate</TableHead>
                  <TableHead className="w-1/12 font-semibold text-blue-900">Status</TableHead>
                  <TableHead className="w-1/12 text-right font-semibold text-blue-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment, index) => {
                  const insurance = getInsuranceSettings(shipment.id);
                  const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
                  const insuranceCost = insurance.enabled ? calculateInsuranceCost(insurance.value) : 0;
                  const shippingCost = selectedRate ? parseFloat(formatRate(selectedRate.rate)) : 0;
                  const totalCost = shippingCost + insuranceCost;
                  
                  return (
                    <TableRow 
                      key={shipment.id}
                      className={`hover:bg-blue-50/50 transition-colors border-b ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                      }`}
                    >
                      <TableCell className="font-medium text-blue-700">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-bold">
                          {shipment.row}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold text-gray-900">{shipment.details.to_name}</div>
                          {shipment.details.to_company && (
                            <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {shipment.details.to_company}
                            </div>
                          )}
                          {shipment.details.to_phone && (
                            <div className="text-xs text-blue-600 font-medium">📞 {shipment.details.to_phone}</div>
                          )}
                          {shipment.details.to_email && (
                            <div className="text-xs text-green-600 font-medium">✉️ {shipment.details.to_email}</div>
                          )}
                          {shipment.details.reference && (
                            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              Ref: {shipment.details.reference}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{shipment.details.to_street1}</div>
                          {shipment.details.to_street2 && (
                            <div className="text-sm text-gray-600">{shipment.details.to_street2}</div>
                          )}
                          <div className="text-sm text-gray-700">
                            {shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                            {shipment.details.to_country}
                          </div>
                          <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded inline-block mt-1">
                            📦 {formatWeightDisplay(shipment.details.weight || 16)} • {shipment.details.length}"×{shipment.details.width}"×{shipment.details.height}"
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {shipment.status !== 'failed' && shipment.status !== 'error' ? (
                          <div className="space-y-2">
                            <Select 
                              value={shipment.selectedRateId} 
                              onValueChange={(value) => handleRateSelection(shipment.id, value)} 
                              disabled={shipment.status === 'pending_rates'}
                            >
                              <SelectTrigger className="min-w-[200px] border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder={
                                  shipment.status === 'pending_rates' 
                                    ? "🔄 Fetching rates..." 
                                    : "Select a carrier"
                                } />
                              </SelectTrigger>
                              <SelectContent className="max-w-sm">
                                {(shipment.availableRates || []).map(rate => (
                                  <SelectItem key={rate.id} value={rate.id}>
                                    <div className="flex items-start space-x-3 w-full p-2">
                                      <CarrierLogo carrier={rate.carrier} className="w-8 h-8 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-sm font-semibold text-gray-900">
                                            {rate.carrier} - {rate.service}
                                          </span>
                                          {rate.delivery_days && (
                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                              {rate.delivery_days} days
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                          <div className="text-right">
                                            <div className="text-xs text-gray-500 line-through">
                                              ${(parseFloat(formatRate(rate.rate)) * 4).toFixed(2)}
                                            </div>
                                            <div className="text-lg font-bold text-green-600">
                                              ${formatRate(rate.rate)}
                                            </div>
                                          </div>
                                          <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                                            Save {getDiscountPercentage(rate)}%
                                          </div>
                                        </div>
                                        
                                        <div className="text-xs text-gray-600 mt-1">
                                          You're saving {getDiscountPercentage(rate)}% with our negotiated rate
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <X className="w-3 h-3 mr-1" />
                            {shipment.error || 'Error loading rates'}
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <InsuranceOptions 
                          shipmentId={shipment.id}
                          insuranceEnabled={insurance.enabled}
                          declaredValue={insurance.value}
                          onInsuranceToggle={handleInsuranceToggle}
                          onDeclaredValueChange={handleDeclaredValueChange}
                        />
                        {insurance.enabled && (
                          <div className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                            $2 per $100 value
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {shipment.status !== 'pending_rates' && shipment.selectedRateId && selectedRate ? (
                          <div className="space-y-2">
                            <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Shipping:</span>
                                  <span className="font-semibold text-gray-900">${formatRate(selectedRate.rate)}</span>
                                </div>
                                {insurance.enabled && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-blue-600">Insurance:</span>
                                    <span className="text-sm font-medium text-blue-700">+${insuranceCost.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="border-t border-green-300 pt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-green-800">Total:</span>
                                    <span className="text-lg font-bold text-green-800">${totalCost.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : shipment.status === 'pending_rates' ? (
                          <Skeleton className="h-20 w-24" />
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
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
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog open={openDialogs[shipment.id]} onOpenChange={open => {
                            if (!open) handleCloseEditDialog(shipment.id);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenEditDialog(shipment.id)}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
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
                            onClick={() => onRemoveShipment(shipment.id)} 
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* AI Powered Side Panel */}
      {aiSidebarOpen && selectedShipmentForAI && selectedShipmentForAI.availableRates && (
        <AIPoweredSidePanel
          rates={selectedShipmentForAI.availableRates.map(rate => ({
            ...rate,
            rate: formatRate(rate.rate),
            days: rate.delivery_days || 3,
            reliability: 85 // Default reliability score
          }))}
          onRatesReorder={() => {}}
          onCarrierFilter={() => {}}
          onRateSelect={(rate) => {
            if (selectedShipmentForAI) {
              handleRateSelection(selectedShipmentForAI.id, rate.id);
            }
          }}
          onOpenRateCalculator={() => {}}
          onClose={handleAISidebarClose}
        />
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
