
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
}

const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [originZip, setOriginZip] = useState('');
  const [destZip, setDestZip] = useState('');
  const [country, setCountry] = useState('US');
  const [shippingType, setShippingType] = useState('');
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    weight: ''
  });
  const [rates, setRates] = useState<RateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const shippingTypes = [
    { value: 'usps_flat_rate', label: 'USPS Flat Rate' },
    { value: 'ups_box', label: 'UPS Box' },
    { value: 'fedex_box', label: 'FedEx Box' },
    { value: 'dhl_box', label: 'DHL Box' },
    { value: 'envelope', label: 'Envelope' },
    { value: 'custom_box', label: 'Custom Box' }
  ];

  const flatRateBoxes = [
    'Small Flat Rate Box',
    'Medium Flat Rate Box', 
    'Large Flat Rate Box',
    'Regional Rate Box A',
    'Regional Rate Box B'
  ];

  const handleShippingTypeChange = (value: string) => {
    setShippingType(value);
    setDimensions({ length: '', width: '', height: '', weight: '' });
  };

  const renderDynamicInputs = () => {
    if (shippingType === 'usps_flat_rate') {
      return (
        <div className="space-y-3">
          <Label>Select Flat Rate Box</Label>
          <Select onValueChange={(value) => setDimensions({ ...dimensions, weight: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose box type" />
            </SelectTrigger>
            <SelectContent>
              {flatRateBoxes.map((box) => (
                <SelectItem key={box} value={box}>{box}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (shippingType === 'envelope') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Length (in)</Label>
            <Input 
              value={dimensions.length} 
              onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })} 
              placeholder="12" 
            />
          </div>
          <div>
            <Label>Width (in)</Label>
            <Input 
              value={dimensions.width} 
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} 
              placeholder="9" 
            />
          </div>
          <div>
            <Label>Height (in)</Label>
            <Input 
              value={dimensions.height} 
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })} 
              placeholder="0.5" 
            />
          </div>
        </div>
      );
    }

    if (['ups_box', 'fedex_box', 'dhl_box', 'custom_box'].includes(shippingType)) {
      return (
        <div className="space-y-3">
          <div>
            <Label>Weight (lbs)</Label>
            <Input 
              value={dimensions.weight} 
              onChange={(e) => setDimensions({ ...dimensions, weight: e.target.value })} 
              placeholder="5" 
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Length (in)</Label>
              <Input 
                value={dimensions.length} 
                onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })} 
                placeholder="12" 
              />
            </div>
            <div>
              <Label>Width (in)</Label>
              <Input 
                value={dimensions.width} 
                onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} 
                placeholder="8" 
              />
            </div>
            <div>
              <Label>Height (in)</Label>
              <Input 
                value={dimensions.height} 
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })} 
                placeholder="6" 
              />
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const fetchRates = async () => {
    if (!originZip || !destZip || !shippingType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Get Google Maps API key and geocode addresses
      const { data: googleApiData } = await supabase.functions.invoke('get-google-api-key');
      if (!googleApiData?.apiKey) {
        toast.error('Google Maps API not configured');
        return;
      }

      // Geocode origin zip
      const originResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${originZip}&key=${googleApiData.apiKey}`);
      const originData = await originResponse.json();

      // Geocode destination zip
      const destResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${destZip}&key=${googleApiData.apiKey}`);
      const destData = await destResponse.json();

      if (!originData.results[0] || !destData.results[0]) {
        toast.error('Invalid zip codes');
        return;
      }

      // Parse Google address data
      const parseGoogleAddress = (result: any) => {
        const components = result.address_components;
        return {
          street1: result.formatted_address.split(',')[0],
          city: components.find((c: any) => c.types.includes('locality'))?.long_name || '',
          state: components.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name || '',
          zip: components.find((c: any) => c.types.includes('postal_code'))?.long_name || '',
          country: country
        };
      };

      const fromAddress = parseGoogleAddress(originData.results[0]);
      const toAddress = parseGoogleAddress(destData.results[0]);

      // Prepare payload for rate fetching
      const payload = {
        fromAddress: {
          name: 'Rate Calculator',
          ...fromAddress
        },
        toAddress: {
          name: 'Recipient',
          ...toAddress
        },
        parcel: {
          length: parseFloat(dimensions.length) || 12,
          width: parseFloat(dimensions.width) || 8,
          height: parseFloat(dimensions.height) || 6,
          weight: parseFloat(dimensions.weight) || 5
        }
      };

      // Fetch rates using existing backend
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      setRates(data.rates || []);
      toast.success('Rates fetched successfully');
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipThis = (rate: RateResult) => {
    // Store the rate data for the main shipping workflow
    const calculatorData = {
      originZip,
      destZip,
      country,
      shippingType,
      dimensions,
      selectedRate: rate,
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    sessionStorage.setItem('transferToShipping', 'true');
    
    // Close modal and notify
    onClose();
    toast.success('Package data saved! Go to Create Label to complete shipping.');

    // Dispatch event to notify other components
    document.dispatchEvent(new CustomEvent('calculator-ship-selected', {
      detail: calculatorData
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Rate Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Origin and Destination */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Origin Zip Code</Label>
              <Input
                value={originZip}
                onChange={(e) => setOriginZip(e.target.value)}
                placeholder="10001"
              />
            </div>
            <div>
              <Label>Destination Zip Code</Label>
              <Input
                value={destZip}
                onChange={(e) => setDestZip(e.target.value)}
                placeholder="90210"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shipping Type */}
          <div>
            <Label>Shipping Type</Label>
            <Select value={shippingType} onValueChange={handleShippingTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select shipping type" />
              </SelectTrigger>
              <SelectContent>
                {shippingTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Inputs */}
          {renderDynamicInputs()}

          {/* Fetch Rates Button */}
          <Button 
            onClick={fetchRates} 
            disabled={isLoading || !originZip || !destZip || !shippingType}
            className="w-full"
          >
            {isLoading ? 'Fetching Rates...' : 'Get Rates'}
          </Button>

          {/* Rates Display */}
          {rates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Rates</h3>
              <div className="grid gap-3">
                {rates.map((rate) => (
                  <Card key={rate.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-lg">{rate.carrier} - {rate.service}</div>
                          <div className="text-sm text-gray-600">
                            Delivery: {rate.delivery_days} business days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-xl text-green-600">
                            ${rate.rate}
                          </div>
                          <Button 
                            onClick={() => handleShipThis(rate)}
                            className="mt-2"
                          >
                            Ship This Package
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateCalculatorModal;
