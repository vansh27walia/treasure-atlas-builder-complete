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
  const insuranceCost = insuranceEnabled ? declaredValue * 0.02 : 0;
  return <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200 px-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`insurance-${shipmentId}`} className="text-sm font-medium">
            Insurance
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Up to $100 covered by most carriers by default. Additional value insured via EasyPost at 2% of declared amount.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch id={`insurance-${shipmentId}`} checked={insuranceEnabled} onCheckedChange={checked => onInsuranceToggle(shipmentId, checked)} />
      </div>
      
      <div className="flex items-center space-x-4 px-[57px]">
        <div className="flex-1">
          <Label htmlFor={`declared-value-${shipmentId}`} className="text-xs text-gray-600">
            Declared Value
          </Label>
          <Input id={`declared-value-${shipmentId}`} type="number" value={declaredValue} onChange={e => onDeclaredValueChange(shipmentId, Number(e.target.value))} disabled={!insuranceEnabled} min="0" step="1" className="mt-1 px-[60px]" />
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">Insurance Cost</div>
          <div className="text-sm font-semibold text-green-600">
            ${insuranceCost.toFixed(2)}
          </div>
        </div>
      </div>
    </div>;
};
export default InsuranceOptions;