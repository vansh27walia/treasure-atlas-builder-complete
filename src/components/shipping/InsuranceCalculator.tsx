
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, DollarSign } from 'lucide-react';

interface InsuranceCalculatorProps {
  declaredValue: number;
  onDeclaredValueChange: (value: number) => void;
  insuranceEnabled: boolean;
  onInsuranceToggle: (enabled: boolean) => void;
}

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({
  declaredValue,
  onDeclaredValueChange,
  insuranceEnabled,
  onInsuranceToggle,
}) => {
  // Calculate insurance cost: $2 per $100 declared value
  const insuranceCost = insuranceEnabled ? Math.max(2, Math.ceil((declaredValue / 100) * 2)) : 0;

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center space-x-2">
        <Shield className="w-5 h-5 text-blue-600" />
        <Label className="text-base font-medium text-blue-800">Package Insurance</Label>
      </div>
      
      <div className="flex items-center space-x-3">
        <Checkbox
          id="insurance"
          checked={insuranceEnabled}
          onCheckedChange={onInsuranceToggle}
        />
        <Label htmlFor="insurance" className="text-sm font-medium">
          Add insurance protection ($2 per $100 declared value)
        </Label>
      </div>

      {insuranceEnabled && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="declaredValue" className="text-sm">Declared Value ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="declaredValue"
                type="number"
                min="0"
                step="0.01"
                value={declaredValue || ''}
                onChange={(e) => onDeclaredValueChange(Number(e.target.value))}
                placeholder="0.00"
                className="pl-9"
              />
            </div>
          </div>
          
          {declaredValue > 0 && (
            <div className="p-3 bg-white rounded border border-blue-200">
              <div className="flex justify-between items-center text-sm">
                <span>Declared Value:</span>
                <span className="font-medium">${declaredValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Insurance Cost:</span>
                <span className="font-medium text-blue-600">+${insuranceCost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsuranceCalculator;
