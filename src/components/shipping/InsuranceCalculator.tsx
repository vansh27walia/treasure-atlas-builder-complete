
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, DollarSign } from 'lucide-react';

interface InsuranceCalculatorProps {
  onInsuranceChange?: (enabled: boolean, amount: number) => void;
}

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({ onInsuranceChange }) => {
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(100); // Default to $100

  // Initialize with default value
  useEffect(() => {
    if (onInsuranceChange) {
      onInsuranceChange(insuranceEnabled, insuranceAmount);
    }
  }, [insuranceEnabled, insuranceAmount, onInsuranceChange]);

  const handleInsuranceToggle = (enabled: boolean) => {
    setInsuranceEnabled(enabled);
    if (onInsuranceChange) {
      onInsuranceChange(enabled, insuranceAmount);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setInsuranceAmount(amount);
    if (onInsuranceChange) {
      onInsuranceChange(insuranceEnabled, amount);
    }
  };

  const calculateInsuranceCost = () => {
    // Standard insurance rate: $1 per $100 of coverage
    return Math.max(1, Math.ceil(insuranceAmount / 100));
  };

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-orange-600" />
          Package Insurance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Enable Insurance Protection</Label>
            <p className="text-xs text-gray-600 mt-1">
              Protect your package against loss or damage
            </p>
          </div>
          <Switch
            checked={insuranceEnabled}
            onCheckedChange={handleInsuranceToggle}
          />
        </div>

        {insuranceEnabled && (
          <div className="space-y-3 p-4 bg-white rounded-lg border border-orange-200">
            <div>
              <Label className="text-sm font-medium">Coverage Amount</Label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <Input
                  type="number"
                  value={insuranceAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="100"
                  className="flex-1"
                  min="1"
                  step="1"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Insurance Cost:</span>
              <span className="font-semibold text-orange-600">
                ${calculateInsuranceCost().toFixed(2)}
              </span>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p>• Coverage up to declared value</p>
              <p>• Protection against loss, damage, or theft</p>
              <p>• Easy claims process</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceCalculator;
