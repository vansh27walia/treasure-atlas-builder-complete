
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Search, Sparkles, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
}

const IndependentRateCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [fromCountry, setFromCountry] = useState('US');
  const [toCountry, setToCountry] = useState('US');
  const [weight, setWeight] = useState('');
  const [packageType, setPackageType] = useState('box');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<Rate[]>([]);

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'AU', name: 'Australia' },
    { code: 'JP', name: 'Japan' },
  ];

  const packageTypes = [
    { value: 'box', label: 'Box', dimensions: { length: 12, width: 8, height: 6 } },
    { value: 'envelope', label: 'Envelope', dimensions: { length: 9, width: 12, height: 0.5 } },
    { value: 'tube', label: 'Tube', dimensions: { length: 24, width: 4, height: 4 } },
    { value: 'pak', label: 'Pak', dimensions: { length: 12, width: 15, height: 1 } },
  ];

  const handlePackageTypeChange = (type: string) => {
    setPackageType(type);
    const selectedType = packageTypes.find(p => p.value === type);
    if (selectedType) {
      setLength(selectedType.dimensions.length.toString());
      setWidth(selectedType.dimensions.width.toString());
      setHeight(selectedType.dimensions.height.toString());
    }
  };

  const handleCalculateRates = async () => {
    if (!fromZip || !toZip || !weight) {
      toast.error('Please fill in ZIP codes and weight');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate rate calculation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockRates: Rate[] = [
        { id: '1', carrier: 'USPS', service: 'Priority Mail', rate: '12.95', delivery_days: 2 },
        { id: '2', carrier: 'FedEx', service: 'Ground', rate: '15.80', delivery_days: 3 },
        { id: '3', carrier: 'UPS', service: 'Ground', rate: '14.95', delivery_days: 3 },
        { id: '4', carrier: 'USPS', service: 'Ground Advantage', rate: '8.95', delivery_days: 5 },
      ];
      
      setRates(mockRates);
      toast.success('Rates calculated successfully!');
      
    } catch (error) {
      toast.error('Failed to calculate rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipThis = (rate: Rate) => {
    // Store rate data and navigate to main shipping form
    sessionStorage.setItem('preselectedRate', JSON.stringify({
      fromZip,
      toZip,
      fromCountry,
      toCountry,
      weight,
      packageType,
      length,
      width,
      height,
      selectedRate: rate
    }));
    
    navigate('/create-label');
    toast.success(`Selected ${rate.carrier} ${rate.service} - Redirecting to shipping form`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Independent Rate Calculator</h1>
          </div>
          <p className="text-gray-600">Calculate shipping rates across all carriers instantly</p>
        </div>

        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
          <div className="space-y-6">
            {/* Origin and Destination */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-semibold mb-2 block">From</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="fromCountry" className="text-xs text-gray-600">Country</Label>
                    <Select value={fromCountry} onValueChange={setFromCountry}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fromZip" className="text-xs text-gray-600">ZIP Code</Label>
                    <Input
                      id="fromZip"
                      value={fromZip}
                      onChange={(e) => setFromZip(e.target.value)}
                      placeholder="90210"
                      maxLength={5}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-semibold mb-2 block">To</Label>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="toCountry" className="text-xs text-gray-600">Country</Label>
                    <Select value={toCountry} onValueChange={setToCountry}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="toZip" className="text-xs text-gray-600">ZIP Code</Label>
                    <Input
                      id="toZip"
                      value={toZip}
                      onChange={(e) => setToZip(e.target.value)}
                      placeholder="10001"
                      maxLength={5}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Package Details</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packageType" className="text-xs text-gray-600">Package Type</Label>
                  <Select value={packageType} onValueChange={handlePackageTypeChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {packageTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="weight" className="text-xs text-gray-600">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight"
                    min="0"
                    step="0.1"
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Dimensions (inches)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="Length"
                      min="0"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="Width"
                      min="0"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="Height"
                      min="0"
                      className="h-10"
                    />
                  </div>
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

        {/* Results */}
        {rates.length > 0 && (
          <Card className="p-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4">Available Rates</h3>
            <div className="space-y-3">
              {rates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-semibold">{rate.carrier} - {rate.service}</div>
                    <div className="text-sm text-gray-600">{rate.delivery_days} business days</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold">${rate.rate}</div>
                    <Button 
                      onClick={() => handleShipThis(rate)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Ship This
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IndependentRateCalculator;
