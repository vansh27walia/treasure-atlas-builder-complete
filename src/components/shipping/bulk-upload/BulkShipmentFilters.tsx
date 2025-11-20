import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Sparkles, Filter, X } from "lucide-react";
import { Card } from "@/components/ui/card";

const EXTENDED_CARRIER_OPTIONS = [
  { value: "all", label: "All Carriers", services: [] },
  { value: "usps", label: "USPS", services: [
    { value: "priority", label: "USPS Priority" },
    { value: "first", label: "USPS First Class" },
  ]},
  { value: "ups", label: "UPS", services: [
    { value: "ground", label: "UPS Ground" },
    { value: "2day", label: "UPS 2nd Day" },
  ]},
  { value: "fedex", label: "FedEx", services: [
    { value: "ground", label: "FedEx Ground" },
    { value: "2day", label: "FedEx 2Day" },
  ]},
];

const OPTIMIZATION_OPTIONS = [
  { id: "cheapest", label: "Cheapest", icon: "💰" },
  { id: "fastest", label: "Fastest", icon: "⚡" },
  { id: "balanced", label: "Balanced", icon: "✅" },
];

interface BulkShipmentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCarrier: string;
  onCarrierFilterChange: (carrier: string) => void;
  sort: string;
  onSortChange: (field: any, direction: any) => void;
  onQuickOptimize: (id: string) => void;
  onApplyCarrierToAll: (carrier: string, service: string) => void;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  search,
  onSearchChange,
  selectedCarrier,
  onCarrierFilterChange,
  sort,
  onSortChange,
  onQuickOptimize,
  onApplyCarrierToAll,
}) => {
  const [bulkCarrier, setBulkCarrier] = useState("");
  const [bulkService, setBulkService] = useState("");

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-semibold">Filter & Sort</h3>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCarrier} onValueChange={onCarrierFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Carrier" />
          </SelectTrigger>
          <SelectContent>
            {EXTENDED_CARRIER_OPTIONS.map((opt) => (
              <SelectGroup key={opt.value}>
                <SelectLabel>{opt.label}</SelectLabel>
                {opt.services.map((svc) => (
                  <SelectItem key={svc.value} value={svc.value}>{svc.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(val) => onSortChange(val, 'asc')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="speed">Speed</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Quick Optimize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {OPTIMIZATION_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.id} onClick={() => onQuickOptimize(opt.id)}>
                {opt.icon} {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default BulkShipmentFilters;
