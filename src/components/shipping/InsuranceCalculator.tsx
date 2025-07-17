import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, Info } from 'lucide-react';

interface InsuranceCalculatorProps {
  onInsuranceChange: (enabled: boolean, amount: number) => void;
}

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({
  onInsuranceChange
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [declaredValue, setDeclaredValue] = useState(100); // Default to $100
  
  // Calculate insurance cost (minimum $2, then $2 per $100 of value)
  const calculateInsuranceCost = (value: number) => {
    if (value <= 0) return 0;
    return Math.max(2, Math.ceil((value / 100) * 2));
  };
  
  const insuranceCost = isEnabled ? calculateInsuranceCost(declaredValue) : 0;

  // Notify parent component of changes
  useEffect(() => {
    onInsuranceChange(isEnabled, declaredValue);
  }, [isEnabled, declaredValue, onInsuranceChange]);

  const handleValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setDeclaredValue(numValue);
  };

  return (
    <Card className="p-4 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Package Insurance</h3>
          {isEnabled && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              ${insuranceCost.toFixed(2)}
            </Badge>
          )}
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
        />
      </div>

      {isEnabled && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="declared-value" className="text-sm font-medium text-gray-700">
              Declared Value
            </Label>
            <div className="mt-1 relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="declared-value"
                type="number"
                value={declaredValue}
                onChange={(e) => handleValueChange(e.target.value)}
                className="pl-9 bg-white"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Insurance Cost: ${insuranceCost.toFixed(2)}</p>
                <p className="text-xs text-blue-600">
                  Minimum $2.00, then $2.00 per $100 of declared value. 
                  Protects against loss, damage, or theft during transit.
                </p>
              </div>
            </div>
          </div>

          {declaredValue > 5000 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">High Value Item</p>
                  <p className="text-xs">
                    Items over $5,000 may require additional documentation and handling.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!isEnabled && (
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Package insurance is disabled. Your shipment will not be covered for loss or damage.
          </p>
        </div>
      )}
    </Card>
  );
};

export default InsuranceCalculator;
