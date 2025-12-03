import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Search, SortAsc, SortDesc, Filter, Zap, X, Sparkles, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CarrierLogo from "../CarrierLogo";

// Extended carrier options
const EXTENDED_CARRIER_OPTIONS = [
  {
    id: "usps",
    name: "USPS",
    services: [
      { id: "first_class", name: "First Class" },
      { id: "priority", name: "Priority Mail" },
      { id: "priority_express", name: "Priority Express" },
      { id: "ground_advantage", name: "Ground Advantage" },
      { id: "media_mail", name: "Media Mail" },
    ],
  },
  {
    id: "ups",
    name: "UPS",
    services: [
      { id: "ground", name: "Ground" },
      { id: "next_day_air", name: "Next Day Air" },
      { id: "next_day_air_saver", name: "Next Day Air Saver" },
      { id: "2nd_day_air", name: "2nd Day Air" },
      { id: "3_day_select", name: "3 Day Select" },
    ],
  },
  {
    id: "fedex",
    name: "FedEx",
    services: [
      { id: "ground", name: "Ground" },
      { id: "express_saver", name: "Express Saver" },
      { id: "2day", name: "2Day" },
      { id: "standard_overnight", name: "Standard Overnight" },
      { id: "priority_overnight", name: "Priority Overnight" },
    ],
  },
  {
    id: "dhl",
    name: "DHL",
    services: [
      { id: "express", name: "Express" },
      { id: "express_worldwide", name: "Express Worldwide" },
      { id: "economy_select", name: "Economy Select" },
    ],
  },
  {
    id: "canada_post",
    name: "Canada Post",
    services: [
      { id: "regular_parcel", name: "Regular Parcel" },
      { id: "expedited_parcel", name: "Expedited Parcel" },
      { id: "xpresspost", name: "Xpresspost" },
      { id: "priority", name: "Priority" },
    ],
  },
  {
    id: "purolator",
    name: "Purolator",
    services: [
      { id: "ground", name: "Ground" },
      { id: "express", name: "Express" },
      { id: "express_9am", name: "Express 9AM" },
      { id: "express_1030am", name: "Express 10:30AM" },
    ],
  },
];

// Optimization options for the Quick Change Dropdown
const OPTIMIZATION_OPTIONS = [
  { id: "cheapest", label: "Cheapest", icon: "💰", color: "text-green-700" },
  { id: "fastest", label: "Fastest", icon: "⚡", color: "text-yellow-700" },
  { id: "balanced", label: "Most Efficient", icon: "✅", color: "text-blue-700" },
  { id: "door-delivery", label: "Door Delivery", icon: "📦", color: "text-purple-700" },
  { id: "po-box", label: "PO Box Delivery", icon: "📫", color: "text-indigo-700" },
  { id: "eco-friendly", label: "Eco Friendly", icon: "🌱", color: "text-green-700" },
  { id: "2-day", label: "2-Day Delivery", icon: "🕓", color: "text-orange-700" },
  { id: "express", label: "Express Delivery", icon: "🚀", color: "text-red-700" },
  { id: "most-reliable", label: "Most Reliable", icon: "🛡️", color: "text-gray-700" },
  { id: "ai-recommended", label: "AI Recommended", icon: "🧠", color: "text-pink-700" },
];

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField: "recipient" | "rate" | "carrier";
  sortDirection: "asc" | "desc";
  onSortChange: (field: "recipient" | "rate" | "carrier", direction: "asc" | "desc") => void;
  selectedCarrier: string;
  onCarrierFilterChange: (carrier: string) => void;
  onApplyCarrierToAll: (carrier: string, service?: string) => void;
  onQuickOptimization?: (filterId: string) => void;
  // New Optional Props for Advanced Filtering
  onAdvancedFilterChange?: (filters: {
    minPrice: number;
    maxPrice: number;
    maxDays: number;
    features: string[];
  }) => void;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  selectedCarrier,
  onCarrierFilterChange,
  onApplyCarrierToAll,
  onQuickOptimization,
  onAdvancedFilterChange,
}) => {
  const [selectedBulkCarrier, setSelectedBulkCarrier] = useState<string>("");
  const [selectedBulkService, setSelectedBulkService] = useState<string>("");

  // --- Advanced Filter State (from EnhancedRateFilterWithAI) ---
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [daysRange, setDaysRange] = useState<number>(7);
  const [features, setFeatures] = useState<string[]>([]);

  // Handle applying bulk carrier/service to all rows
  const handleApplyToAll = () => {
    if (selectedBulkCarrier && selectedBulkService) {
      const carrier = EXTENDED_CARRIER_OPTIONS.find((c) => c.id === selectedBulkCarrier);
      const service = carrier?.services.find((s) => s.id === selectedBulkService);

      if (carrier && service) {
        onApplyCarrierToAll(carrier.name, service.name);
      }
    }
  };

  const handleBulkCarrierChange = (carrierId: string) => {
    setSelectedBulkCarrier(carrierId);
    setSelectedBulkService("");
  };

  // --- Advanced Filter Handlers ---
  const handlePriceRangeChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);
    triggerAdvancedUpdate(newRange, daysRange, features);
  };

  const handleDaysChange = (value: number[]) => {
    const newDays = value[0];
    setDaysRange(newDays);
    triggerAdvancedUpdate(priceRange, newDays, features);
  };

  const handleFeatureToggle = (feature: string) => {
    const updatedFeatures = features.includes(feature) ? features.filter((f) => f !== feature) : [...features, feature];
    setFeatures(updatedFeatures);
    triggerAdvancedUpdate(priceRange, daysRange, updatedFeatures);
  };

  const triggerAdvancedUpdate = (pRange: [number, number], dRange: number, feats: string[]) => {
    if (onAdvancedFilterChange) {
      onAdvancedFilterChange({
        minPrice: pRange[0],
        maxPrice: pRange[1],
        maxDays: dRange,
        features: feats,
      });
    }
  };

  const handleClearAll = () => {
    onSearchChange("");
    onCarrierFilterChange("");
    // Reset Advanced
    setPriceRange([0, 100]);
    setDaysRange(7);
    setFeatures([]);
    triggerAdvancedUpdate([0, 100], 7, []);
  };

  // Calculate active filters count including advanced options
  const activeFiltersCount =
    (searchTerm ? 1 : 0) +
    (selectedCarrier && selectedCarrier !== "" ? 1 : 0) +
    (priceRange[1] < 100 || priceRange[0] > 0 ? 1 : 0) +
    (daysRange < 7 ? 1 : 0) +
    features.length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 space-y-4">
      {/* --- Header Section --- */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Filter & Sort Rates
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* --- Main Controls Row --- */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* 1. Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search carriers, services, or recipients..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10 text-sm border-gray-300 focus:border-blue-500"
          />
        </div>

        {/* 2. Carrier Filter - Uses carrier NAME for proper filtering */}
        <Select
          value={selectedCarrier || "all"}
          onValueChange={(value) => onCarrierFilterChange(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[160px] h-10 border-gray-300">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">
              <span className="font-medium">All Carriers</span>
            </SelectItem>
            {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
              <SelectItem key={carrier.id} value={carrier.name}>
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={carrier.name} className="h-4 w-auto" />
                  {carrier.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 3. NEW: Advanced Filter Popover (Implemented from EnhancedRateFilterWithAI) */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-10 border-gray-300 bg-white text-gray-700">
              <Filter className="h-4 w-4 mr-1" />
              Advanced
              {(features.length > 0 || daysRange < 7 || priceRange[1] < 100) && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-blue-100 text-blue-800">
                  {features.length + (daysRange < 7 ? 1 : 0) + (priceRange[1] < 100 ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white z-50" align="end">
            <div className="space-y-4">
              {/* Price Range */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Price Range ($)</label>
                <div className="flex items-center gap-3 mb-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceRangeChange([parseFloat(e.target.value) || 0, priceRange[1]])}
                    className="w-20 h-8 text-sm"
                    min="0"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange([priceRange[0], parseFloat(e.target.value) || 100])}
                    className="w-20 h-8 text-sm"
                    min="0"
                  />
                </div>
                <Slider
                  value={[priceRange[0], priceRange[1]]}
                  onValueChange={handlePriceRangeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Max Delivery Days */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Max Delivery Days: {daysRange}</label>
                <Slider
                  value={[daysRange]}
                  onValueChange={handleDaysChange}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Features */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Features</label>
                <div className="space-y-2">
                  {["Express", "Insurance", "Tracking", "Signature", "Weekend"].map((feature) => (
                    <Button
                      key={feature}
                      variant={features.includes(feature) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFeatureToggle(feature)}
                      className="w-full justify-start"
                    >
                      {feature}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 4. Quick Change Dropdown */}
        <Select onValueChange={(val) => onQuickOptimization?.(val)}>
          <SelectTrigger className="w-[180px] h-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <SelectValue placeholder="Quick Change" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-2 shadow-lg z-50">
            <SelectGroup>
              <SelectLabel className="text-xs text-gray-500 uppercase tracking-wider font-semibold px-2 py-1">
                Quick Change
              </SelectLabel>
              {OPTIMIZATION_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span className={option.color}>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* 5. Sort Controls */}
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(value: any) => onSortChange(value, sortDirection)}>
            <SelectTrigger className="w-[130px] h-10 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recipient">Recipient</SelectItem>
              <SelectItem value="rate">Price</SelectItem>
              <SelectItem value="carrier">Carrier</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")}
            className="h-10 w-10 border-gray-300 hover:bg-gray-50"
          >
            {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* --- Bulk Apply Action Section --- */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-2 bg-gray-50/50 p-3 rounded-md">
        <div className="text-sm font-medium text-gray-600 mr-auto">Bulk Actions:</div>

        <Select value={selectedBulkCarrier} onValueChange={handleBulkCarrierChange}>
          <SelectTrigger className="w-[160px] h-9 bg-white">
            <SelectValue placeholder="Select Carrier" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Carriers</SelectLabel>
              {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={selectedBulkService} onValueChange={setSelectedBulkService} disabled={!selectedBulkCarrier}>
          <SelectTrigger className="w-[160px] h-9 bg-white">
            <SelectValue placeholder="Select Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Available Services</SelectLabel>
              {EXTENDED_CARRIER_OPTIONS.find((c) => c.id === selectedBulkCarrier)?.services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button
          onClick={handleApplyToAll}
          disabled={!selectedBulkCarrier || !selectedBulkService}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 shadow-sm"
        >
          Apply to All Rows
        </Button>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;
