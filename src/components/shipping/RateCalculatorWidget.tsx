
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Search } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const RateCalculatorWidget: React.FC = () => {
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculateRates = async () => {
    if (!fromZip || !toZip || !weight) {
      toast.error('Please fill in ZIP codes and weight');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate rate calculation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Rates calculated! Navigate to shipping form to see results.');
      
      // Store data for transfer to main form
      sessionStorage.setItem('calculatorData', JSON.stringify({
        fromZip,
        toZip,
        weight,
        length,
        width,
        height
      }));
      
    } catch (error) {
      toast.error('Failed to calculate rates');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Quick Rate Calculator</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fromZip" className="text-sm">From ZIP</Label>
            <Input
              id="fromZip"
              value={fromZip}
              onChange={(e) => setFromZip(e.target.value)}
              placeholder="90210"
              maxLength={5}
            />
          </div>
          <div>
            <Label htmlFor="toZip" className="text-sm">To ZIP</Label>
            <Input
              id="toZip"
              value={toZip}
              onChange={(e) => setToZip(e.target.value)}
              placeholder="10001"
              maxLength={5}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="weight" className="text-sm">Weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="length" className="text-xs">Length</Label>
            <Input
              id="length"
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="width" className="text-xs">Width</Label>
            <Input
              id="width"
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-xs">Height</Label>
            <Input
              id="height"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleCalculateRates}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <Search className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Calculate Rates
        </Button>
      </div>
    </Card>
  );
};

export default RateCalculatorWidget;
