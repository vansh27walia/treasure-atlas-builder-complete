import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, DollarSign, Info } from 'lucide-react';
interface InsuranceCalculatorProps {
  onInsuranceChange: (enabled: boolean, amount: number, cost: number) => void;
  hideFromRates?: boolean;
}
const insuranceOptions = [
  { value: '100', label: '$100 Coverage - $2.00', amount: 100, cost: 2 },
  { value: '200', label: '$200 Coverage - $4.00', amount: 200, cost: 4 },
  { value: '300', label: '$300 Coverage - $6.00', amount: 300, cost: 6 },
  { value: '500', label: '$500 Coverage - $10.00', amount: 500, cost: 10 },
  { value: '1000', label: '$1000 Coverage - $20.00', amount: 1000, cost: 20 },
  { value: 'custom', label: 'Custom Amount', amount: 0, cost: 0 },
];

const InsuranceCalculator: React.FC<InsuranceCalculatorProps> = ({
  onInsuranceChange,
  hideFromRates = false
}) => {
  // Insurance is enabled by default like hazmat
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedOption, setSelectedOption] = useState('100');
  const [customValue, setCustomValue] = useState(100);
  const calculateInsuranceCost = (value: number) => {
    if (value <= 0) return 0;
    // $2 for every $100 of insurance coverage
    return Math.ceil(value / 100) * 2;
  };

  const getCurrentValues = () => {
    if (!isEnabled) return { amount: 0, cost: 0 };
    
    if (selectedOption === 'custom') {
      return { amount: customValue, cost: calculateInsuranceCost(customValue) };
    }
    
    const option = insuranceOptions.find(opt => opt.value === selectedOption);
    return { amount: option?.amount || 100, cost: option?.cost || 2 };
  };

  const { amount: currentAmount, cost: currentCost } = getCurrentValues();

  useEffect(() => {
    onInsuranceChange(isEnabled, currentAmount, currentCost);
  }, [isEnabled, currentAmount, currentCost, onInsuranceChange]);

  const handleOptionChange = (value: string) => {
    setSelectedOption(value);
    if (value !== 'custom') {
      const option = insuranceOptions.find(opt => opt.value === value);
      if (option) {
        setCustomValue(option.amount);
      }
    }
  };

  const handleCustomValueChange = (value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setCustomValue(numValue);
  };
  if (hideFromRates) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <Label className="text-base font-medium text-blue-800">Package Insurance</Label>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Recommended
          </Badge>
        </div>
        {isEnabled && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Cost</div>
            <div className="text-lg font-bold text-green-600 flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {currentCost.toFixed(2)}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        <Checkbox
          id="insurance"
          checked={isEnabled}
          onCheckedChange={(checked) => setIsEnabled(checked === true)}
        />
        <Label htmlFor="insurance" className="text-sm font-medium">
          Add package insurance protection
        </Label>
      </div>

      {isEnabled && (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Coverage Options</Label>
            <Select value={selectedOption} onValueChange={handleOptionChange}>
              <SelectTrigger className="bg-white border-blue-200 focus:border-blue-500">
                <SelectValue placeholder="Select insurance coverage" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60]">
                {insuranceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="cursor-pointer hover:bg-gray-50">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption === 'custom' && (
            <div>
              <Label htmlFor="custom-insurance" className="text-sm font-medium">
                Custom Coverage Amount ($)
              </Label>
              <Input
                id="custom-insurance"
                type="number"
                value={customValue}
                onChange={(e) => handleCustomValueChange(e.target.value)}
                min="0"
                step="1"
                className="mt-1 bg-white border-blue-200 focus:border-blue-500"
                placeholder="Enter coverage amount"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Cost: ${calculateInsuranceCost(customValue).toFixed(2)}
              </div>
            </div>
          )}
          
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">Coverage Details</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Up to $100 covered by most carriers by default</li>
              <li>• Additional coverage: $2 per $100 of declared value</li>
              <li>• Protects against loss, damage, or theft</li>
              <li>• Coverage Amount: ${currentAmount.toFixed(2)}</li>
              <li>• Total Cost: ${currentCost.toFixed(2)}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
export default InsuranceCalculator;