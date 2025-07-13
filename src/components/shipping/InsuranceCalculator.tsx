
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Shield, DollarSign } from 'lucide-react';

interface InsuranceCalculatorProps {
  insuranceEnabled: boolean;
  onInsuranceToggle: (enabled: boolean) => void;
  declaredValue: number;
  onDeclaredValueChange: (value: number) => void;
}

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({
  insuranceEnabled,
  onInsuranceToggle,
  declaredValue,
  onDeclaredValueChange,
}) => {
  // Calculate insurance charge: $4 per $100 or part thereof
  const calculateInsuranceCharge = (value: number): number => {
    if (!insuranceEnabled || value <= 0) return 0;
    return Math.ceil(value / 100) * 4;
  };

  const insuranceCharge = calculateInsuranceCharge(declaredValue);

  return (
    <Card className="p-6 space-y-4 border border-green-200 bg-green-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-green-600" />
          <Label htmlFor="insurance-toggle" className="text-lg font-semibold text-green-800">
            Add Insurance
          </Label>
        </div>
        <Switch
          id="insurance-toggle"
          checked={insuranceEnabled}
          onCheckedChange={onInsuranceToggle}
        />
      </div>
      
      {insuranceEnabled && (
        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="declared-value" className="text-sm font-medium text-gray-700">
              Declared Value ($)
            </Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="declared-value"
                type="number"
                min="0"
                step="0.01"
                value={declaredValue || ''}
                onChange={(e) => onDeclaredValueChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-10 border-green-300 focus:border-green-500"
              />
            </div>
          </div>
          
          {declaredValue > 0 && (
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Insurance Coverage:</span>
                <span className="text-sm font-semibold text-green-700">${declaredValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Insurance Charge:</span>
                <span className="text-lg font-bold text-green-800">${insuranceCharge.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                Insurance covers loss, theft, or damage. $4 per $100 of declared value.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default InsuranceCalculator;
