import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, Info } from 'lucide-react';

interface ToggleableInsuranceCalculatorProps {
  onInsuranceChange: (enabled: boolean, amount: number, cost: number) => void;
  hideFromRates?: boolean;
}

const ToggleableInsuranceCalculator: React.FC<ToggleableInsuranceCalculatorProps> = ({
  onInsuranceChange,
  hideFromRates = false
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [declaredValue, setDeclaredValue] = useState(100);
  
  const calculateInsuranceCost = (value: number) => {
    if (value <= 0 || !isEnabled) return 0;
    // $2 for every $100 of insurance coverage
    return Math.ceil(value / 100) * 2;
  };
  
  const insuranceCost = calculateInsuranceCost(declaredValue);

  // Dispatch initial cost on mount
  useEffect(() => {
    onInsuranceChange(isEnabled, declaredValue, insuranceCost);
  }, [isEnabled, declaredValue, insuranceCost]);

  // Dispatch initial state immediately when component mounts
  useEffect(() => {
    // Small delay to ensure parent is ready to receive the event
    const timer = setTimeout(() => {
      onInsuranceChange(isEnabled, declaredValue, insuranceCost);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleValueChange = (value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setDeclaredValue(numValue);
  };

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
  };

  if (hideFromRates) {
    return null;
  }

  return (
    <Card className={`p-4 border transition-all ${isEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${isEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="font-semibold text-gray-900">Package Insurance</h3>
          {isEnabled && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              +${insuranceCost.toFixed(2)}
            </Badge>
          )}
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {isEnabled && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <Label htmlFor="declared-value" className="text-sm font-medium text-gray-700">
              Insurance Coverage Amount
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

          <div className="bg-blue-100 p-3 rounded-lg">
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
      )}

      {!isEnabled && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p>Toggle on to add insurance protection for your shipment</p>
        </div>
      )}
    </Card>
  );
};

export default ToggleableInsuranceCalculator;
