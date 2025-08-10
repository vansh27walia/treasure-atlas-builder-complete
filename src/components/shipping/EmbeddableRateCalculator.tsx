
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Package, MapPin, Loader2, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import CarrierLogo from './CarrierLogo';
import InsuranceCalculator from './InsuranceCalculator';
import HazmatCalculator from './HazmatCalculator';

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
}

const EmbeddableRateCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(100);
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [hazmatEnabled, setHazmatEnabled] = useState(false);
  const [formData, setFormData] = useState({
    fromZip: '',
    toZip: '',
    weight: '',
    length: '10',
    width: '8',
    height: '6'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInsuranceChange = (enabled: boolean, amount: number, cost: number) => {
    setInsuranceEnabled(enabled);
    setInsuranceAmount(amount);
    setInsuranceCost(cost);
  };

  const handleHazmatChange = (enabled: boolean) => {
    setHazmatEnabled(enabled);
  };

  const handleCalculateRates = async () => {
    if (!formData.fromZip || !formData.toZip || !formData.weight) {
      toast.error('Please fill in origin, destination, and weight');
      return;
    }

    setIsLoading(true);
    
    try {
      const fromAddress = {
        zip: formData.fromZip,
        country: 'US'
      };
      
      const toAddress = {
        zip: formData.toZip,
        country: 'US'
      };
      
      const parcel = {
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length) || 10,
        width: parseFloat(formData.width) || 8,
        height: parseFloat(formData.height) || 6
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel,
          carriers: ['USPS', 'UPS', 'FedEx', 'DHL']
        }
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error('Failed to fetch rates. Please try again.');
        return;
      }

      if (data?.rates && data.rates.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} shipping options!`);
      } else {
        setRates([]);
        toast.warning('No rates found for the given details.');
      }
    } catch (error) {
      console.error('Rate calculation error:', error);
      toast.error('An error occurred while calculating rates.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipThis = (rate: RateResult) => {
    // Store form data and selected rate in sessionStorage
    const shippingData = {
      fromAddress: {
        zip: formData.fromZip,
        country: 'US'
      },
      toAddress: {
        zip: formData.toZip,
        country: 'US'
      },
      parcel: {
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length) || 10,
        width: parseFloat(formData.width) || 8,
        height: parseFloat(formData.height) || 6
      },
      selectedRate: rate,
      insurance: {
        enabled: insuranceEnabled,
        amount: insuranceAmount,
        cost: insuranceCost
      },
      hazmat: {
        enabled: hazmatEnabled
      }
    };
    
    sessionStorage.setItem('rateCalculatorData', JSON.stringify(shippingData));
    
    // Navigate to normal shipping with auto-fill flag
    navigate('/create-label?tab=domestic&autofill=true');
    
    toast.success('Redirecting to shipping form with your details...');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Shipping Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                From ZIP Code
              </Label>
              <Input
                placeholder="90210"
                value={formData.fromZip}
                onChange={(e) => handleInputChange('fromZip', e.target.value)}
                maxLength={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                To ZIP Code
              </Label>
              <Input
                placeholder="10001"
                value={formData.toZip}
                onChange={(e) => handleInputChange('toZip', e.target.value)}
                maxLength={5}
              />
            </div>
          </div>

          {/* Package Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Package Details
            </Label>
            
            {/* Weight */}
            <div>
              <Label className="text-sm text-gray-600">Weight (lbs)</Label>
              <Input
                placeholder="5.0"
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
              />
            </div>

            {/* Dimensions in Single Line */}
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Dimensions (inches)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Input
                    placeholder="Length"
                    type="number"
                    value={formData.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                  />
                  <Label className="text-xs text-gray-500 mt-1">Length</Label>
                </div>
                
                <div>
                  <Input
                    placeholder="Width"
                    type="number"
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', e.target.value)}
                  />
                  <Label className="text-xs text-gray-500 mt-1">Width</Label>
                </div>
                
                <div>
                  <Input
                    placeholder="Height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                  <Label className="text-xs text-gray-500 mt-1">Height</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Section - Moved above button */}
          <InsuranceCalculator
            onInsuranceChange={handleInsuranceChange}
            hideFromRates={false}
          />

          {/* Hazmat Section - Moved above button */}
          <HazmatCalculator
            onHazmatChange={handleHazmatChange}
            hideFromRates={false}
          />

          {/* Calculate Button */}
          <Button
            onClick={handleCalculateRates}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating Rates...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Get Shipping Rates
              </>
            )}
          </Button>

          {/* Results */}
          {rates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Available Rates:</h3>
              <div className="space-y-3">
                {rates.map((rate, index) => {
                  const baseRate = parseFloat(rate.rate);
                  const totalRate = baseRate + (insuranceEnabled ? insuranceCost : 0);
                  
                  return (
                    <div
                      key={rate.id || index}
                      className="border rounded-lg p-4 bg-white hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <CarrierLogo carrier={rate.carrier} className="w-12 h-12" />
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">
                              {rate.carrier} {rate.service}
                            </div>
                            <div className="text-sm text-gray-600">
                              Delivery: {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                            </div>
                            {insuranceEnabled && (
                              <div className="text-xs text-blue-600 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Insurance: +${insuranceCost.toFixed(2)}
                              </div>
                            )}
                            {hazmatEnabled && (
                              <div className="text-xs text-orange-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Hazmat Enabled
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${totalRate.toFixed(2)}
                          </div>
                          {insuranceEnabled && (
                            <div className="text-xs text-gray-500">
                              Base: ${baseRate.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleShipThis(rate)}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Ship This
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbeddableRateCalculator;
