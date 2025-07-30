
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Truck, Package, MapPin, X } from 'lucide-react';
import AddressAutoComplete from './AddressAutoComplete';
import ImprovedDimensionsForm from './ImprovedDimensionsForm';
import DynamicDiscountBadge from './DynamicDiscountBadge';
import AIRateSidebar from './AIRateSidebar';
import InsuranceCalculator from './InsuranceCalculator';
import { usePaymentRedirect } from '@/hooks/usePaymentRedirect';

interface EnhancedShippingFormV2Props {
  onRatesReceived?: (rates: any[], shipmentId: string) => void;
}

const EnhancedShippingFormV2: React.FC<EnhancedShippingFormV2Props> = ({
  onRatesReceived
}) => {
  // Form state
  const [fromAddress, setFromAddress] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: ''
  });

  const [toAddress, setToAddress] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: ''
  });

  const [parcel, setParcel] = useState({
    weight: '',
    length: '',
    width: '',
    height: ''
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<any[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [showAISidebar, setShowAISidebar] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [insuranceAmount, setInsuranceAmount] = useState(100);

  const { redirectToPaymentIfNeeded } = usePaymentRedirect();

  // Load saved addresses on mount
  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const loadSavedAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedAddresses(data || []);
      
      // Auto-fill default from address
      const defaultFrom = data?.find(addr => addr.is_default_from);
      if (defaultFrom) {
        setFromAddress({
          name: defaultFrom.name || '',
          company: defaultFrom.company || '',
          street1: defaultFrom.street1 || '',
          street2: defaultFrom.street2 || '',
          city: defaultFrom.city || '',
          state: defaultFrom.state || '',
          zip: defaultFrom.zip || '',
          country: defaultFrom.country || 'US',
          phone: defaultFrom.phone || '',
          email: ''
        });
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleFromAddressSelect = (address: any) => {
    setFromAddress({
      name: address.name || '',
      company: address.company || '',
      street1: address.street1 || '',
      street2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      country: address.country || 'US',
      phone: address.phone || '',
      email: address.email || ''
    });
  };

  const handleToAddressSelect = (address: any) => {
    setToAddress({
      name: address.name || '',
      company: address.company || '',
      street1: address.street1 || '',
      street2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      country: address.country || 'US',
      phone: address.phone || '',
      email: address.email || ''
    });
  };

  const handleGetRates = async () => {
    if (!fromAddress.street1 || !toAddress.street1 || !parcel.weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel: {
            weight: parseFloat(parcel.weight),
            length: parseFloat(parcel.length) || 8,
            width: parseFloat(parcel.width) || 6,
            height: parseFloat(parcel.height) || 4
          }
        }
      });

      if (error) throw error;

      if (data?.rates && data.rates.length > 0) {
        setRates(data.rates);
        setSelectedRateId(null);
        onRatesReceived?.(data.rates, data.shipmentId);
        toast.success(`Found ${data.rates.length} shipping options!`);
        
        // Scroll to rates section
        setTimeout(() => {
          const ratesSection = document.getElementById('shipping-rates-section');
          if (ratesSection) {
            ratesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      } else {
        toast.warning('No shipping rates found for the provided details.');
      }

    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch shipping rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelect = (rateId: string) => {
    setSelectedRateId(rateId);
    setShowAISidebar(false); // Close AI sidebar when rate is selected
  };

  const handleAIRateClick = (rate: any) => {
    setShowAISidebar(true);
  };

  const handleCreateLabel = async () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }

    // Check if payment method exists, redirect if needed
    const shouldRedirect = await redirectToPaymentIfNeeded();
    if (shouldRedirect) return;

    // Proceed with label creation
    toast.success('Creating shipping label...');
  };

  // Close AI sidebar when moving to payment
  const handlePaymentClick = () => {
    setShowAISidebar(false);
    handleCreateLabel();
  };

  return (
    <div className="space-y-6">
      {/* From Address */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Ship From</h3>
          </div>
          
          {savedAddresses.length > 0 && (
            <div className="mb-4">
              <Label>Saved Addresses</Label>
              <Select onValueChange={(value) => {
                const address = savedAddresses.find(addr => addr.id.toString() === value);
                if (address) handleFromAddressSelect(address);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved address" />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((address) => (
                    <SelectItem key={address.id} value={address.id.toString()}>
                      {address.name} - {address.street1}, {address.city}, {address.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from-name">Full Name *</Label>
              <Input
                id="from-name"
                value={fromAddress.name}
                onChange={(e) => setFromAddress({...fromAddress, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="from-company">Company</Label>
              <Input
                id="from-company"
                value={fromAddress.company}
                onChange={(e) => setFromAddress({...fromAddress, company: e.target.value})}
                placeholder="Company name (optional)"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="from-address">Address *</Label>
            <AddressAutoComplete
              defaultValue={fromAddress.street1}
              onChange={(value) => setFromAddress({...fromAddress, street1: value})}
              onAddressSelected={handleFromAddressSelect}
              placeholder="Enter street address"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label htmlFor="from-city">City *</Label>
              <Input
                id="from-city"
                value={fromAddress.city}
                onChange={(e) => setFromAddress({...fromAddress, city: e.target.value})}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="from-state">State *</Label>
              <Input
                id="from-state"
                value={fromAddress.state}
                onChange={(e) => setFromAddress({...fromAddress, state: e.target.value})}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="from-zip">ZIP Code *</Label>
              <Input
                id="from-zip"
                value={fromAddress.zip}
                onChange={(e) => setFromAddress({...fromAddress, zip: e.target.value})}
                placeholder="ZIP Code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* To Address */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Ship To</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to-name">Full Name *</Label>
              <Input
                id="to-name"
                value={toAddress.name}
                onChange={(e) => setToAddress({...toAddress, name: e.target.value})}
                placeholder="Enter recipient name"
              />
            </div>
            <div>
              <Label htmlFor="to-company">Company</Label>
              <Input
                id="to-company"
                value={toAddress.company}
                onChange={(e) => setToAddress({...toAddress, company: e.target.value})}
                placeholder="Company name (optional)"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="to-address">Address *</Label>
            <AddressAutoComplete
              defaultValue={toAddress.street1}
              onChange={(value) => setToAddress({...toAddress, street1: value})}
              onAddressSelected={handleToAddressSelect}
              placeholder="Enter delivery address"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label htmlFor="to-city">City *</Label>
              <Input
                id="to-city"
                value={toAddress.city}
                onChange={(e) => setToAddress({...toAddress, city: e.target.value})}
                placeholder="City"
              />
            </div>
            <div>
              <Label htmlFor="to-state">State *</Label>
              <Input
                id="to-state"
                value={toAddress.state}
                onChange={(e) => setToAddress({...toAddress, state: e.target.value})}
                placeholder="State"
              />
            </div>
            <div>
              <Label htmlFor="to-zip">ZIP Code *</Label>
              <Input
                id="to-zip"
                value={toAddress.zip}
                onChange={(e) => setToAddress({...toAddress, zip: e.target.value})}
                placeholder="ZIP Code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Dimensions - NO CARRIER PREFERENCE */}
      <ImprovedDimensionsForm
        length={parcel.length}
        width={parcel.width}
        height={parcel.height}
        weight={parcel.weight}
        onLengthChange={(value) => setParcel({...parcel, length: value})}
        onWidthChange={(value) => setParcel({...parcel, width: value})}
        onHeightChange={(value) => setParcel({...parcel, height: value})}
        onWeightChange={(value) => setParcel({...parcel, weight: value})}
      />

      {/* Insurance */}
      <InsuranceCalculator
        onInsuranceChange={(enabled, amount) => {
          setInsuranceEnabled(enabled);
          setInsuranceAmount(amount);
        }}
      />

      {/* Get Rates Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGetRates}
          disabled={isLoading}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 px-8"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Getting Rates...
            </>
          ) : (
            <>
              <Truck className="w-5 h-5 mr-2" />
              Get Shipping Rates
            </>
          )}
        </Button>
      </div>

      {/* Shipping Rates */}
      {rates.length > 0 && (
        <div id="shipping-rates-section">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Available Shipping Options ({rates.length})
              </h3>
              
              <div className="space-y-3">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:shadow-md ${
                      selectedRateId === rate.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleRateSelect(rate.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{rate.carrier} {rate.service}</h4>
                          <DynamicDiscountBadge rate={rate} size="sm" />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAIRateClick(rate);
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <span className="text-xs mr-1">AI</span>
                            <span className="text-xs">🧠</span>
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Delivery: {rate.delivery_days} business days
                          {rate.delivery_date && ` by ${new Date(rate.delivery_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          ${parseFloat(rate.rate).toFixed(2)}
                        </p>
                        {rate.list_rate && parseFloat(rate.list_rate) > parseFloat(rate.rate) && (
                          <p className="text-sm text-gray-500 line-through">
                            ${parseFloat(rate.list_rate).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {selectedRateId === rate.id && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <Button
                          onClick={handlePaymentClick}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Create Label - ${parseFloat(rate.rate).toFixed(2)}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Sidebar */}
      <AIRateSidebar
        isOpen={showAISidebar}
        onClose={() => setShowAISidebar(false)}
        selectedRate={rates.find(r => r.id === selectedRateId)}
        allRates={rates}
        onRateSelect={handleRateSelect}
      />

      {/* Overlay when sidebar is open */}
      {showAISidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40"
          onClick={() => setShowAISidebar(false)}
        />
      )}
    </div>
  );
};

export default EnhancedShippingFormV2;
