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
  return;
};
export default InsuranceCalculator;