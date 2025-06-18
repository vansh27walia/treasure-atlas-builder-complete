
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Calendar, Clock, Truck, PackageCheck, MapPin, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { AddressData, PickupRequestData, carrierService } from '@/services/CarrierService';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { initAddressAutocomplete, extractAddressComponents, loadGoogleMapsAPI } from '@/utils/addressUtils';

interface FormValues {
  name: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  carrierCode: string;
  pickupDate: string;
  timeStart: string;
  timeEnd: string;
  packageCount: number;
  shipmentIds: string;
  instructions: string;
}

const pickupCarriers = [
  { value: 'usps', label: 'USPS' },
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
];

interface SavedAddress {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  company?: string;
  phone?: string;
}

const PickupPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pickupConfirmation, setPickupConfirmation] = useState<any>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const [googlePlacesEnabled, setGooglePlacesEnabled] = useState(false);
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    { id: '1', name: 'Home Office', street: '123 Main St', city: 'Boston', state: 'MA', zip: '02101', country: 'US', company: 'My Company', phone: '555-1234' },
    { id: '2', name: 'Warehouse', street: '456 Storage Ave', city: 'Chicago', state: 'IL', zip: '60007', country: 'US', company: 'Storage Inc.', phone: '555-5678' },
  ]);
  
  const form = useForm<FormValues>({
    defaultValues: {
      country: 'US',
      carrierCode: 'usps',
      packageCount: 1,
      pickupDate: new Date().toISOString().split('T')[0],
      timeStart: '09:00',
      timeEnd: '17:00',
    },
  });
  
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  
  // Initialize Google Places API
  useEffect(() => {
    const initGooglePlaces = async () => {
      try {
        const loaded = await loadGoogleMapsAPI();
        setGooglePlacesEnabled(loaded);
        
        if (loaded && streetInputRef.current) {
          console.log('Google Places API loaded successfully, initializing autocomplete');
          
          initAddressAutocomplete(streetInputRef.current, (place) => {
            if (place && place.address_components) {
              const addressComponents = extractAddressComponents(place);
              
              form.setValue('street1', addressComponents.street1);
              form.setValue('city', addressComponents.city);
              form.setValue('state', addressComponents.state);
              form.setValue('zip', addressComponents.zip);
              form.setValue('country', addressComponents.country);
              
              toast.success('Address found and auto-filled');
            }
          });
        }
      } catch (error) {
        console.error('Error initializing Google Places:', error);
      }
    };
    
    initGooglePlaces();
  }, [form]);
  
  const handleSelectAddress = (addressId: string) => {
    const address = savedAddresses.find(addr => addr.id === addressId);
    if (address) {
      form.setValue('name', address.name);
      form.setValue('company', address.company || '');
      form.setValue('street1', address.street);
      form.setValue('city', address.city);
      form.setValue('state', address.state);
      form.setValue('zip', address.zip);
      form.setValue('country', address.country || 'US');
      form.setValue('phone', address.phone || '');
      setSelectedAddress(addressId);
    }
  };
  
  const savePickupAddress = () => {
    try {
      const values = form.getValues();
      
      // Create a new address object
      const newAddress: SavedAddress = {
        id: String(Date.now()),
        name: values.name,
        street: values.street1,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        company: values.company,
        phone: values.phone,
      };
      
      // Add the new address to the saved addresses array
      setSavedAddresses(prev => [...prev, newAddress]);
      setSelectedAddress(newAddress.id);
      
      toast.success('Pickup address saved successfully!');
    } catch (error) {
      console.error('Error saving pickup address:', error);
      toast.error('Failed to save pickup address. Please try again.');
    }
  };
  
  const [pickupRates, setPickupRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [isGettingRates, setIsGettingRates] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const getPickupRates = async () => {
    const values = form.getValues();
    
    // Validate required fields
    if (!values.name || !values.street1 || !values.city || !values.state || !values.zip || !values.phone) {
      toast.error('Please fill in all required address fields');
      return;
    }

    setIsGettingRates(true);
    try {
      const pickupAddress = {
        name: values.name,
        company: values.company || undefined,
        street1: values.street1,
        street2: values.street2 || undefined,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        phone: values.phone
      };

      const shipmentIdArray = values.shipmentIds
        ? values.shipmentIds.split(',').map(id => id.trim())
        : [];

      const pickupDateTime = new Date(`${values.pickupDate}T${values.timeStart}`);
      const pickupEndDateTime = new Date(`${values.pickupDate}T${values.timeEnd}`);

      const requestData = {
        address: pickupAddress,
        min_datetime: pickupDateTime.toISOString(),
        max_datetime: pickupEndDateTime.toISOString(),
        shipment_ids: shipmentIdArray.length > 0 ? shipmentIdArray : undefined,
        is_account_address: false,
        instructions: values.instructions
      };

      // Call the rate fetching endpoint (we'll create this)
      const { data, error } = await supabase.functions.invoke('get-pickup-rates', {
        body: requestData
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPickupRates(data.pickup_rates || []);
      toast.success('Pickup rates retrieved successfully!');
    } catch (error) {
      console.error('Error getting pickup rates:', error);
      toast.error('Failed to get pickup rates. Please try again.');
    } finally {
      setIsGettingRates(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!selectedRate) {
      toast.error('Please select a pickup rate');
      return;
    }

    setPaymentProcessing(true);
    try {
      const values = form.getValues();
      
      const pickupAddress = {
        name: values.name,
        company: values.company || undefined,
        street1: values.street1,
        street2: values.street2 || undefined,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        phone: values.phone
      };

      const shipmentIdArray = values.shipmentIds
        ? values.shipmentIds.split(',').map(id => id.trim())
        : [];

      const pickupDateTime = new Date(`${values.pickupDate}T${values.timeStart}`);
      const pickupEndDateTime = new Date(`${values.pickupDate}T${values.timeEnd}`);

      const requestData = {
        address: pickupAddress,
        min_datetime: pickupDateTime.toISOString(),
        max_datetime: pickupEndDateTime.toISOString(),
        shipment_ids: shipmentIdArray.length > 0 ? shipmentIdArray : undefined,
        is_account_address: false,
        instructions: values.instructions,
        selected_rate: selectedRate
      };

      const { data, error } = await supabase.functions.invoke('create-pickup', {
        body: requestData
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPickupConfirmation({
        confirmation: data.confirmation,
        carrier: selectedRate.carrier,
        scheduledDate: values.pickupDate,
        timeWindow: {
          start: values.timeStart,
          end: values.timeEnd
        },
        address: pickupAddress,
        packageCount: values.packageCount,
        cost: data.cost
      });

      toast.success('Pickup scheduled and payment processed successfully!');
    } catch (error) {
      console.error('Error confirming pickup:', error);
      toast.error('Failed to confirm pickup. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Parse shipment IDs from comma-separated string
      const shipmentIdArray = values.shipmentIds
        ? values.shipmentIds.split(',').map(id => id.trim())
        : [];
      
      if (shipmentIdArray.length === 0) {
        throw new Error('At least one shipment ID is required');
      }
      
      const pickupAddress: AddressData = {
        name: values.name,
        company: values.company || undefined,
        street1: values.street1,
        street2: values.street2 || undefined,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        phone: values.phone || undefined,
      };
      
      const requestData: PickupRequestData = {
        carrierCode: values.carrierCode,
        shipmentIds: shipmentIdArray,
        pickupAddress,
        pickupDate: values.pickupDate,
        pickupTimeWindow: {
          start: values.timeStart,
          end: values.timeEnd,
        },
        instructions: values.instructions,
        packageCount: values.packageCount,
      };
      
      // In a real app, this would call a real API
      const response = await carrierService.schedulePickup(requestData);
      
      setPickupConfirmation(response);
      toast.success('Pickup scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      toast.error('Failed to schedule pickup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
        <h1 className="text-3xl font-bold text-purple-800 flex items-center">
          <Truck className="mr-3 h-8 w-8 text-purple-600" /> 
          Schedule a Pickup
        </h1>
      </div>
      
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 p-2 bg-purple-50">
          <TabsTrigger value="schedule" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
            <Calendar className="mr-2 h-5 w-5" />
            Schedule New Pickup
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
            <Clock className="mr-2 h-5 w-5" />
            Manage Pickups
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          {!pickupConfirmation ? (
            <Card className="border-2 border-gray-200 shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <PackageCheck className="mr-2 h-6 w-6 text-purple-600" />
                Schedule Carrier Pickup
              </h2>
              
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-purple-500" />
                        Pickup Address
                      </h3>
                      <Select value={selectedAddress} onValueChange={handleSelectAddress}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Saved Addresses" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedAddresses.map((address) => (
                            <SelectItem key={address.id} value={address.id}>
                              {address.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" {...form.register('name')} placeholder="Name" required />
                      </div>
                      
                      <div>
                        <Label htmlFor="company">Company (optional)</Label>
                        <Input id="company" {...form.register('company')} placeholder="Company" />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" {...form.register('phone')} placeholder="Phone Number" required />
                      </div>
                      
                      <div>
                        <Label htmlFor="street1">Address Line 1</Label>
                        <Input 
                          id="street1" 
                          {...form.register('street1')} 
                          placeholder="Street address" 
                          required 
                          ref={streetInputRef}
                          className={googlePlacesEnabled ? "border-blue-300" : ""}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="street2">Address Line 2 (optional)</Label>
                        <Input id="street2" {...form.register('street2')} placeholder="Apt, Suite, Unit, etc." />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input id="city" {...form.register('city')} placeholder="City" required />
                        </div>
                        
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input id="state" {...form.register('state')} placeholder="State" required />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zip">ZIP Code</Label>
                          <Input id="zip" {...form.register('zip')} placeholder="ZIP Code" required />
                        </div>
                        
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input id="country" {...form.register('country')} placeholder="Country" required />
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={savePickupAddress}
                        >
                          Save this address
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <Truck className="mr-2 h-5 w-5 text-purple-500" />
                      Pickup Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="carrierCode">Carrier</Label>
                        <Select defaultValue="usps" onValueChange={(value) => form.setValue('carrierCode', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Carrier" />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupCarriers.map((carrier) => (
                              <SelectItem key={carrier.value} value={carrier.value}>
                                {carrier.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="shipmentIds">Shipment ID(s)</Label>
                        <Input 
                          id="shipmentIds" 
                          {...form.register('shipmentIds')} 
                          placeholder="Comma-separated shipment IDs" 
                          required 
                        />
                        <p className="text-sm text-gray-500 mt-1">Enter one or more shipment IDs separated by commas</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <Label htmlFor="packageCount">Package Count</Label>
                          <Input 
                            id="packageCount" 
                            type="number" 
                            min="1"
                            {...form.register('packageCount', { valueAsNumber: true })}
                            required
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label htmlFor="pickupDate">Pickup Date</Label>
                          <Input 
                            id="pickupDate" 
                            type="date" 
                            {...form.register('pickupDate')} 
                            required
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="timeStart">Start Time</Label>
                          <Input 
                            id="timeStart" 
                            type="time" 
                            {...form.register('timeStart')} 
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="timeEnd">End Time</Label>
                          <Input 
                            id="timeEnd" 
                            type="time" 
                            {...form.register('timeEnd')} 
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="instructions">Special Instructions (optional)</Label>
                        <Input 
                          id="instructions" 
                          {...form.register('instructions')} 
                          placeholder="Ring doorbell, leave at dock, etc."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-8" />
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-white px-8"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Scheduling Pickup...
                      </>
                    ) : (
                      <>
                        <Truck className="h-5 w-5" />
                        Schedule Pickup
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="border-2 border-green-200 bg-green-50 shadow-sm p-6 mb-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600 mr-4" />
                <h2 className="text-2xl font-bold text-green-800">Pickup Scheduled Successfully!</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Confirmation Number</h3>
                    <p className="text-xl font-mono bg-white border border-green-200 rounded p-2 mt-1">
                      {pickupConfirmation.confirmation}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Carrier</h3>
                    <p className="text-lg">{pickupConfirmation.carrier}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Pickup Date</h3>
                    <p className="text-lg">{new Date(pickupConfirmation.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Pickup Time</h3>
                    <p className="text-lg">
                      {pickupConfirmation.timeWindow.start} - {pickupConfirmation.timeWindow.end}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-700">Pickup Location</h3>
                    <div className="bg-white border border-green-200 rounded p-3 mt-1">
                      <p>{pickupConfirmation.address.name}</p>
                      <p>{pickupConfirmation.address.street1}</p>
                      {pickupConfirmation.address.street2 && <p>{pickupConfirmation.address.street2}</p>}
                      <p>
                        {pickupConfirmation.address.city}, {pickupConfirmation.address.state} {pickupConfirmation.address.zip}
                      </p>
                      <p>{pickupConfirmation.address.country}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Package Count</h3>
                    <p className="text-lg">{pickupConfirmation.packageCount}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-700">Total Cost</h3>
                    <p className="text-xl font-bold text-green-800">${pickupConfirmation.cost}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => setPickupConfirmation(null)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Schedule Another Pickup
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="manage">
          <Card className="border-2 border-gray-200 shadow-sm p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <Clock className="mr-2 h-6 w-6 text-purple-600" />
              Manage Scheduled Pickups
            </h2>
            
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-gray-600">You have no scheduled pickups at this time.</p>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => document.querySelector('[data-value="schedule"]')?.dispatchEvent(
                  new MouseEvent('click', { bubbles: true })
                )}
              >
                <Truck className="mr-2 h-5 w-5" />
                Schedule New Pickup
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 border-2 border-purple-100 bg-purple-50">
          <h3 className="text-lg font-semibold mb-3 text-purple-800 flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-purple-600" />
            Flexible Scheduling
          </h3>
          <p className="text-purple-700 mb-2">Schedule pickups on your terms with flexible timeframes and same-day service available in many areas.</p>
        </Card>
        
        <Card className="p-6 border-2 border-green-100 bg-green-50">
          <h3 className="text-lg font-semibold mb-3 text-green-800 flex items-center">
            <Truck className="mr-2 h-5 w-5 text-green-600" />
            Multiple Carriers
          </h3>
          <p className="text-green-700 mb-2">Choose from multiple carriers including USPS, UPS, and FedEx for your shipping pickup needs.</p>
        </Card>
        
        <Card className="p-6 border-2 border-blue-100 bg-blue-50">
          <h3 className="text-lg font-semibold mb-3 text-blue-800 flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
            Pickup Confirmations
          </h3>
          <p className="text-blue-700 mb-2">Receive instant confirmations and notifications for all your scheduled pickups.</p>
        </Card>
      </div>
    </div>
  );
};

export default PickupPage;
