import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ShippingAddress,
  Parcel,
  ShippingOption,
  GoogleApiKeyResponse,
  AddressValidationResult,
} from '@/types/shipping';
import AddressForm from '@/components/shipping/AddressForm';
import PackageForm from '@/components/shipping/PackageForm';
import { useAddressValidation } from '@/hooks/useAddressValidation';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useApiKey } from '@/hooks/useApiKey';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SavedAddress } from '@/types/shipping';
import { addressService } from '@/services/AddressService';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const CreateLabelPage = () => {
  const [fromName, setFromName] = useState('');
  const [fromCompany, setFromCompany] = useState('');
  const [fromStreet1, setFromStreet1] = useState('');
  const [fromStreet2, setFromStreet2] = useState('');
  const [fromCity, setFromCity] = useState('');
  const [fromState, setFromState] = useState('');
  const [fromZip, setFromZip] = useState('');
  const [fromCountry, setFromCountry] = useState('US');
  const [fromPhone, setFromPhone] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromIsResidential, setFromIsResidential] = useState(false);

  const [toName, setToName] = useState('');
  const [toCompany, setToCompany] = useState('');
  const [toStreet1, setToStreet1] = useState('');
  const [toStreet2, setToStreet2] = useState('');
  const [toCity, setToCity] = useState('');
  const [toState, setToState] = useState('');
  const [toZip, setToZip] = useState('');
  const [toCountry, setToCountry] = useState('US');
  const [toPhone, setToPhone] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toIsResidential, setToIsResidential] = useState(false);

  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);

  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);

  const { validateAddress } = useAddressValidation();
  const shippingRatesHook = useShippingRates();
  const { apiKey, isLoading: isApiKeyLoading, error: apiKeyError } = useApiKey();

  // Add mock getShippingRates method
  const getShippingRates = async (fromAddress: any, toAddress: any, parcel: any) => {
    // Mock implementation
    return [
      {
        id: 'rate-1',
        carrier: 'USPS',
        service: 'Ground',
        rate: '12.50',
        currency: 'USD'
      }
    ];
  };

  const [isAddressValid, setIsAddressValid] = useState(false);
  const [isPackageValid, setIsPackageValid] = useState(false);

  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const address = await addressService.getDefaultFromAddress();
        if (address) {
          setPickupAddress({
            ...address,
            id: String(address.id), // Convert number to string
            email: address.email || '',
            is_residential: address.is_residential || false,
            updated_at: address.updated_at || new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    loadDefaultAddress();
  }, []);

  useEffect(() => {
    setIsAddressValid(validateFormData());
    setIsPackageValid(validatePackageData());
  }, [
    fromName,
    fromStreet1,
    fromCity,
    fromState,
    fromZip,
    fromCountry,
    toName,
    toStreet1,
    toCity,
    toState,
    toZip,
    toCountry,
    length,
    width,
    height,
    weight,
  ]);

  const validateFormData = (): boolean => {
    return (
      !!fromName &&
      !!fromStreet1 &&
      !!fromCity &&
      !!fromState &&
      !!fromZip &&
      !!fromCountry &&
      !!toName &&
      !!toStreet1 &&
      !!toCity &&
      !!toState &&
      !!toZip &&
      !!toCountry
    );
  };

  const validatePackageData = (): boolean => {
    return !!length && !!width && !!height && !!weight;
  };

  const handleCreateLabel = async () => {
    if (!selectedRate) {
      toast({
        title: 'No Rate Selected',
        description: 'Please select a shipping rate before creating a label.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingLabel(true);

    try {
      const fromAddress = getAddressFromForm('from');
      const toAddress = getAddressFromForm('to');

      const packageInfo: Parcel = {
        length: Number(length),
        width: Number(width),
        height: Number(height),
        weight: Number(weight),
      };

      // Simulate label creation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: 'Label Created',
        description: 'Your shipping label has been successfully created!',
      });
    } catch (error: any) {
      toast({
        title: 'Error Creating Label',
        description: error.message || 'Failed to create shipping label.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleGetRates = async () => {
    if (!apiKey) {
      toast({
        title: 'Missing API Key',
        description: 'Please set your EasyPost API key in settings.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateFormData()) {
      toast({
        title: 'Missing Address Information',
        description: 'Please fill in all address fields before getting rates.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePackageData()) {
      toast({
        title: 'Missing Package Information',
        description: 'Please fill in all package fields before getting rates.',
        variant: 'destructive',
      });
      return;
    }

    setIsFetchingRates(true);
    try {
      const fromAddress = getAddressFromForm('from');
      const toAddress = getAddressFromForm('to');

      const packageInfo: Parcel = {
        length: Number(length),
        width: Number(width),
        height: Number(height),
        weight: Number(weight),
      };

      const rates = await getShippingRates(fromAddress, toAddress, packageInfo);
      setRates(rates);
      toast({
        title: 'Shipping Rates Retrieved',
        description: 'Successfully retrieved shipping rates.',
      });
    } catch (error: any) {
      toast({
        title: 'Error Getting Rates',
        description: error.message || 'Failed to retrieve shipping rates.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingRates(false);
    }
  };

  const getAddressFromForm = (addressType: 'from' | 'to') => {
    const baseAddress = {
      name: addressType === 'from' ? fromName : toName,
      company: addressType === 'from' ? fromCompany : toCompany,
      street1: addressType === 'from' ? fromStreet1 : toStreet1,
      street2: addressType === 'from' ? fromStreet2 : toStreet2,
      city: addressType === 'from' ? fromCity : toCity,
      state: addressType === 'from' ? fromState : toState,
      zip: addressType === 'from' ? fromZip : toZip,
      country: addressType === 'from' ? fromCountry : toCountry,
      phone: addressType === 'from' ? fromPhone : toPhone,
      email: addressType === 'from' ? fromEmail || '' : toEmail || '',
      is_residential: addressType === 'from' ? fromIsResidential : toIsResidential,
    };

    return baseAddress;
  };

  const handlePickupAddressSelect = (address: any) => {
    setPickupAddress(address);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Shipping Label</CardTitle>
          <CardDescription>Fill out the form below to create a shipping label.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="pickup-address">Pickup Address</Label>
            {pickupAddress ? (
              <div className="mt-2">
                <p className="font-medium">{pickupAddress.name}</p>
                {pickupAddress.company && <p>{pickupAddress.company}</p>}
                <p>{pickupAddress.street1}</p>
                {pickupAddress.street2 && <p>{pickupAddress.street2}</p>}
                <p>
                  {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}
                </p>
                <p>{pickupAddress.country}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No pickup address selected.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <AddressForm 
              onAddressChange={(address) => {
                setFromName(address.name || '');
                setFromCompany(address.company || '');
                setFromStreet1(address.street1 || '');
                setFromStreet2(address.street2 || '');
                setFromCity(address.city || '');
                setFromState(address.state || '');
                setFromZip(address.zip || '');
                setFromCountry(address.country || 'US');
                setFromPhone(address.phone || '');
                setFromEmail(address.email || '');
                setFromIsResidential(address.is_residential || false);
              }}
            />
            <AddressForm 
              onAddressChange={(address) => {
                setToName(address.name || '');
                setToCompany(address.company || '');
                setToStreet1(address.street1 || '');
                setToStreet2(address.street2 || '');
                setToCity(address.city || '');
                setToState(address.state || '');
                setToZip(address.zip || '');
                setToCountry(address.country || 'US');
                setToPhone(address.phone || '');
                setToEmail(address.email || '');
                setToIsResidential(address.is_residential || false);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Package Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageForm 
            onPackageChange={(pkg) => {
              setLength(pkg.length || 0);
              setWidth(pkg.width || 0);
              setHeight(pkg.height || 0);
              setWeight(pkg.weight || 0);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGetRates} disabled={isFetchingRates || !isAddressValid || !isPackageValid}>
            {isFetchingRates ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Getting Rates...
              </>
            ) : (
              'Get Shipping Rates'
            )}
          </Button>

          {rates.length > 0 && (
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className={`border rounded-md p-4 cursor-pointer hover:bg-gray-100 ${
                    selectedRate?.id === rate.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedRate(rate)}
                >
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{rate.carrier}</p>
                      <p className="text-xs text-muted-foreground">{rate.service}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {rate.currency} {rate.rate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleCreateLabel} disabled={isCreatingLabel || !selectedRate}>
        {isCreatingLabel ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Label...
          </>
        ) : (
          'Create Shipping Label'
        )}
      </Button>
    </div>
  );
};

export default CreateLabelPage;
