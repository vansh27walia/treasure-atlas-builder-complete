
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { addressService } from '@/services/AddressService';
import AddressForm from '@/components/shipping/AddressForm';
import PackageForm from '@/components/shipping/PackageForm';
import { Rate } from '@/types/shipping';
import { useRates } from '@/hooks/useRates';

const ShipToPage = () => {
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

  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);

  const { rates, isLoading: isRatesLoading, error: ratesError, fetchRates } = useRates({
    fromAddress: {
      name: fromName,
      company: fromCompany,
      street1: fromStreet1,
      street2: fromStreet2,
      city: fromCity,
      state: fromState,
      zip: fromZip,
      country: fromCountry,
      phone: fromPhone,
      email: fromEmail,
      is_residential: fromIsResidential,
    },
    toAddress: {
      name: toName,
      company: toCompany,
      street1: toStreet1,
      street2: toStreet2,
      city: toCity,
      state: toState,
      zip: toZip,
      country: toCountry,
      phone: toPhone,
      email: toEmail,
      is_residential: toIsResidential,
    },
    parcel: {
      length,
      width,
      height,
      weight,
    },
  });

  const [pickupAddress, setPickupAddress] = useState(null);

  useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const address = await addressService.getDefaultFromAddress();
        if (address) {
          setPickupAddress({
            ...address,
            id: String(address.id),
            email: address.email || '',
            is_residential: address.is_residential || false
          });
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
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    loadDefaultAddress();
  }, []);

  const validateFormData = (): boolean => {
    if (!fromName || !fromStreet1 || !fromCity || !fromState || !fromZip || !fromCountry) {
      console.error('Missing required "Ship From" fields');
      return false;
    }

    if (!toName || !toStreet1 || !toCity || !toState || !toZip || !toCountry) {
      console.error('Missing required "Ship To" fields');
      return false;
    }

    if (!length || !width || !height || !weight) {
      console.error('Missing required package fields');
      return false;
    }

    return true;
  };

  const handleCreateLabel = async () => {
    if (!validateFormData()) {
      return;
    }

    if (!selectedRate) {
      console.error('No rate selected');
      return;
    }

    console.log('Creating label...');
  };

  const handleGetRates = async () => {
    if (!validateFormData()) {
      return;
    }

    fetchRates();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Pickup Address</CardTitle>
          <CardDescription>
            Select your default pickup address. This will be used as the "Ship From" address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pickupAddress ? (
            <div>
              <p><strong>Name:</strong> {pickupAddress.name}</p>
              <p><strong>Company:</strong> {pickupAddress.company}</p>
              <p><strong>Street 1:</strong> {pickupAddress.street1}</p>
              <p><strong>Street 2:</strong> {pickupAddress.street2}</p>
              <p><strong>City:</strong> {pickupAddress.city}</p>
              <p><strong>State:</strong> {pickupAddress.state}</p>
              <p><strong>Zip:</strong> {pickupAddress.zip}</p>
              <p><strong>Country:</strong> {pickupAddress.country}</p>
            </div>
          ) : (
            <p>No default pickup address set. Please set one in your settings.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Ship From</h3>
              <AddressForm 
                onSubmit={(address) => {
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
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Ship To</h3>
              <AddressForm 
                onSubmit={(address) => {
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
          <CardTitle>Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGetRates} disabled={isRatesLoading} className="mb-4">
            {isRatesLoading ? 'Loading Rates...' : 'Get Rates'}
          </Button>
          {ratesError && <p className="text-red-500">Error: {ratesError.message}</p>}
          {rates && rates.length > 0 ? (
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className={`border p-4 rounded-md cursor-pointer ${
                    selectedRate?.id === rate.id ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedRate(rate)}
                >
                  <p><strong>Carrier:</strong> {rate.carrier}</p>
                  <p><strong>Service:</strong> {rate.service}</p>
                  <p><strong>Rate:</strong> {rate.rate} {rate.currency}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No rates available.</p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleCreateLabel} disabled={!selectedRate}>
        Create Label
      </Button>
    </div>
  );
};

export default ShipToPage;
