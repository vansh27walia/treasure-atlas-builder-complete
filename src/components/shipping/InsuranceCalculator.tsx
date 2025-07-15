
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, DollarSign, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InsuranceCalculatorProps {
  onInsuranceChange: (enabled: boolean, amount: number, cost: number) => void;
  defaultValue?: number;
  isEnabled?: boolean;
}

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({
  onInsuranceChange,
  defaultValue = 100,
  isEnabled = true,
}) => {
  const [insuranceEnabled, setInsuranceEnabled] = useState(isEnabled);
  const [declaredValue, setDeclaredValue] = useState(defaultValue);
  const [insuranceCost, setInsuranceCost] = useState(0);

  useEffect(() => {
    const cost = insuranceEnabled ? Math.ceil(declaredValue / 100) * 2 : 0;
    setInsuranceCost(cost);
    onInsuranceChange(insuranceEnabled, declaredValue, cost);
  }, [insuranceEnabled, declaredValue, onInsuranceChange]);

  const handleInsuranceToggle = (checked: boolean) => {
    setInsuranceEnabled(checked);
    if (checked && declaredValue === 0) {
      setDeclaredValue(100);
    }
  };

  const handleValueChange = (value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setDeclaredValue(numValue);
  };

  return (
    <Card className="w-full border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-5 h-5 text-blue-600" />
          Package Protection
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            Recommended
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Checkbox
            id="insurance"
            checked={insuranceEnabled}
            onCheckedChange={handleInsuranceToggle}
            className="w-5 h-5"
          />
          <Label htmlFor="insurance" className="text-sm font-medium cursor-pointer">
            Protect my package with insurance
          </Label>
        </div>

        {insuranceEnabled && (
          <div className="space-y-3 pl-8">
            <div>
              <Label htmlFor="declared-value" className="text-sm font-medium">
                Declared Value (USD)
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <Input
                  id="declared-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={declaredValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="flex-1 bg-white border-blue-200 focus:ring-blue-500"
                  placeholder="100.00"
                />
              </div>
            </div>

            <div className="p-3 bg-white border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Insurance Cost:</span>
                <span className="text-lg font-bold text-blue-900">${insuranceCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>Rate: $2 per $100 declared value</span>
                <span>Coverage: ${declaredValue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2 bg-blue-100 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Insurance protects against loss, theft, or damage during transit. 
                Coverage is provided by the carrier and claims are processed according to their terms.
              </p>
            </div>
          </div>
        )}

        {!insuranceEnabled && (
          <div className="pl-8 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                Package not insured. Carrier liability may be limited.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InsuranceCalculator;
