
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useAddressValidation } from '@/hooks/useAddressValidation';
import { useApiKey } from '@/hooks/useApiKey';
import { ShippingAddress, Parcel, ShippingOption } from '@/types/shipping';
import { SavedAddress } from '@/services/AddressService';
import AddressForm from '@/components/shipping/AddressForm';
import PackageForm from '@/components/shipping/PackageForm';
import ShippingRateCard from '@/components/shipping/ShippingRateCard';
import { addressService } from '@/services/AddressService';

const CreateLabelPage = () => {
  const [fromAddress, setFromAddress] = useState<ShippingAddress>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
    residential: false
  });

  const [toAddress, setToAddress] = useState<ShippingAddress>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: '',
    residential: false
  });

  const [parcel, setParcel] = useState<Parcel>({
    length: 0,
    width: 0,
    height: 0,
    weight: 0
  });

  const [availableRates, setAvailableRates] = useState<ShippingOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  const [isGettingRates, setIsGettingRates] = useState(false);

  // Load default pickup address on component mount
  useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const address = await addressService.getDefaultFromAddress();
        if (address) {
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
            email: address.email || '',
            residential: address.is_residential || false
          });
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    loadDefaultAddress();
  }, []);

  const handleGetRates = async () => {
    if (!fromAddress.street1 || !toAddress.street1 || !parcel.weight) {
      console.error('Missing required fields for rate calculation');
      return;
    }

    setIsGettingRates(true);
    try {
      // Mock rate calculation for now
      const mockRates: ShippingOption[] = [
        {
          id: 'rate-1',
          carrier: 'USPS',
          service: 'Ground Advantage',
          rate: 12.50,
          currency: 'USD',
          delivery_days: 3
        },
        {
          id: 'rate-2',
          carrier: 'UPS',
          service: 'Ground',
          rate: 15.75,
          currency: 'USD',
          delivery_days: 2
        }
      ];
      
      setAvailableRates(mockRates);
    } catch (error) {
      console.error('Error getting rates:', error);
    } finally {
      setIsGettingRates(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!selectedRate) {
      console.error('No rate selected');
      return;
    }

    console.log('Creating label with:', {
      fromAddress,
      toAddress,
      parcel,
      selectedRate
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Shipping Label</h1>
        <p className="text-gray-600 mt-2">Enter shipment details to create a shipping label</p>
      </div>

      <Tabs defaultValue="addresses" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="package">Package</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="label">Label</TabsTrigger>
        </TabsList>

        <TabsContent value="addresses" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ship From</CardTitle>
                <CardDescription>Sender information</CardDescription>
              </CardHeader>
              <CardContent>
                <AddressForm
                  onSubmit={(addressData) => {
                    setFromAddress({
                      name: addressData.name || '',
                      company: addressData.company || '',
                      street1: addressData.street1 || '',
                      street2: addressData.street2 || '',
                      city: addressData.city || '',
                      state: addressData.state || '',
                      zip: addressData.zip || '',
                      country: addressData.country || 'US',
                      phone: addressData.phone || '',
                      email: addressData.email || '',
                      residential: addressData.is_residential || false
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ship To</CardTitle>
                <CardDescription>Recipient information</CardDescription>
              </CardHeader>
              <CardContent>
                <AddressForm
                  onSubmit={(addressData) => {
                    setToAddress({
                      name: addressData.name || '',
                      company: addressData.company || '',
                      street1: addressData.street1 || '',
                      street2: addressData.street2 || '',
                      city: addressData.city || '',
                      state: addressData.state || '',
                      zip: addressData.zip || '',
                      country: addressData.country || 'US',
                      phone: addressData.phone || '',
                      email: addressData.email || '',
                      residential: addressData.is_residential || false
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="package" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Information</CardTitle>
              <CardDescription>Enter the dimensions and weight of your package</CardDescription>
            </CardHeader>
            <CardContent>
              <PackageForm
                onPackageChange={(pkg) => {
                  setParcel({
                    length: pkg.length || 0,
                    width: pkg.width || 0,
                    height: pkg.height || 0,
                    weight: pkg.weight || 0
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rates</CardTitle>
              <CardDescription>Get rates and select your preferred shipping option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleGetRates} disabled={isGettingRates}>
                {isGettingRates ? 'Getting Rates...' : 'Get Rates'}
              </Button>

              {availableRates.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Available Rates:</h3>
                  {availableRates.map((rate) => (
                    <ShippingRateCard
                      key={rate.id}
                      rate={{
                        ...rate,
                        rate: rate.rate.toString(),
                        delivery_days: rate.delivery_days,
                        delivery_date: null,
                        list_rate: undefined,
                        retail_rate: undefined,
                        est_delivery_days: rate.delivery_days,
                        isPremium: false,
                        original_rate: undefined
                      }}
                      isSelected={selectedRate?.id === rate.id}
                      onSelect={() => setSelectedRate(rate)}
                      isBestValue={false}
                      isFastest={false}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="label" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Label</CardTitle>
              <CardDescription>Review and create your shipping label</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedRate ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Selected Rate:</h4>
                    <p>{selectedRate.carrier} - {selectedRate.service}</p>
                    <p className="font-bold">${selectedRate.rate}</p>
                  </div>

                  <Button onClick={handleCreateLabel} className="w-full">
                    Create Label
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">Please select a rate first.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateLabelPage;
