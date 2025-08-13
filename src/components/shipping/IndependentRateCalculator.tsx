
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Package, MapPin, Loader2, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import useRateCalculator from '@/hooks/useRateCalculator';
import { useShippingRates } from '@/hooks/useShippingRates';
import CarrierLogo from './CarrierLogo';
import InsuranceCalculator from './InsuranceCalculator';
import HazmatCalculator from './HazmatCalculator';
import { GeocodingService } from '@/services/GeocodingService';

const IndependentRateCalculator: React.FC = () => {
  const navigate = useNavigate();
  const { fetchRates, aiRecommendation, isLoading, isAiLoading, selectRateAndProceed } = useRateCalculator();
  const { rates } = useShippingRates();
  
  const [insuranceEnabled, setInsuranceEnabled] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState(100);
  const [insuranceCost, setInsuranceCost] = useState(0);
  const [hazmatEnabled, setHazmatEnabled] = useState(false);
  
  const [formData, setFormData] = useState({
    fromCountry: 'US',
    fromCity: '',
    fromState: '',
    fromZip: '',
    toCountry: 'US',
    toCity: '',
    toState: '',
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

    try {
      // Generate addresses using geocoding service
      const fromAddressStr = `${formData.fromCity || formData.fromZip}, ${formData.fromState || ''}, ${formData.fromCountry}`.trim();
      const toAddressStr = `${formData.toCity || formData.toZip}, ${formData.toState || ''}, ${formData.toCountry}`.trim();
      
      const geocodingService = new GeocodingService();
      
      const [fromAddressResult, toAddressResult] = await Promise.all([
        geocodingService.generateAddress(fromAddressStr, formData.fromCountry),
        geocodingService.generateAddress(toAddressStr, formData.toCountry)
      ]);
      
      if (!fromAddressResult || !toAddressResult) {
        toast.error('Unable to validate addresses. Please check your location details.');
        return;
      }
      
      const requestData = {
        fromAddress: {
          ...fromAddressResult,
          name: 'Rate Calculator'
        },
        toAddress: {
          ...toAddressResult,
          name: 'Rate Calculator'
        },
        parcel: {
          weight: parseFloat(formData.weight) * 16, // Convert lbs to oz
          length: parseFloat(formData.length) || 10,
          width: parseFloat(formData.width) || 8,
          height: parseFloat(formData.height) || 6
        },
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };
      
      await fetchRates(requestData);
    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast.error('An error occurred while calculating rates.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Main Calculator Card */}
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            International & Domestic Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* From Address Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="w-4 h-4" />
              From Address
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Country</Label>
                <Input
                  placeholder="US"
                  value={formData.fromCountry}
                  onChange={(e) => handleInputChange('fromCountry', e.target.value)}
                  maxLength={2}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">City</Label>
                <Input
                  placeholder="Brentwood"
                  value={formData.fromCity}
                  onChange={(e) => handleInputChange('fromCity', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">State/Province</Label>
                <Input
                  placeholder="CA"
                  value={formData.fromState}
                  onChange={(e) => handleInputChange('fromState', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">ZIP/Postal Code</Label>
                <Input
                  placeholder="94513"
                  value={formData.fromZip}
                  onChange={(e) => handleInputChange('fromZip', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* To Address Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-lg font-semibold">
              <MapPin className="w-4 h-4" />
              To Address
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Country</Label>
                <Input
                  placeholder="US"
                  value={formData.toCountry}
                  onChange={(e) => handleInputChange('toCountry', e.target.value)}
                  maxLength={2}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">City</Label>
                <Input
                  placeholder="New Delhi"
                  value={formData.toCity}
                  onChange={(e) => handleInputChange('toCity', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">State/Province</Label>
                <Input
                  placeholder="DL"
                  value={formData.toState}
                  onChange={(e) => handleInputChange('toState', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm text-gray-600">ZIP/Postal Code</Label>
                <Input
                  placeholder="110019"
                  value={formData.toZip}
                  onChange={(e) => handleInputChange('toZip', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Package Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-lg font-semibold">
              <Package className="w-4 h-4" />
              Package Details
            </Label>
            
            {/* Weight */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            </div>

            {/* Dimensions in Single Row */}
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Dimensions (inches)</Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Length</Label>
                  <Input
                    placeholder="10"
                    type="number"
                    value={formData.length}
                    onChange={(e) => handleInputChange('length', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Width</Label>
                  <Input
                    placeholder="8"
                    type="number"
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Height</Label>
                  <Input
                    placeholder="6"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Insurance Section */}
          <InsuranceCalculator
            onInsuranceChange={handleInsuranceChange}
            hideFromRates={false}
          />

          {/* Hazmat Section */}
          <HazmatCalculator
            onHazmatChange={handleHazmatChange}
            hideFromRates={false}
          />

          {/* Calculate Button */}
          <Button
            onClick={handleCalculateRates}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            size="lg"
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
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {aiRecommendation && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calculator className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">AI Rate Analysis</h3>
                <p className="text-blue-800 text-sm mb-3">{aiRecommendation.analysisText}</p>
                
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing rates...</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Shipping Rates ({rates.length} options)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rates.map((rate, index) => {
              const baseRate = parseFloat(rate.rate);
              const totalRate = baseRate + (insuranceEnabled ? insuranceCost : 0);
              const isRecommended = aiRecommendation && [
                aiRecommendation.bestOverall,
                aiRecommendation.bestValue,
                aiRecommendation.fastest,
                aiRecommendation.mostReliable
              ].includes(rate.id);
              
              return (
                <div
                  key={rate.id || index}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                    isRecommended ? 'border-blue-300 bg-blue-50' : 'bg-white'
                  }`}
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
                  
                  {isRecommended && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ⭐ AI Recommended
                      </span>
                    </div>
                  )}
                  
                  <Button
                    onClick={() => selectRateAndProceed(rate.id)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    Select This Rate & Create Label
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndependentRateCalculator;
