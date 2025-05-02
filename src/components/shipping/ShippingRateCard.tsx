
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  original_rate?: string;
  currency: string;
  delivery_days: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
}

interface ShippingRateCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: (rateId: string) => void;
  isBestValue: boolean;
  isFastest: boolean;
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  isBestValue,
  isFastest
}) => {
  return (
    <div 
      className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50 ${
        isSelected ? 'border-2 border-primary bg-primary/5' : ''
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center">
          <div className="font-semibold text-lg">{rate.carrier} {rate.service}</div>
          {isBestValue && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Best Value
            </span>
          )}
          {isFastest && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              Fastest
            </span>
          )}
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {rate.delivery_days 
                ? `Est. delivery: ${rate.delivery_days} business days` 
                : 'Delivery estimate not available'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 md:mt-0 flex items-center">
        <div className="mr-6 text-right">
          <div className="text-2xl font-bold">${parseFloat(rate.rate).toFixed(2)}</div>
          
          {/* Show original rate if available with tooltip explaining the markup */}
          {rate.original_rate && rate.original_rate !== rate.rate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-xs text-gray-500 flex items-center">
                  Base rate: ${parseFloat(rate.original_rate).toFixed(2)}
                  <Info className="h-3 w-3 ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Rate includes shipping markup for handling fees</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Show retail rate if available */}
          {rate.retail_rate && (
            <div className="text-xs text-gray-500">
              Retail: ${parseFloat(rate.retail_rate).toFixed(2)}
            </div>
          )}
        </div>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          onClick={() => onSelect(rate.id)}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </div>
    </div>
  );
};

export default ShippingRateCard;
