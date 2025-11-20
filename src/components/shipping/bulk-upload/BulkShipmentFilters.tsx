import React, { useState } from "react";
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
  selectedCarrier: string | null;
  onCarrierFilterChange: (carrier: string | null) => void;
  onApplyCarrierToAll: (carrier: string, service: string) => void;
  onQuickOptimization?: (filterId: string) => void;
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
}) => {
  const [selectedBulkCarrier, setSelectedBulkCarrier] = useState<string>("");
  const [selectedBulkService, setSelectedBulkService] = useState<string>("");

  const handleApplyToAll = () => {
    if (selectedBulkCarrier && selectedBulkService) {
      const carrier = EXTENDED_CARRIER_OPTIONS.find((c) => c.id === selectedBulkCarrier);
      const service = carrier?.services.find((s) => s.id === selectedBulkService);

      // Passing the Name strings to match Code 1 logic,
      // but we derived them from IDs to ensure accuracy
      if (carrier && service) {
        onApplyCarrierToAll(carrier.name, service.name);
      }
    }
  };

  const handleBulkCarrierChange = (carrierId: string) => {
    setSelectedBulkCarrier(carrierId);
    setSelectedBulkService(""); // Reset service when carrier changes to prevent bugs
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCarrier && selectedCarrier !== "all" ? 1 : 0);

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
            onClick={() => {
              onSearchChange("");
              onCarrierFilterChange(null);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* --- Main Controls Row (Search, Filter, Sort, Quick Change) --- */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* 1. Improved Search Bar (Flex Grow) */}
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

        {/* 2. Carrier Filter Dropdown */}
        <Select
          value={selectedCarrier || "all"}
          onValueChange={(value) => onCarrierFilterChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[180px] h-10 border-gray-300">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="font-medium">All Carriers</span>
            </SelectItem>
            {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
              <SelectItem key={carrier.id} value={carrier.id}>
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={carrier.name} className="h-4 w-auto" />
                  {carrier.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 3. Quick Change / Optimization Dropdown (Replaces Button Grid) */}
        <Select onValueChange={(val) => onQuickOptimization?.(val)}>
          <SelectTrigger className="w-[200px] h-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <SelectValue placeholder="Quick Options" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-white border-2 shadow-lg z-50">
            <SelectGroup>
              <SelectLabel className="text-xs text-gray-500 uppercase tracking-wider font-semibold px-2 py-1">
                Auto-Optimize
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

        {/* 4. Sort Controls */}
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(value: any) => onSortChange(value, sortDirection)}>
            <SelectTrigger className="w-[140px] h-10 border-gray-300">
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
