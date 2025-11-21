import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Brain,
  X,
  Sparkles,
  DollarSign,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";
import CarrierLogo from "./CarrierLogo";
import { useToast } from "@/hooks/use-toast";

interface EnhancedRateFilterWithAIProps {
  filters: {
    search: string;
    carriers: string[];
    maxPrice?: number;
    maxDays?: number;
    minPrice?: number;
    features: string[];
    sortBy: "price" | "speed" | "carrier" | "reliability";
    sortOrder: "asc" | "desc";
    selectedCarrier: string;
  };
  availableCarriers: string[];
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  onAIPoweredAnalysis: () => void;
  rateCount: number;
  aiEnabled?: boolean;
}

const EnhancedRateFilterWithAI: React.FC<EnhancedRateFilterWithAIProps> = ({
  filters,
  availableCarriers,
  onFiltersChange,
  onClearFilters,
  onAIPoweredAnalysis,
  rateCount,
  aiEnabled = true,
}) => {
  const { toast } = useToast();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([filters.minPrice || 0, filters.maxPrice || 100]);
  const [daysRange, setDaysRange] = useState<number>(filters.maxDays || 7);

  // Quick optimization options - same as batch and AI Overview
  const OPTIMIZATION_OPTIONS = [
    { id: "cheapest", label: "Cheapest", icon: "💰", color: "bg-green-100 text-green-800" },
    { id: "fastest", label: "Fastest", icon: "⚡", color: "bg-yellow-100 text-yellow-800" },
    { id: "balanced", label: "Most Efficient", icon: "✅", color: "bg-blue-100 text-blue-800" },
    { id: "door-delivery", label: "Door Delivery", icon: "📦", color: "bg-purple-100 text-purple-800" },
    { id: "po-box", label: "PO Box Delivery", icon: "📫", color: "bg-indigo-100 text-indigo-800" },
    { id: "eco-friendly", label: "Eco Friendly", icon: "🌱", color: "bg-green-100 text-green-800" },
    { id: "2-day", label: "2-Day Delivery", icon: "🕓", color: "bg-orange-100 text-orange-800" },
    { id: "express", label: "Express Delivery", icon: "🚀", color: "bg-red-100 text-red-800" },
    { id: "most-reliable", label: "Most Reliable", icon: "🛡️", color: "bg-gray-100 text-gray-800" },
    { id: "ai-recommended", label: "AI Recommended", icon: "🧠", color: "bg-pink-100 text-pink-800" },
  ];

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleCarrierChange = (carrier: string) => {
    onFiltersChange({ ...filters, selectedCarrier: carrier });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
    });
  };

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]]);
    onFiltersChange({
      ...filters,
      minPrice: value[0],
      maxPrice: value[1],
    });
  };

  const handleDaysChange = (value: number[]) => {
    setDaysRange(value[0]);
    onFiltersChange({
      ...filters,
      maxDays: value[0],
    });
  };

  const handleFeatureToggle = (feature: string) => {
    const updatedFeatures = filters.features.includes(feature)
      ? filters.features.filter((f) => f !== feature)
      : [...filters.features, feature];
    onFiltersChange({ ...filters, features: updatedFeatures });
  };

  const handleQuickOptimization = (optimizationType: string) => {
    let updatedFilters = { ...filters };

    switch (optimizationType) {
      case "cheapest":
        updatedFilters = { ...updatedFilters, sortBy: "price", sortOrder: "asc" };
        break;
      case "fastest":
        updatedFilters = { ...updatedFilters, sortBy: "speed", sortOrder: "asc" };
        break;
      case "most-reliable":
        updatedFilters = { ...updatedFilters, sortBy: "reliability", sortOrder: "desc" };
        break;
      case "balanced":
        updatedFilters = { ...updatedFilters, sortBy: "price", sortOrder: "asc", features: ["Tracking"] };
        break;
      case "door-delivery":
        updatedFilters = { ...updatedFilters, features: [...updatedFilters.features, "Dropoff"] };
        break;
      case "po-box":
        updatedFilters = { ...updatedFilters, features: [...updatedFilters.features, "Dropoff"] };
        break;
      case "eco-friendly":
        updatedFilters = { ...updatedFilters, sortBy: "speed", sortOrder: "desc" };
        break;
      case "2-day":
        updatedFilters = { ...updatedFilters, maxDays: 2, sortBy: "price", sortOrder: "asc" };
        break;
      case "express":
        updatedFilters = {
          ...updatedFilters,
          features: [...updatedFilters.features, "Express"],
          sortBy: "speed",
          sortOrder: "asc",
        };
        break;
      case "ai-recommended":
        onAIPoweredAnalysis();
        return;
    }

    onFiltersChange(updatedFilters);
    toast({
      title: "Filter Applied",
      description: `Showing ${OPTIMIZATION_OPTIONS.find((o) => o.id === optimizationType)?.label || optimizationType} rates`,
    });
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.selectedCarrier && filters.selectedCarrier !== "all" ? 1 : 0) +
    (filters.maxPrice && filters.maxPrice < 100 ? 1 : 0) +
    (filters.minPrice && filters.minPrice > 0 ? 1 : 0) +
    (filters.maxDays && filters.maxDays < 7 ? 1 : 0) +
    filters.features.length;

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          Filter & Sort Rates
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search carriers or services..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-9 text-sm border-gray-300 focus:border-blue-500"
          />
        </div>

        {/* Carrier Dropdown */}
        <Select value={filters.selectedCarrier || "all"} onValueChange={handleCarrierChange}>
          <SelectTrigger className="w-44 h-10 border-gray-300">
            <SelectValue>
              <div className="flex items-center gap-2">
                {!filters.selectedCarrier || filters.selectedCarrier === "all" ? (
                  "All Carriers"
                ) : (
                  <>
                    <CarrierLogo carrier={filters.selectedCarrier} className="w-4 h-4" />
                    {filters.selectedCarrier.toUpperCase()}
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="all">All Carriers</SelectItem>
            {availableCarriers.map((carrier) => (
              <SelectItem key={carrier} value={carrier}>
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={carrier} className="w-4 h-4" />
                  {carrier.toUpperCase()}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Controls */}
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-36 h-10 border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="speed">Speed</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
            <SelectItem value="reliability">Reliability</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleSortOrderToggle} className="h-10 px-3 border-gray-300">
          {filters.sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>

        {/* Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 border-gray-300">
              <Filter className="h-4 w-4 mr-1" />
              Advanced
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs bg-blue-100 text-blue-800">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white z-50" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Price Range ($)</label>
                <div className="flex items-center gap-3 mb-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => handlePriceRangeChange([parseFloat(e.target.value), priceRange[1]])}
                    className="w-20 h-8 text-sm"
                    min="0"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => handlePriceRangeChange([priceRange[0], parseFloat(e.target.value)])}
                    className="w-20 h-8 text-sm"
                    min="0"
                  />
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

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

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Features</label>
                <div className="space-y-2">
                  {["Express", "Insurance", "Tracking", "Signature", "Weekend", "Pickup", "Dropoff"].map((feature) => (
                    <Button
                      key={feature}
                      variant={filters.features.includes(feature) ? "default" : "outline"}
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

        {/* Quick Optimization Dropdown - Same as batch label creation */}
        <Select onValueChange={handleQuickOptimization}>
          <SelectTrigger className="w-48 h-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <SelectValue placeholder="Quick Options" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-2 shadow-lg z-50">
            {OPTIMIZATION_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* AI Powered Analysis Button */}
        <Button onClick={onAIPoweredAnalysis} variant="default" className="h-10 px-4 flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <Sparkles className="w-3 h-3" />
          AI Analysis
        </Button>
      </div>

      {/* Results Count and Active Filters */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Showing {rateCount} rate{rateCount !== 1 ? "s" : ""}
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active
            </Badge>
          )}
        </div>

        {filters.sortBy !== "price" && (
          <span className="text-xs text-gray-500">
            Sorted by: <span className="font-medium capitalize">{filters.sortBy}</span>
          </span>
        )}
      </div>
    </div>
  );
};
export default EnhancedRateFilter;
