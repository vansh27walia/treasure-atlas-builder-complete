
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, MapPin, DollarSign, Clock, Zap } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from './CarrierLogo';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculatedRate {
  carrier: string;
  service: string;
  rate: number;
  deliveryDays: number;
  isRecommended?: boolean;
}

const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [calculatedRates, setCalculatedRates] = useState<CalculatedRate[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (!fromZip || !toZip || !weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCalculating(true);

    try {
      // Simulate rate calculation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockRates: CalculatedRate[] = [
        {
          carrier: 'USPS',
          service: 'Priority Mail',
          rate: 8.45,
          deliveryDays: 2,
          isRecommended: true
        },
        {
          carrier: 'UPS',
          service: 'Ground',
          rate: 12.30,
          deliveryDays: 3
        },
        {
          carrier: 'FedEx',
          service: 'Ground',
          rate: 13.75,
          deliveryDays: 3
        },
        {
          carrier: 'USPS',
          service: 'Ground Advantage',
          rate: 6.95,
          deliveryDays: 5
        }
      ];

      setCalculatedRates(mockRates);
      toast.success('Rates calculated successfully!');
    } catch (error) {
      toast.error('Failed to calculate rates');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setFromZip('');
    setToZip('');
    setWeight('');
    setLength('');
    setWidth('');
    setHeight('');
    setCalculatedRates([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Rate Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromZip">From ZIP Code *</Label>
                <Input
                  id="fromZip"
                  value={fromZip}
                  onChange={(e) => setFromZip(e.target.value)}
                  placeholder="90210"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="toZip">To ZIP Code *</Label>
                <Input
                  id="toZip"
                  value={toZip}
                  onChange={(e) => setToZip(e.target.value)}
                  placeholder="10001"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weight">Weight (lbs) *</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="2.5"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="12"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="8"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="4"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCalculate}
                disabled={isCalculating}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Rates
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Reset
              </Button>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Calculated Rates</h3>
            
            {calculatedRates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter package details and calculate rates</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calculatedRates.map((rate, index) => (
                  <Card key={index} className={`relative ${rate.isRecommended ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                          <div>
                            <h4 className="font-semibold">{rate.carrier}</h4>
                            <p className="text-sm text-gray-600">{rate.service}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            ${rate.rate.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {rate.deliveryDays} days
                          </div>
                        </div>
                      </div>
                      
                      {rate.isRecommended && (
                        <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                          <Zap className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateCalculatorModal;
