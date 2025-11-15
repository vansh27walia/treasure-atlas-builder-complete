
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface InsuranceOptionsProps {
  shipmentId: string;
  insuranceEnabled: boolean;
  declaredValue: number;
  onInsuranceToggle: (shipmentId: string, enabled: boolean) => void;
  onDeclaredValueChange: (shipmentId: string, value: number) => void;
}

const InsuranceOptions: React.FC<InsuranceOptionsProps> = ({
  shipmentId,
  insuranceEnabled,
  declaredValue,
  onInsuranceToggle,
  onDeclaredValueChange
}) => {
  // Calculate insurance cost based on declared value ($2 per $100)
  const calculateInsuranceCost = (value: number) => {
    if (!insuranceEnabled || value <= 0) return 0;
    return (value / 100) * 2; // $2 per $100
  };

  const insuranceCost = calculateInsuranceCost(declaredValue);

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`insurance-${shipmentId}`} className="text-sm font-semibold text-gray-800">
            Package Insurance
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-blue-600" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Up to $100 covered by most carriers by default. Additional coverage at $2 per $100 declared value.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id={`insurance-${shipmentId}`}
          checked={insuranceEnabled}
          onCheckedChange={(checked) => onInsuranceToggle(shipmentId, checked)}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Label htmlFor={`declared-value-${shipmentId}`} className="text-xs font-medium text-gray-700">
            Declared Value ($)
          </Label>
          <Input
            id={`declared-value-${shipmentId}`}
            type="number"
            value={declaredValue}
            onChange={(e) => onDeclaredValueChange(shipmentId, Number(e.target.value))}
            disabled={!insuranceEnabled}
            className="mt-1 border-blue-300 focus:border-blue-500"
            min="0"
            step="0.01"
            placeholder="Enter value"
          />
        </div>
        <div className="text-right min-w-[100px]">
          <div className="text-xs font-medium text-gray-700">Insurance Cost</div>
          <div className="text-lg font-bold text-green-600">
            ${insuranceCost.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-blue-200">
        <div className="text-xs font-medium text-blue-700">
          Rate: $2 per $100 declared value
        </div>
        {insuranceEnabled && declaredValue > 0 && (
          <div className="text-xs text-gray-600">
            ${declaredValue.toFixed(2)} × 2% = ${insuranceCost.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsuranceOptions;
