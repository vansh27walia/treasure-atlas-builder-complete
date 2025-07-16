import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calculator, Package, MapPin, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullScreen?: boolean;
}

interface Address {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PackageType {
  id: string;
  name: string;
  dimensions?: { length: number; width: number; height?: number };
  carrier?: string;
}

const packageTypes: PackageType[] = [
  { id: 'box', name: 'Custom Box' },
  { id: 'envelope', name: 'Envelope' },
  { id: 'usps_flat_rate_box', name: 'USPS Flat Rate Box', dimensions: { length: 11, width: 8.5, height: 5.5 }, carrier: 'USPS' },
  { id: 'usps_priority_box', name: 'USPS Priority Box', dimensions: { length: 12, width: 12, height: 8 }, carrier: 'USPS' },
  { id: 'ups_small_box', name: 'UPS Small Box', dimensions: { length: 13, width: 11, height: 2 }, carrier: 'UPS' },
  { id: 'ups_medium_box', name: 'UPS Medium Box', dimensions: { length: 16, width: 11, height: 3 }, carrier: 'UPS' },
];

const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({ isOpen, onClose, fullScreen = false }) => {
  const [fromAddress, setFromAddress] = useState<Address>({
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });
  
  const [toAddress, setToAddress] = useState<Address>({
    street1: '',
    city: '',
    state: '',
    zip: '',
    country: 'US'
  });

  const [selectedPackageType, setSelectedPackageType] = useState('box');
  const [weight, setWeight] = useState(1);
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Update dimensions when package type changes
  useEffect(() => {
    const packageType = packageTypes.find(p => p.id === selectedPackageType);
    if (packageType?.dimensions) {
      setDimensions({
        length: packageType.dimensions.length,
        width: packageType.dimensions.width,
        height: packageType.dimensions.height || 0
      });
    } else {
      setDimensions({ length: 0, width: 0, height: 0 });
    }
  }, [selectedPackageType]);

  const handleGetRates = async () => {
    if (!fromAddress.zip || !toAddress.zip) {
      toast.error('Please provide both origin and destination zip codes');
      return;
    }

    if (weight <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    if (selectedPackageType === 'box' && (!dimensions.length || !dimensions.width || !dimensions.height)) {
      toast.error('Please enter valid dimensions for custom box');
      return;
    }

    if (selectedPackageType === 'envelope' && (!dimensions.length || !dimensions.width)) {
      toast.error('Please enter valid dimensions for envelope');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fromAddress: {
          name: 'Rate Calculator',
          street1: fromAddress.street1 || 'Main Street',
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country,
          phone: '555-555-5555'
        },
        toAddress: {
          name: 'Rate Calculator',
          street1: toAddress.street1 || 'Main Street',
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country,
          phone: '555-555-5555'
        },
        parcel: {
          weight: weight * 16, // Convert pounds to ounces
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height
        },
        carriers: ['usps', 'ups', 'fedex', 'dhl', 'canadapost']
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data.rates && Array.isArray(data.rates)) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} shipping rates`);
      } else {
        setRates([]);
        toast.error('No rates found for this shipment');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get shipping rates');
      setRates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const showDimensions = selectedPackageType === 'box' || selectedPackageType === 'envelope';
  const showHeight = selectedPackageType === 'box';

  // If fullScreen is true, render without Dialog wrapper
  if (fullScreen) {
    return (
      <div className="w-full h-full bg-white">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5" />
            <h1 className="text-2xl font-bold">Shipping Rate Calculator</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <div className="space-y-6">
              {/* From Address */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  From Address
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="from-street">Street Address</Label>
                    <Input
                      id="from-street"
                      value={fromAddress.street1}
                      onChange={(e) => setFromAddress({...fromAddress, street1: e.target.value})}
                      placeholder="123 Main St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-city">City</Label>
                    <Input
                      id="from-city"
                      value={fromAddress.city}
                      onChange={(e) => setFromAddress({...fromAddress, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-state">State</Label>
                    <Input
                      id="from-state"
                      value={fromAddress.state}
                      onChange={(e) => setFromAddress({...fromAddress, state: e.target.value})}
                      placeholder="CA"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="from-zip">ZIP Code *</Label>
                    <Input
                      id="from-zip"
                      value={fromAddress.zip}
                      onChange={(e) => setFromAddress({...fromAddress, zip: e.target.value})}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* To Address */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  To Address
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="to-street">Street Address</Label>
                    <Input
                      id="to-street"
                      value={toAddress.street1}
                      onChange={(e) => setToAddress({...toAddress, street1: e.target.value})}
                      placeholder="456 Oak St"
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-city">City</Label>
                    <Input
                      id="to-city"
                      value={toAddress.city}
                      onChange={(e) => setToAddress({...toAddress, city: e.target.value})}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-state">State</Label>
                    <Input
                      id="to-state"
                      value={toAddress.state}
                      onChange={(e) => setToAddress({...toAddress, state: e.target.value})}
                      placeholder="NY"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="to-zip">ZIP Code *</Label>
                    <Input
                      id="to-zip"
                      value={toAddress.zip}
                      onChange={(e) => setToAddress({...toAddress, zip: e.target.value})}
                      placeholder="54321"
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Package Details */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Package Details
                </h3>
                
                {/* Package Type */}
                <div className="mb-4">
                  <Label htmlFor="package-type">Package Type</Label>
                  <select
                    id="package-type"
                    value={selectedPackageType}
                    onChange={(e) => setSelectedPackageType(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    {packageTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name} {type.carrier && `(${type.carrier})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weight */}
                <div className="mb-4">
                  <Label htmlFor="weight">Weight (lbs) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder="1.0"
                    required
                  />
                </div>

                {/* Dimensions */}
                {showDimensions && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="length">Length (in) *</Label>
                      <Input
                        id="length"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={dimensions.length}
                        onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})}
                        placeholder="12"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">Width (in) *</Label>
                      <Input
                        id="width"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={dimensions.width}
                        onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})}
                        placeholder="8"
                        required
                      />
                    </div>
                    {showHeight && (
                      <div>
                        <Label htmlFor="height">Height (in) *</Label>
                        <Input
                          id="height"
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={dimensions.height}
                          onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})}
                          placeholder="6"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Button 
                onClick={handleGetRates}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Getting Rates...' : 'Get Shipping Rates'}
              </Button>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Shipping Rates ({rates.length})
              </h3>

              {rates.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rates.map((rate, index) => (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-lg">
                            {rate.carrier?.toUpperCase()} {rate.service}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {rate.delivery_days} {rate.delivery_days === 1 ? 'day' : 'days'}
                          </p>
                          {rate.delivery_date && (
                            <p className="text-xs text-gray-500">
                              Est. delivery: {new Date(rate.delivery_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${parseFloat(rate.rate).toFixed(2)}
                          </div>
                          {rate.list_rate && parseFloat(rate.list_rate) > parseFloat(rate.rate) && (
                            <div className="text-sm text-gray-500 line-through">
                              ${parseFloat(rate.list_rate).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isLoading ? 'Loading rates...' : 'No rates to display. Fill out the form and click "Get Shipping Rates" to see available options.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Shipping Rate Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* From Address */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                From Address
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="from-street">Street Address</Label>
                  <Input
                    id="from-street"
                    value={fromAddress.street1}
                    onChange={(e) => setFromAddress({...fromAddress, street1: e.target.value})}
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <Label htmlFor="from-city">City</Label>
                  <Input
                    id="from-city"
                    value={fromAddress.city}
                    onChange={(e) => setFromAddress({...fromAddress, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="from-state">State</Label>
                  <Input
                    id="from-state"
                    value={fromAddress.state}
                    onChange={(e) => setFromAddress({...fromAddress, state: e.target.value})}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="from-zip">ZIP Code *</Label>
                  <Input
                    id="from-zip"
                    value={fromAddress.zip}
                    onChange={(e) => setFromAddress({...fromAddress, zip: e.target.value})}
                    placeholder="12345"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* To Address */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-600" />
                To Address
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="to-street">Street Address</Label>
                  <Input
                    id="to-street"
                    value={toAddress.street1}
                    onChange={(e) => setToAddress({...toAddress, street1: e.target.value})}
                    placeholder="456 Oak St"
                  />
                </div>
                <div>
                  <Label htmlFor="to-city">City</Label>
                  <Input
                    id="to-city"
                    value={toAddress.city}
                    onChange={(e) => setToAddress({...toAddress, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="to-state">State</Label>
                  <Input
                    id="to-state"
                    value={toAddress.state}
                    onChange={(e) => setToAddress({...toAddress, state: e.target.value})}
                    placeholder="NY"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label htmlFor="to-zip">ZIP Code *</Label>
                  <Input
                    id="to-zip"
                    value={toAddress.zip}
                    onChange={(e) => setToAddress({...toAddress, zip: e.target.value})}
                    placeholder="54321"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Package Details */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Package Details
              </h3>
              
              {/* Package Type */}
              <div className="mb-4">
                <Label htmlFor="package-type">Package Type</Label>
                <select
                  id="package-type"
                  value={selectedPackageType}
                  onChange={(e) => setSelectedPackageType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  {packageTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.carrier && `(${type.carrier})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight */}
              <div className="mb-4">
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  placeholder="1.0"
                  required
                />
              </div>

              {/* Dimensions */}
              {showDimensions && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="length">Length (in) *</Label>
                    <Input
                      id="length"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={dimensions.length}
                      onChange={(e) => setDimensions({...dimensions, length: parseFloat(e.target.value) || 0})}
                      placeholder="12"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (in) *</Label>
                    <Input
                      id="width"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({...dimensions, width: parseFloat(e.target.value) || 0})}
                      placeholder="8"
                      required
                    />
                  </div>
                  {showHeight && (
                    <div>
                      <Label htmlFor="height">Height (in) *</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={dimensions.height}
                        onChange={(e) => setDimensions({...dimensions, height: parseFloat(e.target.value) || 0})}
                        placeholder="6"
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Button 
              onClick={handleGetRates}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Getting Rates...' : 'Get Shipping Rates'}
            </Button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Shipping Rates ({rates.length})
            </h3>

            {rates.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rates.map((rate, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-lg">
                          {rate.carrier?.toUpperCase()} {rate.service}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {rate.delivery_days} {rate.delivery_days === 1 ? 'day' : 'days'}
                        </p>
                        {rate.delivery_date && (
                          <p className="text-xs text-gray-500">
                            Est. delivery: {new Date(rate.delivery_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${parseFloat(rate.rate).toFixed(2)}
                        </div>
                        {rate.list_rate && parseFloat(rate.list_rate) > parseFloat(rate.rate) && (
                          <div className="text-sm text-gray-500 line-through">
                            ${parseFloat(rate.list_rate).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {isLoading ? 'Loading rates...' : 'No rates to display. Fill out the form and click "Get Shipping Rates" to see available options.'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateCalculatorModal;
