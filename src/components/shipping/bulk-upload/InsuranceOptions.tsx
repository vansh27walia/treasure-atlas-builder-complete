
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
  // Fixed $2 for up to $100 coverage
  const insuranceCost = insuranceEnabled && declaredValue <= 100 ? 2.00 : 0;

  return (
    <div className="space-y-3 p-3 bg-white rounded-lg border border-gray-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`insurance-${shipmentId}`} className="text-sm font-medium text-gray-700">
            Insurance
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  $2.00 covers up to $100 declared value. Additional coverage available at standard rates.
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
          <Label htmlFor={`declared-value-${shipmentId}`} className="text-xs text-gray-600">
            Declared Value
          </Label>
          <Input
            id={`declared-value-${shipmentId}`}
            type="number"
            value={declaredValue}
            onChange={(e) => onDeclaredValueChange(shipmentId, Number(e.target.value))}
            disabled={!insuranceEnabled}
            className="mt-1"
            min="0"
            max="100"
            step="1"
          />
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">Insurance Cost</div>
          <div className="text-sm font-semibold text-green-600">
            ${insuranceCost.toFixed(2)}
          </div>
          {declaredValue > 100 && insuranceEnabled && (
            <div className="text-xs text-orange-600">
              {'>'} $100 requires custom rate
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsuranceOptions;
