import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, User, Building, Phone, Mail, Truck, Calculator, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AddressAutocomplete from './AddressAutocomplete';
import InsuranceCalculator from './InsuranceCalculator';
import RateCalculatorModal from './RateCalculatorModal';
import { usePaymentRedirect } from '@/hooks/usePaymentRedirect';

interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface EnhancedShippingFormProps {
  onPaymentEntry?: () => void;
}

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = ({ onPaymentEntry }) => {
  const { user } = useAuth();
  const [fromAddress, setFromAddress] = useState<Address>({
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

  const [toAddress, setToAddress] = useState<Address>({
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

  const [parcel, setParcel] = useState<Parcel>({
    length: 12,
    width: 8,
    height: 4,
    weight: 16
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [insuranceAmount, setInsuranceAmount] = useState(100);
  const [isRateCalculatorOpen, setIsRateCalculatorOpen] = useState(false);
  const [hasPaymentCard, setHasPaymentCard] = useState(false);
  
  const { checkPaymentAndProceed } = usePaymentRedirect({
    requiresPaymentCard: true,
    onPaymentRequired: () => {
      if (onPaymentEntry) {
        onPaymentEntry();
      }
    },
    onPaymentSaved: () => {
      setHasPaymentCard(true);
    }
  });

  // Check for saved payment methods on component mount
  useEffect(() => {
    const checkPaymentMethods = async () => {
      try {
        const hasCard = localStorage.getItem('hasPaymentCard') === 'true';
        setHasPaymentCard(hasCard);
      } catch (error) {
        console.error('Error checking payment methods:', error);
      }
    };
    
    checkPaymentMethods();
  }, []);

  // Load saved addresses on component mount
  useEffect(() => {
    loadSavedAddresses();
  }, [user]);

  // Listen for auto-fill events from rate calculator
  useEffect(() => {
    const handleAutoFill = (event: CustomEvent) => {
      const transferData = sessionStorage.getItem('transferToShipping');
      if (transferData) {
        const data = JSON.parse(transferData);
        
        // Auto-fill addresses
        if (data.fromAddress) {
          setFromAddress(data.fromAddress);
        }
        if (data.toAddress) {
          setToAddress(data.toAddress);
        }
        if (data.parcel) {
          setParcel(data.parcel);
        }
        
        // Clear the transfer data
        sessionStorage.removeItem('transferToShipping');
        
        toast.success('Form auto-filled from rate calculator!');
      }
    };

    document.addEventListener('auto-fill-shipping-form', handleAutoFill as EventListener);
    return () => {
      document.removeEventListener('auto-fill-shipping-form', handleAutoFill as EventListener);
    };
  }, []);

  const loadSavedAddresses = async () => {
    if (!user) return;

    try {
      const { data: addresses, error } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading saved addresses:', error);
        return;
      }

      // Auto-fill from address with the most recent saved address
      if (addresses && addresses.length > 0) {
        const recentAddress = addresses[0];
        setFromAddress({
          name: recentAddress.name || '',
          company: recentAddress.company || '',
          street1: recentAddress.street1 || '',
          street2: recentAddress.street2 || '',
          city: recentAddress.city || '',
          state: recentAddress.state || '',
          zip: recentAddress.zip || '',
          country: recentAddress.country || 'US',
          phone: recentAddress.phone || '',
          email: recentAddress.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleGetRates = async () => {
    // Validate required fields
    if (!fromAddress.street1 || !fromAddress.city || !fromAddress.state || !fromAddress.zip) {
      toast.error('Please fill in all required FROM address fields');
      return;
    }

    if (!toAddress.street1 || !toAddress.city || !toAddress.state || !toAddress.zip) {
      toast.error('Please fill in all required TO address fields');
      return;
    }

    if (!parcel.weight || parcel.weight <= 0) {
      toast.error('Please enter a valid package weight');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        fromAddress,
        toAddress,
        parcel,
        carriers: ['USPS', 'UPS', 'FedEx', 'DHL']
      };

      console.log('Fetching rates with data:', requestData);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error('Failed to fetch shipping rates. Please try again.');
        return;
      }

      if (!data?.rates || data.rates.length === 0) {
        toast.warning('No shipping rates found for the provided details.');
        return;
      }

      console.log('Received rates:', data.rates);

      // Dispatch event to update ShippingRates component
      const ratesEvent = new CustomEvent('easypost-rates-received', {
        detail: { 
          rates: data.rates, 
          shipmentId: data.shipmentId,
          fromAddress,
          toAddress,
          parcel
        }
      });
      
      document.dispatchEvent(ratesEvent);
      
      toast.success(`Found ${data.rates.length} shipping options!`);

      // Scroll to rates section
      setTimeout(() => {
        const ratesSection = document.getElementById('shipping-rates-section');
        if (ratesSection) {
          ratesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);

    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast.error('An error occurred while calculating shipping rates.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsuranceChange = (enabled: boolean, amount: number) => {
    setInsuranceEnabled(enabled);
    setInsuranceAmount(amount);
  };

  const handlePrintLabel = async () => {
    const proceedWithPrint = () => {
      if (onPaymentEntry) {
        onPaymentEntry();
      }
      console.log('Proceeding with label printing...');
      toast.success('Label printed successfully!');
    };

    await checkPaymentAndProceed(hasPaymentCard, proceedWithPrint);
  };

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Information</h2>
        <p className="text-gray-600">Enter your package details to get competitive shipping rates</p>
      </div>

      {/* From Address Section */}
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <MapPin className="w-5 h-5" />
            From Address (Sender)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from-name" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="from-name"
                  value={fromAddress.name}
                  onChange={(e) => setFromAddress({...fromAddress, name: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="from-company" className="text-sm font-medium text-gray-700">
                Company (Optional)
              </Label>
              <div className="mt-1 relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="from-company"
                  value={fromAddress.company}
                  onChange={(e) => setFromAddress({...fromAddress, company: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="Company Name"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="from-street1" className="text-sm font-medium text-gray-700">
              Street Address *
            </Label>
            <AddressAutocomplete
              value={fromAddress.street1}
              onChange={(value) => setFromAddress({...fromAddress, street1: value})}
              onAddressSelect={(address) => {
                setFromAddress({
                  ...fromAddress,
                  street1: address.street1,
                  city: address.city,
                  state: address.state,
                  zip: address.zip
                });
              }}
              placeholder="123 Main Street"
              className="mt-1 bg-white"
            />
          </div>

          <div>
            <Label htmlFor="from-street2" className="text-sm font-medium text-gray-700">
              Apartment, Suite, etc. (Optional)
            </Label>
            <Input
              id="from-street2"
              value={fromAddress.street2}
              onChange={(e) => setFromAddress({...fromAddress, street2: e.target.value})}
              className="mt-1 bg-white"
              placeholder="Apt 4B"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="from-city" className="text-sm font-medium text-gray-700">
                City *
              </Label>
              <Input
                id="from-city"
                value={fromAddress.city}
                onChange={(e) => setFromAddress({...fromAddress, city: e.target.value})}
                className="mt-1 bg-white"
                placeholder="New York"
              />
            </div>
            <div>
              <Label htmlFor="from-state" className="text-sm font-medium text-gray-700">
                State *
              </Label>
              <Select value={fromAddress.state} onValueChange={(value) => setFromAddress({...fromAddress, state: value})}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="from-zip" className="text-sm font-medium text-gray-700">
                ZIP Code *
              </Label>
              <Input
                id="from-zip"
                value={fromAddress.zip}
                onChange={(e) => setFromAddress({...fromAddress, zip: e.target.value})}
                className="mt-1 bg-white"
                placeholder="10001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="from-phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="from-phone"
                  value={fromAddress.phone}
                  onChange={(e) => setFromAddress({...fromAddress, phone: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="from-email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="from-email"
                  type="email"
                  value={fromAddress.email}
                  onChange={(e) => setFromAddress({...fromAddress, email: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* To Address Section */}
      <Card className="border-green-200">
        <CardHeader className="bg-green-50 border-b border-green-200">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <MapPin className="w-5 h-5" />
            To Address (Recipient)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to-name" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="to-name"
                  value={toAddress.name}
                  onChange={(e) => setToAddress({...toAddress, name: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="Jane Smith"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="to-company" className="text-sm font-medium text-gray-700">
                Company (Optional)
              </Label>
              <div className="mt-1 relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="to-company"
                  value={toAddress.company}
                  onChange={(e) => setToAddress({...toAddress, company: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="Company Name"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="to-street1" className="text-sm font-medium text-gray-700">
              Street Address *
            </Label>
            <AddressAutocomplete
              value={toAddress.street1}
              onChange={(value) => setToAddress({...toAddress, street1: value})}
              onAddressSelect={(address) => {
                setToAddress({
                  ...toAddress,
                  street1: address.street1,
                  city: address.city,
                  state: address.state,
                  zip: address.zip
                });
              }}
              placeholder="456 Oak Avenue"
              className="mt-1 bg-white"
            />
          </div>

          <div>
            <Label htmlFor="to-street2" className="text-sm font-medium text-gray-700">
              Apartment, Suite, etc. (Optional)
            </Label>
            <Input
              id="to-street2"
              value={toAddress.street2}
              onChange={(e) => setToAddress({...toAddress, street2: e.target.value})}
              className="mt-1 bg-white"
              placeholder="Suite 200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="to-city" className="text-sm font-medium text-gray-700">
                City *
              </Label>
              <Input
                id="to-city"
                value={toAddress.city}
                onChange={(e) => setToAddress({...toAddress, city: e.target.value})}
                className="mt-1 bg-white"
                placeholder="Los Angeles"
              />
            </div>
            <div>
              <Label htmlFor="to-state" className="text-sm font-medium text-gray-700">
                State *
              </Label>
              <Select value={toAddress.state} onValueChange={(value) => setToAddress({...toAddress, state: value})}>
                <SelectTrigger className="mt-1 bg-white">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {usStates.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to-zip" className="text-sm font-medium text-gray-700">
                ZIP Code *
              </Label>
              <Input
                id="to-zip"
                value={toAddress.zip}
                onChange={(e) => setToAddress({...toAddress, zip: e.target.value})}
                className="mt-1 bg-white"
                placeholder="90210"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to-phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </Label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="to-phone"
                  value={toAddress.phone}
                  onChange={(e) => setToAddress({...toAddress, phone: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="to-email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="to-email"
                  type="email"
                  value={toAddress.email}
                  onChange={(e) => setToAddress({...toAddress, email: e.target.value})}
                  className="pl-9 bg-white"
                  placeholder="jane@example.com"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Details Section */}
      <Card className="border-purple-200">
        <CardHeader className="bg-purple-50 border-b border-purple-200">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Package className="w-5 h-5" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="length" className="text-sm font-medium text-gray-700">
                Length (in) *
              </Label>
              <Input
                id="length"
                type="number"
                value={parcel.length}
                onChange={(e) => setParcel({...parcel, length: parseFloat(e.target.value) || 0})}
                className="mt-1 bg-white"
                placeholder="12"
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="width" className="text-sm font-medium text-gray-700">
                Width (in) *
              </Label>
              <Input
                id="width"
                type="number"
                value={parcel.width}
                onChange={(e) => setParcel({...parcel, width: parseFloat(e.target.value) || 0})}
                className="mt-1 bg-white"
                placeholder="8"
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-sm font-medium text-gray-700">
                Height (in) *
              </Label>
              <Input
                id="height"
                type="number"
                value={parcel.height}
                onChange={(e) => setParcel({...parcel, height: parseFloat(e.target.value) || 0})}
                className="mt-1 bg-white"
                placeholder="4"
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                Weight (oz) *
              </Label>
              <Input
                id="weight"
                type="number"
                value={parcel.weight}
                onChange={(e) => setParcel({...parcel, weight: parseFloat(e.target.value) || 0})}
                className="mt-1 bg-white"
                placeholder="16"
                min="0.1"
                step="0.1"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Package Volume:</strong> {(parcel.length * parcel.width * parcel.height).toFixed(1)} cubic inches
            </p>
            <p className="text-sm text-gray-600">
              <strong>Weight:</strong> {(parcel.weight / 16).toFixed(2)} lbs ({parcel.weight} oz)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Section */}
      <InsuranceCalculator onInsuranceChange={handleInsuranceChange} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button
          onClick={handleGetRates}
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Getting Rates...
            </>
          ) : (
            <>
              <Truck className="w-5 h-5 mr-2" />
              Get Shipping Rates
            </>
          )}
        </Button>

        <Button
          onClick={() => setIsRateCalculatorOpen(true)}
          variant="outline"
          className="flex-1 sm:flex-none border-blue-300 text-blue-600 hover:bg-blue-50 py-3"
        >
          <Calculator className="w-5 h-5 mr-2" />
          Rate Calculator
        </Button>
      </div>

      {/* Payment section */}
      <div className="mt-8 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Payment & Shipping</h3>
            <p className="text-sm text-gray-600">Complete your label creation</p>
          </div>
          
          {!hasPaymentCard && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                💳 No payment method on file. You'll be redirected to add one.
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex gap-4">
          <Button
            onClick={handlePrintLabel}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            disabled={!selectedRate}
          >
            {hasPaymentCard ? 'Print Label' : 'Add Payment & Print'}
          </Button>
          
          {selectedRate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Total: ${parseFloat(selectedRate.rate || '0').toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rate Calculator Modal */}
      <RateCalculatorModal 
        isOpen={isRateCalculatorOpen} 
        onClose={() => setIsRateCalculatorOpen(false)} 
      />
    </div>
  );
};

export default EnhancedShippingForm;
