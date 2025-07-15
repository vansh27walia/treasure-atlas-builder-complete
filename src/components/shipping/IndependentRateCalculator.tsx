
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Search, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const IndependentRateCalculator: React.FC = () => {
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
      toast.success('Rates calculated! View results below.');
      
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Independent Rate Calculator</h1>
          </div>
          <p className="text-gray-600">Calculate shipping rates across all carriers instantly</p>
        </div>

        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromZip" className="text-sm font-semibold">From ZIP Code</Label>
                <Input
                  id="fromZip"
                  value={fromZip}
                  onChange={(e) => setFromZip(e.target.value)}
                  placeholder="90210"
                  maxLength={5}
                  className="h-12 text-lg"
                />
              </div>
              <div>
                <Label htmlFor="toZip" className="text-sm font-semibold">To ZIP Code</Label>
                <Input
                  id="toZip"
                  value={toZip}
                  onChange={(e) => setToZip(e.target.value)}
                  placeholder="10001"
                  maxLength={5}
                  className="h-12 text-lg"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="weight" className="text-sm font-semibold">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                min="0"
                step="0.1"
                className="h-12 text-lg"
              />
            </div>
            
            <div>
              <Label className="text-sm font-semibold mb-3 block">Package Dimensions (inches)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="length" className="text-xs text-gray-600">Length</Label>
                  <Input
                    id="length"
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="12"
                    min="0"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="width" className="text-xs text-gray-600">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="8"
                    min="0"
                    className="h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="height" className="text-xs text-gray-600">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="4"
                    min="0"
                    className="h-10"
                  />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleCalculateRates}
              disabled={isLoading}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              {isLoading ? (
                <>
                  <Search className="w-5 h-5 mr-2 animate-spin" />
                  Calculating Best Rates...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Calculate Shipping Rates
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IndependentRateCalculator;
