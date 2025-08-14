
import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnhancedInsuranceCalculatorProps {
  packageValue: number;
  onInsuranceChange: (insuranceAmount: number, cost: number) => void;
  className?: string;
}

const EnhancedInsuranceCalculator: React.FC<EnhancedInsuranceCalculatorProps> = ({
  packageValue,
  onInsuranceChange,
  className = ""
}) => {
  const [insuranceAmount, setInsuranceAmount] = useState(100); // Always default to $100
  const [insuranceCost, setInsuranceCost] = useState(0);

  // Calculate insurance cost based on coverage amount
  const calculateInsuranceCost = (amount: number) => {
    // Insurance rate: $1 per $100 of coverage (minimum $2)
    const rate = Math.max(2, Math.ceil(amount / 100));
    return rate;
  };

  useEffect(() => {
    const cost = calculateInsuranceCost(insuranceAmount);
    setInsuranceCost(cost);
    onInsuranceChange(insuranceAmount, cost);
  }, [insuranceAmount, onInsuranceChange]);

  const handleInsuranceAmountChange = (value: string) => {
    const amount = Math.max(0, parseInt(value) || 0);
    setInsuranceAmount(amount);
  };

  const quickSelectAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <Card className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          Package Insurance Coverage
        </CardTitle>
        <CardDescription className="text-base">
          Insurance is always enabled with $100 minimum coverage. Adjust the coverage amount as needed.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Always-On Insurance Notice */}
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            Insurance is automatically enabled with $100 coverage. You can adjust the amount below.
          </AlertDescription>
        </Alert>

        {/* Insurance Amount Input */}
        <div className="space-y-3">
          <Label htmlFor="insuranceAmount" className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            Insurance Coverage Amount
          </Label>
          <div className="relative">
            <Input
              id="insuranceAmount"
              type="number"
              value={insuranceAmount}
              onChange={(e) => handleInsuranceAmountChange(e.target.value)}
              placeholder="Enter coverage amount"
              className="pl-8 text-lg font-semibold border-2 border-blue-300 focus:border-blue-500"
              min="0"
              step="50"
            />
            <DollarSign className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Quick Select Coverage:</Label>
          <div className="grid grid-cols-3 gap-2">
            {quickSelectAmounts.map((amount) => (
              <Button
                key={amount}
                variant={insuranceAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setInsuranceAmount(amount)}
                className={`transition-all duration-200 ${
                  insuranceAmount === amount 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                ${amount.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Cost Display */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Insurance Cost:</p>
              <p className="text-2xl font-bold text-green-700">${insuranceCost.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Coverage Amount:</p>
              <p className="text-xl font-semibold text-blue-700">${insuranceAmount.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Info className="h-4 w-4" />
              <span>Rate: $1 per $100 of coverage (minimum $2)</span>
            </div>
          </div>
        </div>

        {/* Package Value Comparison */}
        {packageValue > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Package Value Comparison</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-amber-700">Declared Package Value:</span>
                <span className="font-semibold text-amber-800">${packageValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-700">Insurance Coverage:</span>
                <span className="font-semibold text-amber-800">${insuranceAmount.toLocaleString()}</span>
              </div>
              {insuranceAmount < packageValue && (
                <p className="text-amber-700 font-medium mt-2 p-2 bg-amber-100 rounded">
                  Consider increasing coverage to match your package value.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedInsuranceCalculator;
