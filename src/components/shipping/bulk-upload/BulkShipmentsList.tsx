import React, { useState, useEffect } from "react";
import { BulkShipment } from "@/types/shipping";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, PackageCheck, Edit, RefreshCcw, X, FileText, Truck, ArrowUp, ArrowDown, Check, Shield, DollarSign, ChevronDown, Brain, Zap, Star, Globe, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { formatWeightDisplay } from "@/utils/weightConversion";
import InsuranceOptions from "./InsuranceOptions";
import AIRatePicker from "./AIRatePicker";
import RateDisplay from "./RateDisplay";
import CarrierLogo from "../CarrierLogo";
import { toast } from "@/components/ui/sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import CustomsClearanceButton from "./CustomsClearanceButton";
import { standardizeCarrierName } from "@/utils/carrierUtils";
import { computeDiscountPercent } from "@/utils/discount";

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
  onEditShipment: (shipmentId: string, updates: Partial<BulkShipment>) => void;
  onRefreshRates: (shipmentId: string) => void;
  onAIAnalysis: (shipment?: any) => void;
  // ** New Prop for adding a shipment (optional) **
  onAddShipment?: (newShipmentDetails: any) => void;
}

// ** Placeholder component for the Add Shipment Dialog/Modal **
// You will need to implement the actual logic for capturing shipment details here.
const AddShipmentDialog: React.FC<{ onSave: (details: any) => void; children: React.ReactNode }> = ({ onSave, children }) => {
  const [open, setOpen] = useState(false);
  const form = useForm({
    // Define your form schema/default values here
    defaultValues: {
      // Example fields, replace with actual BulkShipment fields
      to_name: "",
      to_street1: "",
      weight: 16, // Default to 1lb/16oz
      length: 10,
      width: 10,
      height: 10,
    },
  });

  const onSubmit = (data: any) => {
    // Simulate packaging into the structure expected by onAddShipment (often just the details object)
    onSave(data);
    form.reset();
    setOpen(false);
    toast.success("New shipment details submitted!");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>📦 Add a New Shipment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter the basic details for your new shipment.
            </p>
            {/* ** IMPORTANT: You must replace these fields with the full required form fields for a BulkShipment 'details' object ** */}
            <FormField
              control={form.control}
              name="to_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (oz)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="16" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Add Shipment
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
// ** End of Add Shipment Dialog Placeholder **

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  shipments,
  isFetchingRates,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onRefreshRates,
  onAIAnalysis,
  onAddShipment, // ** New Prop **
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
    if (urlParams.get("payment_success") === "true") {
      window.location.reload();
    }
  }, []);

  // Initialize insurance settings for all shipments when they load
  useEffect(() => {
    if (shipments && shipments.length > 0) {
      const newInsuranceSettings: Record<string, {
        enabled: boolean;
        value: number;
      }> = {};
      let hasChanges = false;
      shipments.forEach(shipment => {
        if (!insuranceSettings[shipment.id]) {
          const enabled = shipment.details?.insurance_enabled !== false;
          const value = shipment.details?.declared_value || 100;
          newInsuranceSettings[shipment.id] = {
            enabled,
            value
          };
          hasChanges = true;

          // Calculate and update insurance cost immediately - ensure 0 when disabled
          const cost = calculateInsuranceCost(value, enabled);
          if (shipment.insurance_cost !== cost) {
            onEditShipment(shipment.id, {
              insurance_cost: cost,
              details: {
                ...shipment.details,
                insurance_enabled: enabled,
                declared_value: value
              }
            });
          }
        }
      });
      if (hasChanges) {
        setInsuranceSettings(prev => ({
          ...prev,
          ...newInsuranceSettings
        }));
      }
    }
  }, [shipments.length, insuranceSettings, onEditShipment]);
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

    // Persist customs info into the shipment details so backend receives it
    const target = shipments.find(s => s.id === shipmentId);
    if (target && target.details) {
      onEditShipment(shipmentId, {
        details: {
          ...target.details,
          customs_info: info as any // Use type assertion to bypass strict typing for now
        }
      });
    }
    toast.success("Customs information saved successfully");
  };

  // Check if shipment is international (non-US)
  const isInternationalShipment = (shipment: BulkShipment): boolean => {
    const country = shipment.details.to_country?.toUpperCase();
    return country !== "US" && country !== "USA" && country !== "UNITED STATES";
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
    const rates = allRates.map(r => parseFloat(r.rate || "0")).sort((a, b) => a - b);
    const currentRate = parseFloat(rate.rate || "0");
    const costPercentile = rates.indexOf(currentRate) / rates.length;
    scores.cost = Math.max(1, Math.round((1 - costPercentile) * 5));

    // Speed score (25%)
    const deliveryDays = rate.delivery_days || 7;
    scores.speed = deliveryDays <= 1 ? 5 : deliveryDays <= 2 ? 4 : deliveryDays <= 3 ? 3 : deliveryDays <= 5 ? 2 : 1;

    // Reliability score (20%)
    const reliabilityMap = {
      USPS: 4,
      UPS: 5,
      FedEx: 5,
      DHL: 4
    };
    scores.reliability = reliabilityMap[rate.carrier] || 3;

    // Eco-friendly score (15%)
    scores.ecoFriendly = rate.service.toLowerCase().includes("ground") ? 5 : rate.service.toLowerCase().includes("standard") ? 4 : rate.service.toLowerCase().includes("express") ? 2 : 3;

    // Insurance coverage score (10%)
    scores.insurance = rate.carrier === "UPS" || rate.carrier === "FedEx" ? 5 : rate.carrier === "USPS" ? 4 : 3;
    return scores;
  };
  const handleBulkOptimization = (type: string) => {
    let processedCount = 0;
    shipments.forEach(shipment => {
      if (shipment.availableRates && shipment.availableRates.length > 0) {
        let bestRate;
        const rates = shipment.availableRates;
        switch (type) {
          case "cheapest":
            bestRate = rates.reduce((prev, curr) => {
              const currRate = typeof curr.rate === "string" ? parseFloat(curr.rate) : curr.rate;
              const prevRate = typeof prev.rate === "string" ? parseFloat(prev.rate) : prev.rate;
              return currRate < prevRate ? curr : prev;
            });
            break;
          case "fastest":
            bestRate = rates.reduce((prev, curr) => (curr.delivery_days || 999) < (prev.delivery_days || 999) ? curr : prev);
            break;
          case "most_reliable":
            bestRate = rates.find(r => r.carrier === "UPS") || rates.find(r => r.carrier === "FedEx") || rates.find(r => r.carrier === "USPS") || rates[0];
            break;
          case "eco_friendly":
            bestRate = rates.find(r => r.service.toLowerCase().includes("ground")) || rates[0];
            break;
          case "2day":
            bestRate = rates.find(rate => rate.delivery_days === 2) || rates.reduce((prev, curr) => Math.abs((curr.delivery_days || 999) - 2) < Math.abs((prev.delivery_days || 999) - 2) ? curr : prev);
            break;
          case "3day":
            bestRate = rates.find(rate => rate.delivery_days === 3) || rates.reduce((prev, curr) => Math.abs((curr.delivery_days || 999) - 3) < Math.abs((prev.delivery_days || 999) - 3) ? curr : prev);
            break;
          case "premium":
            bestRate = rates.reduce((prev, curr) => {
              const currRate = typeof curr.rate === "string" ? parseFloat(curr.rate) : curr.rate;
              const prevRate = typeof prev.rate === "string" ? parseFloat(prev.rate) : prev.rate;
              return currRate > prevRate ? curr : prev;
            });
            break;
          case "balanced":
            bestRate = rates.reduce((prev, curr) => {
              const currRate = typeof curr.rate === "string" ? parseFloat(curr.rate) : curr.rate;
              const prevRate = typeof prev.rate === "string" ? parseFloat(prev.rate) : prev.rate;
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
      cheapest: "Most Affordable",
      fastest: "Fastest Delivery",
      most_reliable: "Most Reliable",
      balanced: "Balanced Choice",
      eco_friendly: "Eco-Friendly",
      "2day": "2-Day Delivery",
      "3day": "3-Day Delivery",
      premium: "Premium Service"
    };
    toast.success(`Applied ${optimizationLabels[type] || type} to ${processedCount} shipments`);
  };

  // Helper function to safely format rate as number
  const formatRate = (rate: string | number | undefined): string => {
    if (!rate) return "0.00";
    const numRate = typeof rate === "string" ? parseFloat(rate) : rate;
    return isNaN(numRate) ? "0.00" : numRate.toFixed(2);
  };

  // Helper function to get insurance settings with defaults
  const getInsuranceSettings = (shipmentId: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    const enabled = shipment?.details?.insurance_enabled !== false;
    const value = shipment?.details?.declared_value || 100;
    return insuranceSettings[shipmentId] || {
      enabled,
      value
    };
  };

  // Insurance calculation: Exactly $2 per $100 of declared value (rounds up to nearest $100)
  const calculateInsuranceCost = (declaredValue: number, enabled: boolean = true): number => {
    // When insurance is disabled, backend should receive 0
    if (!enabled || declaredValue <= 0) return 0;
    // Round up to nearest $100, then multiply by $2
    return Math.ceil(declaredValue / 100) * 2;
  };

  // Helper function to get REAL discount percentage from API rates (clamped 60-90%)
  const getDiscountPercentage = (rate: any): number => {
    if (!rate) return 0;
    const currentRate = typeof rate.rate === "string" ? parseFloat(rate.rate) : rate.rate;
    const originalRate = rate.original_rate || rate.retail_rate || rate.list_rate;
    const parsedOriginal = typeof originalRate === "string" ? parseFloat(originalRate) : originalRate;
    if (!parsedOriginal || parsedOriginal <= currentRate) return 0;
    return computeDiscountPercent(parsedOriginal, currentRate, {
      clampMin: 60,
      clampMax: 90
    });
  };

  // Helper function to get insurance discount (removed - no discount shown)
  const getInsuranceDiscountPercentage = (declaredValue: number): number => {
    return 0; // No discount display for insurance
  };
  const handleEditSubmit = async (shipmentId: string, editedData: any) => {
    // Mark shipment as being edited
    setEditingShipments(prev => new Set([...prev, shipmentId]));
    try {
      // Update the shipment details first
      onEditShipment(shipmentId, {
        details: editedData
      });

      // Close the dialog
      handleCloseEditDialog(shipmentId);

      // Show loading toast
      toast.info("Saving changes and refreshing rates...", {
        duration: 2000
      });

      // Refresh rates for this specific shipment after a brief delay
      setTimeout(async () => {
        try {
          await onRefreshRates(shipmentId);
          toast.success("Shipment updated and rates refreshed successfully");
        } catch (error) {
          console.error("Error refreshing rates after edit:", error);
          toast.error("Changes saved, but failed to refresh rates");
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
      console.error("Error handling edit submission:", error);
      toast.error("Failed to update shipment");
      setEditingShipments(prev => {
        const newSet = new Set(prev);
        newSet.delete(shipmentId);
        return newSet;
      });
    }
  };

  // Enhanced AI Rate Picker as Dropdown
  const AIRatePickerDropdown = () => null;
  return <div className="space-y-4">
      {/* Enhanced AI Rate Picker */}
      <AIRatePickerDropdown />

      {shipments.length === 0 ? <Card className="p-6 text-center">
          <p className="text-gray-500">No shipments found. Start by adding one!</p>
        </Card> : <div className="space-y-3">
          {/* Insurance Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-900 font-medium">
              📦 Insurance: For each $100 of declared value, it's $2 (automatically calculated)
            </p>
          </div>

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
                    {/* ** MODIFICATION: New column for Actions/Edit button ** */}
                    <TableHead className="w-1/12 text-center font-semibold text-blue-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...shipments].reverse().map((shipment, index) => {
                const insurance = getInsuranceSettings(shipment.id);
                const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
                const insuranceCost = calculateInsuranceCost(insurance.value, insurance.enabled);
                const shippingCost = selectedRate ? parseFloat(formatRate(selectedRate.rate)) : 0;
                const totalCost = shippingCost + insuranceCost;
                const isEditing = editingShipments.has(shipment.id);
                const isInternational = isInternationalShipment(shipment);
                const hasCustomsInfo = customsInfo[shipment.id];
                return <TableRow key={shipment.id} className={`hover:bg-blue-50/50 transition-colors border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                        <TableCell className="font-medium text-blue-700">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-bold">
                            {shipment.row}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">{shipment.details.to_name}</div>
                            {shipment.details.to_company && <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {shipment.details.to_company}
                              </div>}
                            {shipment.details.to_phone && <div className="text-xs text-blue-600 font-medium">📞 {shipment.details.to_phone}</div>}
                            {shipment.details.to_email && <div className="text-xs text-green-600 font-medium">✉️ {shipment.details.to_email}</div>}
                            {shipment.details.reference && <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                Ref: {shipment.details.reference}
                              </div>}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900">{shipment.details.to_street1}</div>
                            {shipment.details.to_street2 && <div className="text-sm text-gray-600">{shipment.details.to_street2}</div>}
                            <div className="text-sm text-gray-700">
                              {shipment.details.to_city}, {shipment.details.to_state} {shipment.details.to_zip}
                            </div>
                            <div className={`text-xs px-2 py-1 rounded inline-block ${isInternational ? "text-orange-600 bg-orange-100" : "text-gray-500 bg-gray-100"}`}>
                              {isInternational && <Globe className="w-3 h-3 inline mr-1" />}
                              {shipment.details.to_country}
                            </div>
                            <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded inline-block mt-1">
                              📦 {formatWeightDisplay(shipment.details.weight || 16)} • {shipment.details.length}"×
                              {shipment.details.width}"×{shipment.details.height}"
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {shipment.status !== "failed" && shipment.status !== "error" ? <div className="space-y-2">
                              <Select value={shipment.selectedRateId} onValueChange={value => handleRateSelection(shipment.id, value)} disabled={shipment.status === "pending_rates" || isEditing}>
                                <SelectTrigger className="min-w-[280px] h-auto border-2 border-blue-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                  <SelectValue placeholder={isEditing ? "🔄 Updating rates..." : shipment.status === "pending_rates" ? "🔄 Fetching rates..." : "Select a carrier"} />
                                </SelectTrigger>
                                <SelectContent className="min-w-[320px] bg-white border-2 border-gray-200 shadow-xl z-50">
                                  {[...(shipment.availableRates || [])].sort((a, b) => {
                            const ar = typeof a.rate === "string" ? parseFloat(a.rate) : a.rate || 0;
                            const br = typeof b.rate === "string" ? parseFloat(b.rate) : b.rate || 0;
                            return ar - br;
                          }).map(rate => {
                            const standardizedCarrier = standardizeCarrierName(rate.carrier);
                            const discountPercent = getDiscountPercentage(rate);
                            const currentRatePrice = parseFloat(formatRate(rate.rate));
                            const originalPrice = rate.retail_rate || rate.list_rate;
                            const parsedOriginal = originalPrice ? typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice : null;
                            return <SelectItem key={rate.id} value={rate.id} className="p-0">
                                          <div className="flex items-start space-x-4 w-full p-4 hover:bg-blue-50 rounded-lg">
                                            <CarrierLogo carrier={standardizedCarrier} className="w-10 h-10 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                  <span className="text-base font-bold text-gray-900">
                                                    {standardizedCarrier}
                                                  </span>
                                                  {rate.delivery_days && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 px-2 py-1">
                                                      {rate.delivery_days} days
                                                    </Badge>}
                                                </div>
                                              </div>

                                              <div className="text-sm text-gray-600 mb-3">{rate.service}</div>

                                              <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                  {parsedOriginal && discountPercent > 0 && <div className="text-xs text-muted-foreground line-through">
                                                      Was ${parsedOriginal.toFixed(2)}
                                                    </div>}
                                                  <div className="text-xl font-bold text-foreground">
                                                    ${formatRate(rate.rate)}
                                                  </div>
                                                </div>
                                                {discountPercent > 0 && <div className="text-right">
                                                    <div className="text-sm font-semibold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                                                      Save {discountPercent}%
                                                    </div>
                                                  </div>}
                                              </div>
                                            </div>
                                          </div>
                                        </SelectItem>;
                          })}
                                </SelectContent>
                              </Select>

                              {/* AI Analysis Button */}
                              {selectedRate && <Button variant="outline" size="sm" onClick={() => onAIAnalysis(shipment)} className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                                  <Brain className="w-4 h-4 mr-2" />
                                  AI Analysis
                                </Button>}
                            </div> : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <X className="w-3 h-3 mr-1" />
                              {shipment.error || "Error loading rates"}
                            </Badge>}
                        </TableCell>

                        <TableCell>
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">Package Protection</span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={insurance.enabled} onChange={e => {
                            const enabled = e.target.checked;
                            // Local state update
                            handleInsuranceToggle(shipment.id, enabled);
                            // Persist to results so totals include insurance
                            const declared = insurance.value || 0;
                            const cost = calculateInsuranceCost(declared, enabled);
                            onEditShipment(shipment.id, {
                              details: {
                                ...shipment.details,
                                insurance_enabled: enabled,
                                declared_value: declared
                              },
                              insurance_cost: cost
                            } as any);
                          }} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            {insurance.enabled ? <div className="space-y-3">
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Declared Value:</span>
                                  </div>
                                  <Input
                                    type="number"
                                    value={insurance.value}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      // Local state update
                                      handleDeclaredValueChange(shipment.id, val);
                                      // Persist to results so totals include insurance
                                      const cost = calculateInsuranceCost(val, insurance.enabled);
                                      onEditShipment(shipment.id, {
                                        details: {
                                          ...shipment.details,
                                          declared_value: val,
                                          insurance_enabled: true
                                        },
                                        insurance_cost: cost
                                      } as any);
                                    }}
                                    min="0"
                                    placeholder="100"
                                    className="text-right font-mono"
                                  />
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                  <span>Insurance Cost:</span>
                                  <span className="font-semibold text-blue-700">${insuranceCost.toFixed(2)}</span>
                                </div>
                              </div> : <div className="text-sm text-gray-500 text-center py-2">
                                  Insurance Disabled
                              </div>}
                            </div>
                        </TableCell>

                        <TableCell className="text-center font-bold text-lg text-green-700">
                          {isEditing ? <Skeleton className="h-6 w-16 mx-auto" /> :
                            totalCost > 0 ? <div className="space-y-1">
                                <div className="text-xl text-green-700">${totalCost.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">
                                  Shipping: ${shippingCost.toFixed(2)}
                                </div>
                                {insuranceCost > 0 && <div className="text-xs text-blue-500">
                                  Insurance: ${insuranceCost.toFixed(2)}
                                </div>}
                              </div> : <div className="text-sm text-gray-500">N/A</div>
                          }
                        </TableCell>

                        <TableCell className="text-center">
                          {shipment.status === "pending_rates" && <Badge className="bg-indigo-500 hover:bg-indigo-500/90 text-white"><Zap className="w-3 h-3 mr-1 animate-pulse" /> Fetching Rates</Badge>}
                          {shipment.status === "rates_fetched" && !shipment.selectedRateId && <Badge className="bg-blue-200 text-blue-800"><Star className="w-3 h-3 mr-1" /> Rates Ready</Badge>}
                          {shipment.status === "rate_selected" && <Badge className="bg-green-500 hover:bg-green-500/90 text-white"><Check className="w-3 h-3 mr-1" /> Selected</Badge>}
                          {(shipment.status === "error" || shipment.status === "failed") && <Badge className="bg-red-500 hover:bg-red-500/90 text-white"><X className="w-3 h-3 mr-1" /> Error</Badge>}
                          {shipment.status === "label_purchased" && <Badge className="bg-purple-600 hover:bg-purple-600/90 text-white"><Truck className="w-3 h-3 mr-1" /> Label Paid</Badge>}
                          {shipment.status === "completed" && <Badge className="bg-green-600 hover:bg-green-600/90 text-white"><Check className="w-3 h-3 mr-1" /> Completed</Badge>}
                        </TableCell>

                        <TableCell className="text-center">
                          {isInternational ? <CustomsClearanceButton
                            shipment={shipment}
                            customsInfo={shipment.details.customs_info as LocalCustomsInfo}
                            onCustomsInfoSave={(info) => handleCustomsInfoSave(shipment.id, info)}
                          /> : <Badge variant="secondary" className="text-xs">N/A</Badge>}
                        </TableCell>
                        
                        {/* ** MODIFICATION: The New Actions Column Cell ** */}
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDialog(shipment.id)}
                            disabled={isEditing || shipment.status === "label_purchased" || shipment.status === "completed"}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            {isEditing ? <RefreshCcw className="w-4 h-4 mr-1 animate-spin" /> : <Edit className="w-4 h-4 mr-1" />}
                            {isEditing ? "Updating..." : "Edit"}
                          </Button>
                          {/* The full EditShipmentDialog component remains defined elsewhere but is logically triggered here */}
                        </TableCell>
                      </TableRow>
                  })}
                </TableBody>
                
                {/* ** MODIFICATION: The New TableFooter for Add Shipment Button ** */}
                {onAddShipment && (
                <TableFooter className="bg-gray-100 hover:bg-gray-100/90 border-t-2 border-blue-200">
                    <TableRow>
                        {/* Span all columns up to the Actions column (8 columns: Row, Customer, Address, Carrier, Insurance, Rate, Status, Custom Clearance) */}
                        <TableCell colSpan={8} className="text-right font-bold text-gray-800 py-3">
                            {/* Empty cell, but keep the right alignment for visual separation */}
                        </TableCell>
                        
                        {/* The new Actions cell containing the Add Shipment button */}
                        <TableCell className="text-center font-bold text-blue-600 py-3">
                            <AddShipmentDialog onSave={onAddShipment}>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-transform transform hover:scale-[1.01]">
                                    <PlusCircle className="w-5 h-5 mr-2" />
                                    Add a Shipment
                                </Button>
                            </AddShipmentDialog>
                        </TableCell>
                    </TableRow>
                </TableFooter>
                )}
              </Table>
            </Card>
          </div>
        </div>}
    </div>;
};

export default BulkShipmentsList;
