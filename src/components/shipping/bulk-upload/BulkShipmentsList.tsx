import React, { useState, useEffect } from 'react';
import { BulkShipment } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, PackageCheck, Edit, RefreshCcw, X, FileText, Truck, ArrowUp, ArrowDown, Check, Shield, DollarSign, ChevronDown, Brain, Zap, Star, Globe } from 'lucide-react';
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
import { toast } from '@/components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import CustomsClearanceButton from './CustomsClearanceButton';
import { standardizeCarrierName } from '@/utils/carrierUtils';

// Local interface for customs info to avoid conflicts
interface LocalCustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type: string; // Made required to match CustomsData
  restriction_comments: string; // Made required to match CustomsData
  customs_items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number: string; // Made required to match CustomsItem
    origin_country: string;
  }>;
  eel_pfc: string; // Made required to match CustomsData
  phone_number: string; // Added required phone_number field
}

interface BulkShipmentsListProps {
  shipments: BulkShipment[];
  isFetchingRates: boolean;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, details: BulkShipment['details']) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis: (shipment?: any) => void;
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis
}) => {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});
  const [customsInfo, setCustomsInfo] = useState<Record<string, LocalCustomsInfo>>({});
  const [insuranceSettings, setInsuranceSettings] = useState<Record<string, {
    enabled: boolean;
    value: number;
  }>>({});
  const [editingShipments, setEditingShipments] = useState<Set<string>>(new Set());

  // Handle post-payment refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      window.location.reload();
    }
  }, []);

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

  const handleCustomsInfoSave = (shipmentId: string, info: LocalCustomsInfo) => {
    setCustomsInfo({
      ...customsInfo,
      [shipmentId]: info
    });
    toast.success('Customs information saved successfully');
  };

  // Check if shipment is international (non-US)
  const isInternationalShipment = (shipment: BulkShipment): boolean => {
    const country = shipment.details.to_country?.toUpperCase();
    return country !== 'US' && country !== 'USA' && country !== 'UNITED STATES';
  };

  const handleInsuranceToggle = (shipmentId: string, enabled: boolean) => {
    setInsuranceSettings(prev => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        enabled,
        value: prev[shipmentId]?.value || 100 // Default $100
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

  const handleRateSelection = (shipmentId: string, rateId: string) => {
    onSelectRate(shipmentId, rateId);
    
    // Trigger AI analysis when a rate is selected
    const shipment = shipments.find(s => s.id === shipmentId);
    if (shipment) {
      onAIAnalysis(shipment);
    }
  };

  // Enhanced AI analysis with 5 criteria
  const calculateAIScore = (rate: any, allRates: any[]) => {
    const scores = {
      cost: 0,
      speed: 0,
      reliability: 0,
      ecoFriendly: 0,
      insurance: 0
    };

    if (allRates.length === 0) return scores;

    // Cost score (30%)
    const rates = allRates.map(r => parseFloat(r.rate || '0')).sort((a, b) => a - b);
    const currentRate = parseFloat(rate.rate || '0');
    const costPercentile = rates.indexOf(currentRate) / rates.length;
    scores.cost = Math.max(1, Math.round((1 - costPercentile) * 5));

    // Speed score (25%)
    const deliveryDays = rate.delivery_days || 7;
    scores.speed = deliveryDays <= 1 ? 5 : deliveryDays <= 2 ? 4 : deliveryDays <= 3 ? 3 : deliveryDays <= 5 ? 2 : 1;

    // Reliability score (20%)
    const reliabilityMap = {
      'USPS': 4,
      'UPS': 5,
      'FedEx': 5,
      'DHL': 4
    };
    scores.reliability = reliabilityMap[rate.carrier] || 3;

    // Eco-friendly score (15%)
    scores.ecoFriendly = rate.service.toLowerCase().includes('ground') ? 5 :
                        rate.service.toLowerCase().includes('standard') ? 4 :
                        rate.service.toLowerCase().includes('express') ? 2 : 3;

    // Insurance coverage score (10%)
    scores.insurance = rate.carrier === 'UPS' || rate.carrier === 'FedEx' ? 5 : 
                      rate.carrier === 'USPS' ? 4 : 3;

    return scores;
  };

  const handleBulkOptimization = (type: string) => {
    let processedCount = 0;
    
    shipments.forEach(shipment => {
      if (shipment.availableRates && shipment.availableRates.length > 0) {
        let bestRate;
        const rates = shipment.availableRates;

        switch (type) {
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
          case 'most_reliable':
            bestRate = rates.find(r => r.carrier === 'UPS') || 
                      rates.find(r => r.carrier === 'FedEx') || 
                      rates.find(r => r.carrier === 'USPS') || 
                      rates[0];
            break;
          case 'eco_friendly':
            bestRate = rates.find(r => r.service.toLowerCase().includes('ground')) || rates[0];
            break;
          case '2day':
            bestRate = rates.find(rate => rate.delivery_days === 2) || 
                      rates.reduce((prev, curr) => 
                        Math.abs((curr.delivery_days || 999) - 2) < Math.abs((prev.delivery_days || 999) - 2) ? curr : prev
                      );
            break;
          case '3day':
            bestRate = rates.find(rate => rate.delivery_days === 3) || 
                      rates.reduce((prev, curr) => 
                        Math.abs((curr.delivery_days || 999) - 3) < Math.abs((prev.delivery_days || 999) - 3) ? curr : prev
                      );
            break;
          case 'premium':
            bestRate = rates.reduce((prev, curr) => {
              const currRate = typeof curr.rate === 'string' ? parseFloat(curr.rate) : curr.rate;
              const prevRate = typeof prev.rate === 'string' ? parseFloat(prev.rate) : prev.rate;
              return currRate > prevRate ? curr : prev;
            });
            break;
          case 'balanced':
            bestRate = rates.reduce((prev, curr) => {
              const currRate = typeof curr.rate === 'string' ? parseFloat(curr.rate) : curr.rate;
              const prevRate = typeof prev.rate === 'string' ? parseFloat(prev.rate) : prev.rate;
              const currRatio = currRate / (curr.delivery_days || 1);
              const prevRatio = prevRate / (prev.delivery_days || 1);
              return currRatio < prevRatio ? curr : prev;
            });
            break;
          default:
            bestRate = rates[0];
        }

        if (bestRate) {
          onSelectRate(shipment.id, bestRate.id);
          processedCount++;
        }
      }
    });

    const optimizationLabels = {
      'cheapest': 'Most Affordable',
      'fastest': 'Fastest Delivery',
      'most_reliable': 'Most Reliable',
      'balanced': 'Balanced Choice',
      'eco_friendly': 'Eco-Friendly',
      '2day': '2-Day Delivery',
      '3day': '3-Day Delivery',
      'premium': 'Premium Service'
    };

    toast.success(`Applied ${optimizationLabels[type] || type} to ${processedCount} shipments`);
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
      value: 100 // Default $100
    };
  };

  // Helper function to calculate insurance cost - dynamic based on declared value
  const calculateInsuranceCost = (declaredValue: number): number => {
    if (declaredValue <= 50) return 1.50;
    if (declaredValue <= 100) return 2.00;
    if (declaredValue <= 200) return 3.50;
    if (declaredValue <= 500) return 7.00;
    return Math.max(7, declaredValue * 0.015); // 1.5% for higher values, minimum $7
  };

  // Helper function to get dynamic discount percentage based on rate
  const getDiscountPercentage = (rate: any): number => {
    if (!rate) return 0;
    const currentRate = typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate;
    
    // Dynamic discount calculation based on carrier and service
    let baseMultiplier = 2.2; // Base markup for discount calculation
    
    // Adjust multiplier based on carrier
    if (rate.carrier === 'USPS') baseMultiplier = 2.8;
    else if (rate.carrier === 'UPS') baseMultiplier = 2.5;
    else if (rate.carrier === 'FedEx') baseMultiplier = 2.6;
    
    // Adjust for service type
    if (rate.service.toLowerCase().includes('express')) baseMultiplier += 0.3;
    else if (rate.service.toLowerCase().includes('ground')) baseMultiplier -= 0.2;
    else if (rate.service.toLowerCase().includes('priority')) baseMultiplier += 0.1;
    
    // Add randomization for more realistic discounts
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const finalMultiplier = baseMultiplier * randomFactor;
    
    const originalRate = currentRate * finalMultiplier;
    return Math.min(85, Math.max(45, Math.round(((originalRate - currentRate) / originalRate) * 100)));
  };

  // Helper function to get dynamic insurance discount
  const getInsuranceDiscountPercentage = (declaredValue: number): number => {
    const standardRate = declaredValue * 0.025; // Standard 2.5% rate
    const ourRate = calculateInsuranceCost(declaredValue);
    if (standardRate <= ourRate) return 0;
    return Math.round(((standardRate - ourRate) / standardRate) * 100);
  };

  const handleEditSubmit = async (shipmentId: string, editedData: any) => {
    // Mark shipment as being edited
    setEditingShipments(prev => new Set([...prev, shipmentId]));
    
    try {
      // Update the shipment details first
      onEditShipment(shipmentId, editedData);
      
      // Close the dialog
      handleCloseEditDialog(shipmentId);
      
      // Show loading toast
      toast.info('Saving changes and refreshing rates...', { duration: 2000 });
      
      // Refresh rates for this specific shipment after a brief delay
      setTimeout(async () => {
        try {
          await onRefreshRates(shipmentId);
          toast.success('Shipment updated and rates refreshed successfully');
        } catch (error) {
          console.error('Error refreshing rates after edit:', error);
          toast.error('Changes saved, but failed to refresh rates');
        } finally {
          // Remove from editing set
          setEditingShipments(prev => {
            const newSet = new Set(prev);
            newSet.delete(shipmentId);
            return newSet;
          });
        }
      }, 500);
    } catch (error) {
      console.error('Error handling edit submission:', error);
      toast.error('Failed to update shipment');
      setEditingShipments(prev => {
        const newSet = new Set(prev);
        newSet.delete(shipmentId);
        return newSet;
      });
    }
  };

  // Enhanced AI Rate Picker as Dropdown
  const AIRatePickerDropdown = () => (
    <Card className="mb-6 border-2 border-purple-200 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">AI Smart Rate Selection</h3>
              <p className="text-purple-700 text-sm">Apply intelligent optimization to all shipments</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Brain className="w-4 h-4 mr-2" />
                AI Optimize
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-white border-2 border-purple-200 shadow-xl z-50">
              <DropdownMenuItem onClick={() => handleBulkOptimization('cheapest')} className="hover:bg-green-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">Most Affordable</div>
                    <div className="text-xs text-green-600">Select lowest cost rates</div>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleBulkOptimization('fastest')} className="hover:bg-red-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Zap className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium text-red-800">Fastest Delivery</div>
                    <div className="text-xs text-red-600">Prioritize delivery speed</div>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleBulkOptimization('most_reliable')} className="hover:bg-blue-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-800">Most Reliable</div>
                    <div className="text-xs text-blue-600">Choose trusted carriers</div>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleBulkOptimization('balanced')} className="hover:bg-purple-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Star className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-800">Balanced Choice</div>
                    <div className="text-xs text-purple-600">Best price-speed ratio</div>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleBulkOptimization('eco_friendly')} className="hover:bg-emerald-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-emerald-800">Eco-Friendly</div>
                    <div className="text-xs text-emerald-600">Ground shipping options</div>
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleBulkOptimization('2day')} className="hover:bg-orange-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium text-orange-800">2-Day Delivery</div>
                    <div className="text-xs text-orange-600">Target 2-day shipping</div>
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleBulkOptimization('3day')} className="hover:bg-indigo-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="font-medium text-indigo-800">3-Day Delivery</div>
                    <div className="text-xs text-indigo-600">Target 3-day shipping</div>
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleBulkOptimization('premium')} className="hover:bg-yellow-50 cursor-pointer">
                <div className="flex items-center space-x-3 w-full p-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-medium text-yellow-800">Premium Service</div>
                    <div className="text-xs text-yellow-600">Highest service level</div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Enhanced AI Rate Picker */}
      <AIRatePickerDropdown />

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
                  <TableHead className="w-1/12 font-semibold text-blue-900">Custom Clearance</TableHead>
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
                  const isEditing = editingShipments.has(shipment.id);
                  const isInternational = isInternationalShipment(shipment);
                  const hasCustomsInfo = customsInfo[shipment.id];
                  
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
                          <div className={`text-xs px-2 py-1 rounded inline-block ${isInternational ? 'text-orange-600 bg-orange-100' : 'text-gray-500 bg-gray-100'}`}>
                            {isInternational && <Globe className="w-3 h-3 inline mr-1" />}
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
                              disabled={shipment.status === 'pending_rates' || isEditing}
                            >
                              <SelectTrigger className="min-w-[280px] h-auto border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder={
                                  isEditing ? "🔄 Updating rates..." :
                                  shipment.status === 'pending_rates' 
                                    ? "🔄 Fetching rates..." 
                                    : "Select a carrier"
                                } />
                              </SelectTrigger>
                              <SelectContent className="min-w-[320px] bg-white border-2 border-gray-200 shadow-xl z-50">
                                {(shipment.availableRates || []).map(rate => {
                                  const standardizedCarrier = standardizeCarrierName(rate.carrier);
                                  const discountPercent = getDiscountPercentage(rate);
                                  const currentRatePrice = parseFloat(formatRate(rate.rate));
                                  const originalPrice = (currentRatePrice * (1 + discountPercent / 100));
                                  
                                  return (
                                    <SelectItem key={rate.id} value={rate.id} className="p-0">
                                      <div className="flex items-start space-x-4 w-full p-4 hover:bg-blue-50 rounded-lg">
                                        <CarrierLogo carrier={standardizedCarrier} className="w-10 h-10 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-3">
                                              <span className="text-base font-bold text-gray-900">
                                                {standardizedCarrier}
                                              </span>
                                              {rate.delivery_days && (
                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-1">
                                                  {rate.delivery_days} days
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          
                                          <div className="text-sm text-gray-600 mb-3">
                                            {rate.service}
                                          </div>
                                          
                                          <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                              <div className="text-xs text-gray-400 line-through">
                                                Was ${originalPrice.toFixed(2)}
                                              </div>
                                              <div className="text-xl font-bold text-green-600">
                                                ${formatRate(rate.rate)}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                                Save {discountPercent}%
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            
                            {/* AI Analysis Button */}
                            {selectedRate && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAIAnalysis(shipment)}
                                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                              >
                                <Brain className="w-4 h-4 mr-2" />
                                AI Analysis
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <X className="w-3 h-3 mr-1" />
                            {shipment.error || 'Error loading rates'}
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-800">Package Protection</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={insurance.enabled}
                                onChange={(e) => handleInsuranceToggle(shipment.id, e.target.checked)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          {insurance.enabled ? (
                            <div className="space-y-3">
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center space-x-2 mb-2">
                                  <DollarSign className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm text-gray-700 font-medium">Declare Value</span>
                                </div>
                                <input
                                  type="number"
                                  value={insurance.value}
                                  onChange={(e) => handleDeclaredValueChange(shipment.id, parseFloat(e.target.value) || 100)}
                                  className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="100"
                                  min="1"
                                  step="1"
                                />
                              </div>
                              
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-green-800">Protection Cost</span>
                                  <span className="text-lg font-bold text-green-700">${insuranceCost.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Standard: ${(insurance.value * 0.025).toFixed(2)}</span>
                                  <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded">
                                    Save {getInsuranceDiscountPercentage(insurance.value)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <div className="text-sm text-gray-500 mb-1">No protection selected</div>
                              <div className="text-xs text-blue-600 font-medium">Click toggle to add protection</div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {shipment.status !== 'pending_rates' && shipment.selectedRateId && selectedRate && !isEditing ? (
                          <div className="space-y-2">
                            <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">Shipping:</span>
                                  <span className="font-semibold text-gray-900">${formatRate(selectedRate.rate)}</span>
                                </div>
                                {insurance.enabled && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-blue-600">Protection:</span>
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
                        ) : (shipment.status === 'pending_rates' || isEditing) ? (
                          <div className="flex flex-col items-center space-y-2">
                            <Skeleton className="h-16 w-20" />
                            <div className="text-xs text-blue-600">
                              {isEditing ? 'Updating...' : 'Loading...'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isEditing ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                            Updating
                          </Badge>
                        ) : ['completed', 'rate_selected', 'rates_fetched', 'label_purchased'].includes(shipment.status) ? (
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

                      <TableCell>
                        <CustomsClearanceButton
                          shipment={shipment}
                          customsInfo={customsInfo[shipment.id]}
                          onCustomsInfoSave={(info) => handleCustomsInfoSave(shipment.id, info)}
                        />
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
                                disabled={isEditing}
                              >
                                {isEditing ? (
                                  <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4 mr-1" />
                                )}
                                {isEditing ? 'Updating' : 'Edit'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Customer & Shipment Details</DialogTitle>
                              </DialogHeader>
                              <ShipmentEditForm 
                                shipment={shipment} 
                                onSubmit={(data) => handleEditSubmit(shipment.id, data)}
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
          Save & Refresh Rates
        </Button>
      </div>
    </form>
  );
};

export default BulkShipmentsList;
