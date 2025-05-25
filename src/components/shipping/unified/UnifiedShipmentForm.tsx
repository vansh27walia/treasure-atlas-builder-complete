
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CalendarDays, MapPin, Package, Truck, Ship, Settings, TestTube, AlertTriangle, CheckCircle, Key, Save, Play } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddressAutoComplete from '../AddressAutoComplete';
import ApiKeySettings from './ApiKeySettings';
import { supabase } from '@/integrations/supabase/client';
import { userProfileService } from '@/services/UserProfileService';

export type ShipmentType = 'ltl' | 'ftl' | 'heavy-parcel';

interface CommonFields {
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  pickupTimeWindow: string;
  deliveryDate: string;
  deliveryTimeWindow: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  insuranceRequired: boolean;
  specialInstructions: string;
}

interface LTLFields {
  handlingUnits: number;
  unitType: string;
  weightPerUnit: number;
  weightUnit: string;
  length: number;
  width: number;
  height: number;
  dimensionUnit: string;
  freightClass: string;
  liftgateRequired: boolean;
  appointmentRequired: boolean;
}

interface FTLFields {
  equipmentType: string;
  numberOfTrucks: number;
  totalWeight: number;
  weightUnit: string;
  totalLength: number;
  totalWidth: number;
  totalHeight: number;
  dimensionUnit: string;
  accessorialServices: string[];
}

interface HeavyParcelFields {
  shipmentTitle: string;
  materialType: string;
  parcelCount: number;
  weightPerParcel: number;
  weightUnit: string;
  length: number;
  width: number;
  height: number;
  dimensionUnit: string;
  cubicVolume: number;
  pickupPort: string;
  deliveryPort: string;
  specialHandlingNotes: string;
  additionalServices: string[];
}

interface ShipmentData {
  type: ShipmentType;
  common: CommonFields;
  ltl?: LTLFields;
  ftl?: FTLFields;
  heavyParcel?: HeavyParcelFields;
}

interface RateOption {
  id: string;
  carrier: string;
  serviceLevel: string;
  rateAmount: number;
  transitTime: string;
  insuranceOptions: string;
}

const UnifiedShipmentForm: React.FC = () => {
  const [activeType, setActiveType] = useState<ShipmentType>('ltl');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [rateOptions, setRateOptions] = useState<RateOption[]>([]);
  const [selectedRate, setSelectedRate] = useState<RateOption | null>(null);
  const [bookingConfirmation, setBookingConfirmation] = useState<any>(null);

  const [shipmentData, setShipmentData] = useState<ShipmentData>({
    type: 'ltl',
    common: {
      pickupAddress: '',
      deliveryAddress: '',
      pickupDate: '',
      pickupTimeWindow: '9:00-17:00',
      deliveryDate: '',
      deliveryTimeWindow: '9:00-17:00',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      insuranceRequired: false,
      specialInstructions: ''
    },
    ltl: {
      handlingUnits: 1,
      unitType: 'Pallet',
      weightPerUnit: 100,
      weightUnit: 'lbs',
      length: 48,
      width: 40,
      height: 48,
      dimensionUnit: 'inches',
      freightClass: '70',
      liftgateRequired: false,
      appointmentRequired: false
    },
    ftl: {
      equipmentType: 'Dry Van',
      numberOfTrucks: 1,
      totalWeight: 25000,
      weightUnit: 'lbs',
      totalLength: 53,
      totalWidth: 8.5,
      totalHeight: 9,
      dimensionUnit: 'feet',
      accessorialServices: []
    },
    heavyParcel: {
      shipmentTitle: '',
      materialType: 'Machinery',
      parcelCount: 1,
      weightPerParcel: 500,
      weightUnit: 'lbs',
      length: 60,
      width: 48,
      height: 60,
      dimensionUnit: 'inches',
      cubicVolume: 0,
      pickupPort: '',
      deliveryPort: '',
      specialHandlingNotes: '',
      additionalServices: []
    }
  });

  // Calculate cubic volume for heavy parcels
  useEffect(() => {
    if (activeType === 'heavy-parcel' && shipmentData.heavyParcel) {
      const { length, width, height, dimensionUnit } = shipmentData.heavyParcel;
      let volume = length * width * height;
      
      // Convert to cubic meters if needed
      if (dimensionUnit === 'inches') {
        volume = volume / 61023.7; // Convert cubic inches to cubic meters
      } else {
        volume = volume / 35.3147; // Convert cubic feet to cubic meters
      }
      
      setShipmentData(prev => ({
        ...prev,
        heavyParcel: {
          ...prev.heavyParcel!,
          cubicVolume: Math.round(volume * 100) / 100
        }
      }));
    }
  }, [activeType, shipmentData.heavyParcel?.length, shipmentData.heavyParcel?.width, shipmentData.heavyParcel?.height, shipmentData.heavyParcel?.dimensionUnit]);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const credentials = await userProfileService.getUShipCredentials();
      setHasApiKey(!!credentials?.apiKey);
    } catch (error) {
      console.error('Error checking API key:', error);
    }
  };

  const handleTypeChange = (type: ShipmentType) => {
    setActiveType(type);
    setShipmentData(prev => ({ ...prev, type }));
    setRateOptions([]);
    setSelectedRate(null);
    setBookingConfirmation(null);
  };

  const updateCommonField = (field: keyof CommonFields, value: any) => {
    setShipmentData(prev => ({
      ...prev,
      common: { ...prev.common, [field]: value }
    }));
  };

  const updateTypeSpecificField = (field: string, value: any) => {
    setShipmentData(prev => ({
      ...prev,
      [activeType === 'heavy-parcel' ? 'heavyParcel' : activeType]: {
        ...prev[activeType === 'heavy-parcel' ? 'heavyParcel' : activeType],
        [field]: value
      }
    }));
  };

  const populateMockData = () => {
    setShipmentData(prev => ({
      ...prev,
      common: {
        pickupAddress: '123 Warehouse St, Los Angeles, CA 90210',
        deliveryAddress: '456 Distribution Ave, Phoenix, AZ 85001',
        pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        pickupTimeWindow: '9:00-12:00',
        deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        deliveryTimeWindow: '13:00-17:00',
        contactName: 'John Smith',
        contactPhone: '+1-555-123-4567',
        contactEmail: 'john.smith@example.com',
        insuranceRequired: true,
        specialInstructions: 'Please call before delivery. Loading dock access required.'
      }
    }));
    toast.success('Sample data loaded for testing');
  };

  const handleGetRates = async () => {
    if (!shipmentData.common.pickupAddress || !shipmentData.common.deliveryAddress) {
      toast.error('Please enter pickup and delivery addresses');
      return;
    }

    if (!hasApiKey) {
      toast.error('Please configure your uShip API key first');
      setShowApiSettings(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('uship-rates', {
        body: { 
          shipmentData: shipmentData,
          testMode: testMode
        }
      });

      if (error) throw error;

      if (data?.rates && data.rates.length > 0) {
        setRateOptions(data.rates);
        toast.success(`Found ${data.rates.length} shipping options`);
      } else {
        // Enhanced mock rates for better testing
        const mockRates: RateOption[] = [
          {
            id: 'rate_1',
            carrier: 'Express Freight Solutions',
            serviceLevel: 'Standard',
            rateAmount: 850.00,
            transitTime: '3-5 business days',
            insuranceOptions: 'Up to $50,000 coverage'
          },
          {
            id: 'rate_2', 
            carrier: 'Premium Logistics',
            serviceLevel: 'Express',
            rateAmount: 1200.00,
            transitTime: '1-2 business days',
            insuranceOptions: 'Up to $100,000 coverage'
          },
          {
            id: 'rate_3',
            carrier: 'Economy Transport',
            serviceLevel: 'Economy',
            rateAmount: 650.00,
            transitTime: '5-7 business days',
            insuranceOptions: 'Up to $25,000 coverage'
          }
        ];
        setRateOptions(mockRates);
        toast.success('Showing sample rates for testing');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Unable to fetch rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookLoad = async () => {
    if (!selectedRate) {
      toast.error('Please select a rate option');
      return;
    }

    setIsLoading(true);
    try {
      // Mock booking confirmation
      const mockBooking = {
        bookingId: `BOOK_${Date.now()}`,
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        carrier: selectedRate.carrier,
        serviceLevel: selectedRate.serviceLevel,
        totalAmount: selectedRate.rateAmount,
        estimatedDelivery: shipmentData.common.deliveryDate,
        status: testMode ? 'Test Booking' : 'Confirmed'
      };

      setBookingConfirmation(mockBooking);
      toast.success(testMode ? 'Test booking created successfully!' : 'Booking confirmed!');
    } catch (error) {
      console.error('Error booking shipment:', error);
      toast.error('Failed to book shipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectLabel = () => {
    if (!bookingConfirmation) return;
    
    // Mock label and BOL URLs
    const mockDocuments = {
      labelUrl: `https://example.com/test-label-${bookingConfirmation.bookingId}.pdf`,
      bolUrl: `https://example.com/test-bol-${bookingConfirmation.bookingId}.pdf`
    };

    toast.success(testMode ? 'Test documents generated!' : 'Documents ready for download');
    
    // In a real implementation, these would be actual PDF URLs
    window.open(mockDocuments.labelUrl, '_blank');
    window.open(mockDocuments.bolUrl, '_blank');
  };

  const handlePickupAddressSelected = (place: any) => {
    if (place && place.formatted_address) {
      updateCommonField('pickupAddress', place.formatted_address);
    }
  };

  const handleDeliveryAddressSelected = (place: any) => {
    if (place && place.formatted_address) {
      updateCommonField('deliveryAddress', place.formatted_address);
    }
  };

  if (showApiSettings) {
    return <ApiKeySettings onClose={() => {
      setShowApiSettings(false);
      checkApiKey();
    }} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Test Mode Toggle */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-4xl font-bold text-blue-800 mr-6">Ship Your Freight</h1>
          
          {/* Test Mode Toggle */}
          <div className="flex items-center space-x-4 bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            <TestTube className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Test Mode</span>
            <Switch 
              checked={testMode} 
              onCheckedChange={setTestMode}
              className="data-[state=checked]:bg-green-600"
            />
            <Play className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Live Mode</span>
          </div>
        </div>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
          Get instant quotes and book your shipment in minutes. Compare rates from top carriers for LTL, Full Truckload, and Heavy Parcel shipping.
        </p>
        
        {testMode && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            TEST MODE - No billing will occur
          </Badge>
        )}
      </div>

      {/* API Key Status - Enhanced UI */}
      {!hasApiKey && (
        <Card className="mb-6 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Key className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">Setup Required</h3>
                  <p className="text-amber-700 text-sm">
                    Configure your uShip API key to get live shipping rates and book shipments
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowApiSettings(true)} 
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2"
              >
                <Key className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasApiKey && (
        <Card className="mb-6 border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Ready to Ship</h3>
                  <p className="text-green-700 text-sm">
                    Your uShip API is configured and ready for {testMode ? 'test' : 'live'} shipping
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {testMode ? 'Test Mode' : 'Live Mode'}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowApiSettings(true)}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 shadow-lg border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl text-blue-800">Choose Your Shipment Type</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={populateMockData}
              className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
            >
              <Package className="h-4 w-4 mr-2" />
              Fill Sample Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeType} onValueChange={(value) => handleTypeChange(value as ShipmentType)}>
            <TabsList className="grid w-full grid-cols-3 mb-6 h-16">
              <TabsTrigger 
                value="ltl" 
                className="flex flex-col items-center space-y-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                <Package className="h-5 w-5" />
                <span className="text-sm font-medium">LTL Freight</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ftl" 
                className="flex flex-col items-center space-y-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                <Truck className="h-5 w-5" />
                <span className="text-sm font-medium">Full Truckload</span>
              </TabsTrigger>
              <TabsTrigger 
                value="heavy-parcel" 
                className="flex flex-col items-center space-y-1 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800"
              >
                <Ship className="h-5 w-5" />
                <span className="text-sm font-medium">Heavy Parcel</span>
              </TabsTrigger>
            </TabsList>

            {/* Shipping Details Section */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-semibold mb-6 flex items-center text-blue-800">
                  <MapPin className="h-6 w-6 mr-3 text-blue-600" />
                  Shipping Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="pickup-address" className="text-sm font-semibold text-gray-700 mb-2 block">
                      From (Pickup Address) *
                    </Label>
                    <AddressAutoComplete
                      defaultValue={shipmentData.common.pickupAddress}
                      onAddressSelected={handlePickupAddressSelected}
                      onChange={(value) => updateCommonField('pickupAddress', value)}
                      placeholder="Enter pickup address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-address" className="text-sm font-semibold text-gray-700 mb-2 block">
                      To (Delivery Address) *
                    </Label>
                    <AddressAutoComplete
                      defaultValue={shipmentData.common.deliveryAddress}
                      onAddressSelected={handleDeliveryAddressSelected}
                      onChange={(value) => updateCommonField('deliveryAddress', value)}
                      placeholder="Enter delivery address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="pickup-date" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Pickup Date
                    </Label>
                    <Input
                      id="pickup-date"
                      type="date"
                      value={shipmentData.common.pickupDate}
                      onChange={(e) => updateCommonField('pickupDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-date" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Delivery Date
                    </Label>
                    <Input
                      id="delivery-date"
                      type="date"
                      value={shipmentData.common.deliveryDate}
                      onChange={(e) => updateCommonField('deliveryDate', e.target.value)}
                      min={shipmentData.common.pickupDate || new Date().toISOString().split('T')[0]}
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="contact-name" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Contact Name
                    </Label>
                    <Input
                      id="contact-name"
                      value={shipmentData.common.contactName}
                      onChange={(e) => updateCommonField('contactName', e.target.value)}
                      placeholder="Your name"
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-phone" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Phone Number
                    </Label>
                    <Input
                      id="contact-phone"
                      value={shipmentData.common.contactPhone}
                      onChange={(e) => updateCommonField('contactPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-email" className="text-sm font-semibold text-gray-700 mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={shipmentData.common.contactEmail}
                      onChange={(e) => updateCommonField('contactEmail', e.target.value)}
                      placeholder="your@email.com"
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Shipment Type Specific Fields */}
              <TabsContent value="ltl" className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-xl font-semibold mb-6 text-green-800">LTL Freight Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Number of Units</Label>
                      <Input
                        type="number"
                        min="1"
                        value={shipmentData.ltl?.handlingUnits || 1}
                        onChange={(e) => updateTypeSpecificField('handlingUnits', parseInt(e.target.value))}
                        className="border-2 border-gray-300 focus:border-green-500"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Unit Type</Label>
                      <Select value={shipmentData.ltl?.unitType} onValueChange={(value) => updateTypeSpecificField('unitType', value)}>
                        <SelectTrigger className="border-2 border-gray-300 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pallet">Pallets</SelectItem>
                          <SelectItem value="Crate">Crates</SelectItem>
                          <SelectItem value="Drum">Drums</SelectItem>
                          <SelectItem value="Box">Boxes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Freight Class</Label>
                      <Select value={shipmentData.ltl?.freightClass} onValueChange={(value) => updateTypeSpecificField('freightClass', value)}>
                        <SelectTrigger className="border-2 border-gray-300 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">Class 50</SelectItem>
                          <SelectItem value="55">Class 55</SelectItem>
                          <SelectItem value="60">Class 60</SelectItem>
                          <SelectItem value="65">Class 65</SelectItem>
                          <SelectItem value="70">Class 70</SelectItem>
                          <SelectItem value="77.5">Class 77.5</SelectItem>
                          <SelectItem value="85">Class 85</SelectItem>
                          <SelectItem value="92.5">Class 92.5</SelectItem>
                          <SelectItem value="100">Class 100</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Weight per Unit</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={shipmentData.ltl?.weightPerUnit || 100}
                          onChange={(e) => updateTypeSpecificField('weightPerUnit', parseFloat(e.target.value))}
                          placeholder="Weight"
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                        <Select value={shipmentData.ltl?.weightUnit} onValueChange={(value) => updateTypeSpecificField('weightUnit', value)}>
                          <SelectTrigger className="w-20 border-2 border-gray-300 focus:border-green-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lbs">lbs</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Dimensions (L × W × H)</Label>
                      <div className="flex space-x-1">
                        <Input
                          type="number"
                          min="1"
                          placeholder="L"
                          value={shipmentData.ltl?.length || 48}
                          onChange={(e) => updateTypeSpecificField('length', parseFloat(e.target.value))}
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="W"
                          value={shipmentData.ltl?.width || 40}
                          onChange={(e) => updateTypeSpecificField('width', parseFloat(e.target.value))}
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="H"
                          value={shipmentData.ltl?.height || 48}
                          onChange={(e) => updateTypeSpecificField('height', parseFloat(e.target.value))}
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                        <Select value={shipmentData.ltl?.dimensionUnit} onValueChange={(value) => updateTypeSpecificField('dimensionUnit', value)}>
                          <SelectTrigger className="w-20 border-2 border-gray-300 focus:border-green-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inches">in</SelectItem>
                            <SelectItem value="cm">cm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ftl" className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-xl font-semibold mb-6 text-blue-800">Full Truckload Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Equipment Type</Label>
                      <Select value={shipmentData.ftl?.equipmentType} onValueChange={(value) => updateTypeSpecificField('equipmentType', value)}>
                        <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dry Van">Dry Van (53ft)</SelectItem>
                          <SelectItem value="Flatbed">Flatbed</SelectItem>
                          <SelectItem value="Refrigerated">Refrigerated (Reefer)</SelectItem>
                          <SelectItem value="Step Deck">Step Deck</SelectItem>
                          <SelectItem value="Lowboy">Lowboy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Total Weight</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={shipmentData.ftl?.totalWeight || 25000}
                          onChange={(e) => updateTypeSpecificField('totalWeight', parseFloat(e.target.value))}
                          placeholder="Weight"
                          className="border-2 border-gray-300 focus:border-blue-500"
                        />
                        <Select value={shipmentData.ftl?.weightUnit} onValueChange={(value) => updateTypeSpecificField('weightUnit', value)}>
                          <SelectTrigger className="w-20 border-2 border-gray-300 focus:border-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lbs">lbs</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="heavy-parcel" className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-xl font-semibold mb-6 text-purple-800">Heavy Parcel Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Shipment Description</Label>
                      <Input
                        value={shipmentData.heavyParcel?.shipmentTitle || ''}
                        onChange={(e) => updateTypeSpecificField('shipmentTitle', e.target.value)}
                        placeholder="Describe what you're shipping"
                        className="border-2 border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Material Type</Label>
                      <Select value={shipmentData.heavyParcel?.materialType} onValueChange={(value) => updateTypeSpecificField('materialType', value)}>
                        <SelectTrigger className="border-2 border-gray-300 focus:border-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Machinery">Machinery</SelectItem>
                          <SelectItem value="Industrial Equipment">Industrial Equipment</SelectItem>
                          <SelectItem value="Vehicle">Vehicle</SelectItem>
                          <SelectItem value="Construction Materials">Construction Materials</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Number of Pieces</Label>
                      <Input
                        type="number"
                        min="1"
                        value={shipmentData.heavyParcel?.parcelCount || 1}
                        onChange={(e) => updateTypeSpecificField('parcelCount', parseInt(e.target.value))}
                        className="border-2 border-gray-300 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Weight per Piece</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={shipmentData.heavyParcel?.weightPerParcel || 500}
                          onChange={(e) => updateTypeSpecificField('weightPerParcel', parseFloat(e.target.value))}
                          className="border-2 border-gray-300 focus:border-purple-500"
                        />
                        <Select value={shipmentData.heavyParcel?.weightUnit} onValueChange={(value) => updateTypeSpecificField('weightUnit', value)}>
                          <SelectTrigger className="w-20 border-2 border-gray-300 focus:border-purple-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="lbs">lbs</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">Cubic Volume</Label>
                      <div className="bg-white px-3 py-2 border-2 border-gray-300 rounded text-sm font-medium">
                        {shipmentData.heavyParcel?.cubicVolume || 0} CBM
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Additional Options */}
              <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="insurance-required"
                    checked={shipmentData.common.insuranceRequired}
                    onCheckedChange={(checked) => updateCommonField('insuranceRequired', checked)}
                    className="border-2 border-gray-400"
                  />
                  <Label htmlFor="insurance-required" className="text-sm font-semibold text-gray-700">
                    Add insurance coverage
                  </Label>
                </div>

                <div>
                  <Label htmlFor="special-instructions" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id="special-instructions"
                    value={shipmentData.common.specialInstructions}
                    onChange={(e) => updateCommonField('specialInstructions', e.target.value)}
                    placeholder="Any special handling requirements, delivery instructions, etc."
                    rows={3}
                    className="border-2 border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleGetRates}
                disabled={isLoading || !hasApiKey}
                size="lg"
                className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg border-0"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Getting Rates...
                  </>
                ) : (
                  <>
                    <Truck className="h-5 w-5 mr-3" />
                    Get Shipping Rates
                  </>
                )}
              </Button>
            </div>

            {/* Rate Options Display - Enhanced */}
            {rateOptions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Choose Your Rate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rateOptions.map((rate) => (
                    <Card 
                      key={rate.id} 
                      className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                        selectedRate?.id === rate.id 
                          ? 'ring-4 ring-blue-300 bg-blue-50 border-blue-400 shadow-xl' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedRate(rate)}
                    >
                      <CardContent className="p-6">
                        <div className="text-center">
                          <h4 className="font-bold text-lg mb-2 text-gray-800">{rate.carrier}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`mb-4 ${
                              selectedRate?.id === rate.id 
                                ? 'bg-blue-200 text-blue-800' 
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {rate.serviceLevel}
                          </Badge>
                          <div className="text-4xl font-bold text-green-600 mb-4">
                            ${rate.rateAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-2">
                            <p><strong>Transit:</strong> {rate.transitTime}</p>
                            <p><strong>Insurance:</strong> {rate.insuranceOptions}</p>
                          </div>
                          {selectedRate?.id === rate.id && (
                            <div className="mt-4">
                              <Badge variant="default" className="bg-blue-600 text-white">
                                ✓ Selected
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedRate && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleBookLoad}
                      disabled={isLoading}
                      size="lg"
                      className="px-12 py-4 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg border-0"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                          Booking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 mr-3" />
                          Book This Shipment
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Booking Confirmation - Enhanced */}
            {bookingConfirmation && (
              <div className="mt-8">
                <Card className="border-4 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center justify-center text-2xl">
                      <CheckCircle className="h-8 w-8 mr-3" />
                      Shipment Booked Successfully!
                      <Badge variant="outline" className="ml-3 text-lg px-3 py-1">
                        {testMode ? 'Test Mode' : 'Live Mode'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-6 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left bg-white rounded-lg p-6 border border-green-200">
                      <div className="space-y-3">
                        <p className="text-lg"><strong>Booking ID:</strong> {bookingConfirmation.bookingId}</p>
                        <p className="text-lg"><strong>Tracking Number:</strong> {bookingConfirmation.trackingNumber}</p>
                        <p className="text-lg"><strong>Status:</strong> 
                          <Badge className="ml-2 bg-green-600 text-white">
                            {bookingConfirmation.status}
                          </Badge>
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-lg"><strong>Carrier:</strong> {bookingConfirmation.carrier}</p>
                        <p className="text-lg"><strong>Service:</strong> {bookingConfirmation.serviceLevel}</p>
                        <p className="text-lg"><strong>Total Cost:</strong> 
                          <span className="text-green-600 font-bold text-xl ml-2">
                            ${bookingConfirmation.totalAmount.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-6 space-y-4">
                      <Button 
                        onClick={handleDirectLabel} 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg shadow-lg"
                      >
                        <Save className="h-5 w-5 mr-3" />
                        Download {testMode ? 'Test ' : ''}Labels & BOL
                      </Button>
                      <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                        📧 A confirmation email will be sent to <strong>{shipmentData.common.contactEmail}</strong>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedShipmentForm;
