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
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-foreground">Package Insurance</h3>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Recommended
          </Badge>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Insurance Cost</div>
          <div className="text-lg font-bold text-green-600 flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            {insuranceCost.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <Label htmlFor="insurance-amount" className="text-sm font-medium">
            Coverage Amount ($)
          </Label>
          <Input
            id="insurance-amount"
            type="number"
            value={declaredValue}
            onChange={(e) => handleValueChange(e.target.value)}
            min="0"
            step="1"
            className="mt-1 bg-white border-blue-200 focus:border-blue-500"
            placeholder="Enter coverage amount"
          />
        </div>
        
        <div className="bg-white p-3 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
            <Info className="h-4 w-4" />
            <span className="font-medium">Coverage Details</span>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Up to $100 covered by most carriers by default</li>
            <li>• Additional coverage: $2 per $100 of declared value</li>
            <li>• Protects against loss, damage, or theft</li>
            <li>• Coverage Amount: ${declaredValue.toFixed(2)}</li>
            <li>• Total Cost: ${insuranceCost.toFixed(2)}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
export default InsuranceCalculator;