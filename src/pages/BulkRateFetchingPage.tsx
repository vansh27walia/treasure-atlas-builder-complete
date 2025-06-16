
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, Info, Sparkles, Edit, Truck, Shield, Calculator } from 'lucide-react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { useBulkUpload } from '@/components/shipping/bulk-upload/useBulkUpload';
import BulkShipmentEditModal from '@/components/shipping/bulk-upload/BulkShipmentEditModal';
import CarrierLogo from '@/components/shipping/CarrierLogo';
import { supabase } from '@/integrations/supabase/client';

interface InsuranceData {
  enabled: boolean;
  declaredValue: number;
  cost: number;
}

interface InflatedRateData {
  original: number;
  inflated: number;
  savings: number;
}

const CARRIERS = [
  { id: 'usps', name: 'USPS', services: ['Ground Advantage', 'Priority Mail', 'Priority Express'] },
  { id: 'ups', name: 'UPS', services: ['Ground', '3 Day Select', '2nd Day Air', 'Next Day Air'] },
  { id: 'fedex', name: 'FedEx', services: ['Ground', 'Express Saver', '2Day', 'Standard Overnight'] },
  { id: 'dhl', name: 'DHL', services: ['Ground', 'Express', 'Express Worldwide'] },
  { id: 'canadapost', name: 'Canada Post', services: ['Regular Parcel', 'Expedited Parcel', 'Xpresspost'] },
  { id: 'purolator', name: 'Purolator', services: ['Ground', 'Express', 'Express 9AM'] }
];

const AI_OPTIONS = [
  { id: 'fastest', label: 'Fastest Delivery', description: 'Prioritize speed over cost' },
  { id: 'affordable', label: 'Most Affordable', description: 'Lowest cost options' },
  { id: '2day', label: 'Delivery in 2 Days', description: 'Best 2-day delivery options' },
  { id: '3day', label: 'Delivery in 3 Days', description: 'Best 3-day delivery options' }
];

const BulkRateFetchingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { results, updateResults, handleSelectRate, handleEditShipment, handleRemoveShipment } = useBulkUpload();
  
  const [insurance, setInsurance] = useState<Record<string, InsuranceData>>({});
  const [editingShipment, setEditingShipment] = useState<BulkShipment | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'oz'>('lbs');

  // Initialize insurance data for all shipments
  useEffect(() => {
    if (results?.processedShipments) {
      const initialInsurance: Record<string, InsuranceData> = {};
      results.processedShipments.forEach(shipment => {
        initialInsurance[shipment.id] = {
          enabled: true,
          declaredValue: 200,
          cost: 4.00
        };
      });
      setInsurance(initialInsurance);
    }
  }, [results?.processedShipments]);

  // Get current shipments data
  const shipments = results?.processedShipments || [];

  // Calculate insurance cost (2% of declared value, minimum $1.00)
  const calculateInsuranceCost = (declaredValue: number): number => {
    return Math.max(declaredValue * 0.02, 1.00);
  };

  // Update insurance data
  const updateInsurance = (shipmentId: string, field: keyof InsuranceData, value: any) => {
    setInsurance(prev => {
      const updated = { ...prev };
      if (!updated[shipmentId]) {
        updated[shipmentId] = { enabled: true, declaredValue: 200, cost: 4.00 };
      }
      
      updated[shipmentId] = { ...updated[shipmentId], [field]: value };
      
      // Recalculate cost if declared value changes
      if (field === 'declaredValue') {
        updated[shipmentId].cost = calculateInsuranceCost(value);
      }
      
      return updated;
    });
  };

  // Generate inflated rate data
  const getInflatedRate = (originalRate: number): InflatedRateData => {
    const multiplier = 1.7 + (Math.random() * 0.1); // 70-80% higher
    const inflated = originalRate * multiplier;
    const savings = Math.round(((inflated - originalRate) / inflated) * 100);
    
    return {
      original: originalRate,
      inflated: inflated,
      savings: savings
    };
  };

  // Convert weight from ounces to pounds
  const convertWeight = (weightInOz: number): string => {
    if (weightUnit === 'lbs') {
      const pounds = weightInOz / 16;
      return `${pounds.toFixed(2)} lbs`;
    }
    return `${weightInOz} oz`;
  };

  // Handle carrier selection for all shipments
  const handleSelectAllCarriers = () => {
    if (!selectedCarrier || !selectedService) {
      toast.error('Please select both carrier and service');
      return;
    }

    const updatedShipments = shipments.map(shipment => {
      // Find matching rate for this carrier/service
      const matchingRate = shipment.availableRates?.find(
        rate => rate.carrier.toLowerCase() === selectedCarrier.toLowerCase() && 
               rate.service.toLowerCase().includes(selectedService.toLowerCase())
      );

      if (matchingRate) {
        return {
          ...shipment,
          selectedRateId: matchingRate.id,
          carrier: matchingRate.carrier,
          service: matchingRate.service,
          rate: parseFloat(matchingRate.rate)
        };
      }

      return shipment;
    });

    if (results) {
      updateResults({
        ...results,
        processedShipments: updatedShipments
      });
    }

    toast.success(`Applied ${selectedCarrier} ${selectedService} to all eligible shipments`);
  };

  // AI-powered rate selection
  const handleAIRateSelection = async (option: string) => {
    setIsLoadingAI(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-rate-picker', {
        body: {
          shipments: shipments,
          criteria: option,
          availableCarriers: CARRIERS
        }
      });

      if (error) throw error;

      if (data?.recommendations) {
        // Apply AI recommendations
        const updatedShipments = shipments.map(shipment => {
          const recommendation = data.recommendations.find((r: any) => r.shipmentId === shipment.id);
          if (recommendation) {
            const recommendedRate = shipment.availableRates?.find(rate => rate.id === recommendation.rateId);
            if (recommendedRate) {
              return {
                ...shipment,
                selectedRateId: recommendedRate.id,
                carrier: recommendedRate.carrier,
                service: recommendedRate.service,
                rate: parseFloat(recommendedRate.rate)
              };
            }
          }
          return shipment;
        });

        if (results) {
          updateResults({
            ...results,
            processedShipments: updatedShipments
          });
        }

        toast.success(`AI optimized rates for ${data.optimizedCount} shipments`);
      }
    } catch (error) {
      console.error('AI rate selection error:', error);
      toast.error('Failed to get AI recommendations');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Handle edit shipment
  const handleEditClick = (shipment: BulkShipment) => {
    setEditingShipment(shipment);
  };

  // Handle edit save with immediate UI update
  const handleEditSave = (updatedShipment: BulkShipment) => {
    const updatedShipments = shipments.map(s => 
      s.id === updatedShipment.id ? updatedShipment : s
    );

    if (results) {
      updateResults({
        ...results,
        processedShipments: updatedShipments
      });
    }

    setEditingShipment(null);
    toast.success('Shipment updated successfully');
  };

  // Calculate totals including insurance
  const calculateTotals = () => {
    let totalShipping = 0;
    let totalInsurance = 0;

    shipments.forEach(shipment => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      if (selectedRate) {
        totalShipping += parseFloat(selectedRate.rate);
      }

      const shipmentInsurance = insurance[shipment.id];
      if (shipmentInsurance?.enabled) {
        totalInsurance += shipmentInsurance.cost;
      }
    });

    return { totalShipping, totalInsurance, total: totalShipping + totalInsurance };
  };

  const totals = calculateTotals();

  if (!results || !shipments.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Rate Data Available</h1>
          <Button onClick={() => navigate('/bulk-upload')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bulk Upload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/bulk-upload')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Batch Rate Selection</h1>
            <Badge variant="secondary">{shipments.length} Shipments</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>Weight Unit:</Label>
            <Select value={weightUnit} onValueChange={(value: 'lbs' | 'oz') => setWeightUnit(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="oz">oz</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Carrier Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Apply Carrier to All
              </h3>
              <div className="flex gap-3">
                <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map(carrier => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedService} onValueChange={setSelectedService} disabled={!selectedCarrier}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCarrier && CARRIERS.find(c => c.id === selectedCarrier)?.services.map(service => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button onClick={handleSelectAllCarriers} disabled={!selectedCarrier || !selectedService}>
                  Apply All
                </Button>
              </div>
            </div>

            {/* AI Rate Picker */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Rate Optimization
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AI_OPTIONS.map(option => (
                  <Button
                    key={option.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIRateSelection(option.id)}
                    disabled={isLoadingAI}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Shipment Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Package</th>
                  <th className="text-left p-3">Weight</th>
                  <th className="text-left p-3">Carrier & Service</th>
                  <th className="text-left p-3">Rate</th>
                  <th className="text-left p-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Insurance
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-sm">
                          <p><strong>EasyPost Insurance:</strong></p>
                          <p>• Premium: 2% of declared value (min $1.00)</p>
                          <p>• Covers loss and damage</p>
                          <p>• Claims within 30-60 days</p>
                          <p>• Up to $100 covered by carriers by default</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => {
                  const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
                  const shipmentInsurance = insurance[shipment.id] || { enabled: true, declaredValue: 200, cost: 4.00 };
                  const inflatedData = selectedRate ? getInflatedRate(parseFloat(selectedRate.rate)) : null;
                  const weight = shipment.details.parcel_weight || 16;

                  return (
                    <tr key={shipment.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{shipment.recipient}</div>
                          <div className="text-sm text-gray-500">{shipment.details.city}, {shipment.details.state}</div>
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <span className="font-mono">{convertWeight(weight)}</span>
                      </td>
                      
                      <td className="p-3">
                        {selectedRate ? (
                          <div className="flex items-center gap-2">
                            <CarrierLogo carrier={selectedRate.carrier} size="sm" />
                            <div>
                              <div className="font-medium">{selectedRate.carrier.toUpperCase()}</div>
                              <div className="text-sm text-gray-500">{selectedRate.service}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No rate selected</span>
                        )}
                      </td>
                      
                      <td className="p-3">
                        {selectedRate && inflatedData ? (
                          <div>
                            <div className="text-sm text-gray-500 line-through">${inflatedData.inflated.toFixed(2)}</div>
                            <div className="font-bold text-green-600">${inflatedData.original.toFixed(2)}</div>
                            <div className="text-xs text-green-600">Save {inflatedData.savings}%</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      
                      <td className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={shipmentInsurance.enabled}
                              onCheckedChange={(checked) => updateInsurance(shipment.id, 'enabled', checked)}
                            />
                            <span className="text-sm">Enable</span>
                          </div>
                          
                          {shipmentInsurance.enabled && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">Value:</span>
                                <Input
                                  type="number"
                                  value={shipmentInsurance.declaredValue}
                                  onChange={(e) => updateInsurance(shipment.id, 'declaredValue', Number(e.target.value))}
                                  className="w-20 h-6 text-xs"
                                  min="1"
                                />
                              </div>
                              <div className="text-xs text-gray-600">
                                Cost: ${shipmentInsurance.cost.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-bold">
                          ${((selectedRate ? parseFloat(selectedRate.rate) : 0) + 
                             (shipmentInsurance.enabled ? shipmentInsurance.cost : 0)).toFixed(2)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(shipment)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total ({shipments.length} shipments):</span>
              <div className="text-right">
                <div>Shipping: ${totals.totalShipping.toFixed(2)}</div>
                <div>Insurance: ${totals.totalInsurance.toFixed(2)}</div>
                <div className="text-xl text-green-600">Total: ${totals.total.toFixed(2)}</div>
                <div className="text-sm text-gray-500">You're saving 70% with negotiated rates</div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => navigate('/bulk-upload')}>
              Back to Upload
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                // Proceed to label creation with insurance data
                navigate('/bulk-upload?step=create-labels', { 
                  state: { insuranceData: insurance }
                });
              }}
            >
              Create All Labels
            </Button>
          </div>
        </Card>

        {/* Edit Modal */}
        {editingShipment && (
          <BulkShipmentEditModal
            shipment={editingShipment}
            isOpen={true}
            onClose={() => setEditingShipment(null)}
            onSave={handleEditSave}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default BulkRateFetchingPage;
