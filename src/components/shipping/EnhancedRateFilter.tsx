import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Search, SortAsc, SortDesc, X, Sparkles } from "lucide-react";
import CarrierLogo from "./CarrierLogo";

interface EnhancedRateFilterProps {
  filters: {
    search: string;
    carriers: string[];
    maxPrice?: number;
    maxDays?: number;
    features: string[];
    sortBy: "price" | "speed" | "carrier" | "reliability";
    sortOrder: "asc" | "desc";
    selectedCarrier: string;
  };
  availableCarriers: string[];
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  rateCount: number;
}

const EnhancedRateFilter: React.FC<EnhancedRateFilterProps> = ({
  filters,
  availableCarriers,
  onFiltersChange,
  onClearFilters,
  rateCount,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSearchChange = (value: string) => {
    setIsAnimating(true);
    onFiltersChange({ ...filters, search: value });
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleCarrierChange = (carrier: string) => {
    setIsAnimating(true);
    onFiltersChange({ ...filters, selectedCarrier: carrier });
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSortChange = (sortBy: string) => {
    setIsAnimating(true);
    onFiltersChange({ ...filters, sortBy });
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleSortOrderToggle = () => {
    setIsAnimating(true);
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
    });
    setTimeout(() => setIsAnimating(false), 200);
  };

  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.selectedCarrier && filters.selectedCarrier !== "all" ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.maxDays ? 1 : 0);

  return (
    <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl shadow-sm border border-gray-200/60 p-5 space-y-4 transition-all duration-300 hover:shadow-md">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Filter & Sort Rates</h3>
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Main Controls Row */}
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
      {/* Enhanced Results Count with Animation */}
      <div
        className={`flex items-center justify-between transition-all duration-300 ${isAnimating ? "opacity-60 scale-95" : "opacity-100 scale-100"}`}
      >
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {rateCount} rate{rateCount !== 1 ? "s" : ""} found
          </div>
          {isAnimating && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          )}
        </div>

        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""} active
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRateFilter;
