
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, Info } from 'lucide-react';

interface InsuranceCalculatorProps {
  onInsuranceChange: (enabled: boolean, amount: number, cost: number) => void;
  hideFromRates?: boolean;
}

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({
  onInsuranceChange,
  hideFromRates = false
}) => {
  // Insurance is always enabled with $100 default
  const [isEnabled] = useState(true);
  const [declaredValue, setDeclaredValue] = useState(100);
  
  const calculateInsuranceCost = (value: number) => {
    if (value <= 0) return 0;
    // $2 for every $100 of insurance coverage
    return Math.ceil(value / 100) * 2;
  };
  
  const insuranceCost = calculateInsuranceCost(declaredValue);

  useEffect(() => {
    onInsuranceChange(isEnabled, declaredValue, insuranceCost);
  }, [isEnabled, declaredValue, insuranceCost, onInsuranceChange]);

  const handleValueChange = (value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setDeclaredValue(numValue);
  };

  if (hideFromRates) {
    return null;
  }

  return (
    <Card className="p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Package Insurance (Always On)</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            +${insuranceCost.toFixed(2)}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="declared-value" className="text-sm font-medium text-gray-700">
            Insurance Coverage Amount (Default: $100)
          </Label>
          <div className="mt-1 relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="declared-value"
              type="number"
              value={declaredValue}
              onChange={(e) => handleValueChange(e.target.value)}
              className="pl-9 bg-white"
              placeholder="100.00"
              min="0"
              step="50"
            />
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Insurance Cost: +${insuranceCost.toFixed(2)}</p>
              <p className="text-xs text-blue-600">
                $2.00 for every $100 of coverage. 
                This will be added to your total shipping cost.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
        <p className="flex items-center gap-2 font-medium">
          <Shield className="w-4 h-4" />
          ✓ Insurance is always enabled to protect your shipment
        </p>
      </div>
    </Card>
  );
};

export default InsuranceCalculator;
