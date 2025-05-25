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
import { Calendar, CalendarDays, MapPin, Package, Truck, Ship, Settings, TestTube, AlertTriangle, CheckCircle } from 'lucide-react';
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
          testMode: true
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

  const handlePickupAddressSelected = (place: GoogleMapsPlace) => {
    if (place && place.formatted_address) {
      updateCommonField('pickupAddress', place.formatted_address);
    }
  };

  const handleDeliveryAddressSelected = (place: GoogleMapsPlace) => {
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
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-800 mb-4">Ship Your Freight</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Get instant quotes and book your shipment in minutes. Compare rates from top carriers for LTL, Full Truckload, and Heavy Parcel shipping.
        </p>
      </div>

      {/* API Key Status */}
      {!hasApiKey && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="text-amber-800 font-medium">Setup Required</span>
              </div>
              <Button onClick={() => setShowApiSettings(true)} size="sm">
                Configure API Key
              </Button>
            </div>
            <p className="text-amber-700 text-sm mt-2">
              Configure your uShip API key to get live shipping rates and book shipments.
            </p>
          </CardContent>
        </Card>
      )}

      {hasApiKey && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">Ready to Ship</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Test Mode</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowApiSettings(true)}>
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Choose Your Shipment Type</span>
            <Button variant="outline" size="sm" onClick={populateMockData}>
              Fill Sample Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={(value) => handleTypeChange(value as ShipmentType)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="ltl" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>LTL Freight</span>
              </TabsTrigger>
              <TabsTrigger value="ftl" className="flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Full Truckload</span>
              </TabsTrigger>
              <TabsTrigger value="heavy-parcel" className="flex items-center space-x-2">
                <Ship className="h-4 w-4" />
                <span>Heavy Parcel</span>
              </TabsTrigger>
            </TabsList>

            {/* Shipping Details Section */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                  Shipping Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="pickup-address" className="text-sm font-medium">From (Pickup Address) *</Label>
                    <AddressAutoComplete
                      defaultValue={shipmentData.common.pickupAddress}
                      onAddressSelected={handlePickupAddressSelected}
                      onChange={(value) => updateCommonField('pickupAddress', value)}
                      placeholder="Enter pickup address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-address" className="text-sm font-medium">To (Delivery Address) *</Label>
                    <AddressAutoComplete
                      defaultValue={shipmentData.common.deliveryAddress}
                      onAddressSelected={handleDeliveryAddressSelected}
                      onChange={(value) => updateCommonField('deliveryAddress', value)}
                      placeholder="Enter delivery address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup-date" className="text-sm font-medium">Pickup Date</Label>
                    <Input
                      id="pickup-date"
                      type="date"
                      value={shipmentData.common.pickupDate}
                      onChange={(e) => updateCommonField('pickupDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-date" className="text-sm font-medium">Delivery Date</Label>
                    <Input
                      id="delivery-date"
                      type="date"
                      value={shipmentData.common.deliveryDate}
                      onChange={(e) => updateCommonField('deliveryDate', e.target.value)}
                      min={shipmentData.common.pickupDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact-name" className="text-sm font-medium">Contact Name</Label>
                    <Input
                      id="contact-name"
                      value={shipmentData.common.contactName}
                      onChange={(e) => updateCommonField('contactName', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-phone" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="contact-phone"
                      value={shipmentData.common.contactPhone}
                      onChange={(e) => updateCommonField('contactPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-email" className="text-sm font-medium">Email Address</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={shipmentData.common.contactEmail}
                      onChange={(e) => updateCommonField('contactEmail', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Shipment Type Specific Fields */}
              <TabsContent value="ltl" className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">LTL Freight Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Number of Units</Label>
                      <Input
                        type="number"
                        min="1"
                        value={shipmentData.ltl?.handlingUnits || 1}
                        onChange={(e) => updateTypeSpecificField('handlingUnits', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Unit Type</Label>
                      <Select value={shipmentData.ltl?.unitType} onValueChange={(value) => updateTypeSpecificField('unitType', value)}>
                        <SelectTrigger>
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
                      <Label className="text-sm font-medium">Freight Class</Label>
                      <Select value={shipmentData.ltl?.freightClass} onValueChange={(value) => updateTypeSpecificField('freightClass', value)}>
                        <SelectTrigger>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Weight per Unit</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={shipmentData.ltl?.weightPerUnit || 100}
                          onChange={(e) => updateTypeSpecificField('weightPerUnit', parseFloat(e.target.value))}
                          placeholder="Weight"
                        />
                        <Select value={shipmentData.ltl?.weightUnit} onValueChange={(value) => updateTypeSpecificField('weightUnit', value)}>
                          <SelectTrigger className="w-20">
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
                      <Label className="text-sm font-medium">Dimensions (L × W × H)</Label>
                      <div className="flex space-x-1">
                        <Input
                          type="number"
                          min="1"
                          placeholder="L"
                          value={shipmentData.ltl?.length || 48}
                          onChange={(e) => updateTypeSpecificField('length', parseFloat(e.target.value))}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="W"
                          value={shipmentData.ltl?.width || 40}
                          onChange={(e) => updateTypeSpecificField('width', parseFloat(e.target.value))}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="H"
                          value={shipmentData.ltl?.height || 48}
                          onChange={(e) => updateTypeSpecificField('height', parseFloat(e.target.value))}
                        />
                        <Select value={shipmentData.ltl?.dimensionUnit} onValueChange={(value) => updateTypeSpecificField('dimensionUnit', value)}>
                          <SelectTrigger className="w-20">
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
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Full Truckload Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Equipment Type</Label>
                      <Select value={shipmentData.ftl?.equipmentType} onValueChange={(value) => updateTypeSpecificField('equipmentType', value)}>
                        <SelectTrigger>
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
                      <Label className="text-sm font-medium">Total Weight</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={shipmentData.ftl?.totalWeight || 25000}
                          onChange={(e) => updateTypeSpecificField('totalWeight', parseFloat(e.target.value))}
                          placeholder="Weight"
                        />
                        <Select value={shipmentData.ftl?.weightUnit} onValueChange={(value) => updateTypeSpecificField('weightUnit', value)}>
                          <SelectTrigger className="w-20">
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
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Heavy Parcel Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium">Shipment Description</Label>
                      <Input
                        value={shipmentData.heavyParcel?.shipmentTitle || ''}
                        onChange={(e) => updateTypeSpecificField('shipmentTitle', e.target.value)}
                        placeholder="Describe what you're shipping"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Material Type</Label>
                      <Select value={shipmentData.heavyParcel?.materialType} onValueChange={(value) => updateTypeSpecificField('materialType', value)}>
                        <SelectTrigger>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Number of Pieces</Label>
                      <Input
                        type="number"
                        min="1"
                        value={shipmentData.heavyParcel?.parcelCount || 1}
                        onChange={(e) => updateTypeSpecificField('parcelCount', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Weight per Piece</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          min="1"
                          value={shipmentData.heavyParcel?.weightPerParcel || 500}
                          onChange={(e) => updateTypeSpecificField('weightPerParcel', parseFloat(e.target.value))}
                        />
                        <Select value={shipmentData.heavyParcel?.weightUnit} onValueChange={(value) => updateTypeSpecificField('weightUnit', value)}>
                          <SelectTrigger className="w-20">
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
                      <Label className="text-sm font-medium">Cubic Volume</Label>
                      <div className="bg-white px-3 py-2 border rounded text-sm">
                        {shipmentData.heavyParcel?.cubicVolume || 0} CBM
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Additional Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="insurance-required"
                    checked={shipmentData.common.insuranceRequired}
                    onCheckedChange={(checked) => updateCommonField('insuranceRequired', checked)}
                  />
                  <Label htmlFor="insurance-required" className="text-sm font-medium">
                    Add insurance coverage
                  </Label>
                </div>

                <div>
                  <Label htmlFor="special-instructions" className="text-sm font-medium">Special Instructions (Optional)</Label>
                  <Textarea
                    id="special-instructions"
                    value={shipmentData.common.specialInstructions}
                    onChange={(e) => updateCommonField('specialInstructions', e.target.value)}
                    placeholder="Any special handling requirements, delivery instructions, etc."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleGetRates}
                disabled={isLoading || !hasApiKey}
                size="lg"
                className="px-12 py-3 text-lg bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Getting Rates...' : 'Get Shipping Rates'}
              </Button>
            </div>

            {/* Rate Options Display */}
            {rateOptions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-6 text-center">Choose Your Rate</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rateOptions.map((rate) => (
                    <Card 
                      key={rate.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedRate?.id === rate.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedRate(rate)}
                    >
                      <CardContent className="p-6">
                        <div className="text-center">
                          <h4 className="font-semibold text-lg mb-2">{rate.carrier}</h4>
                          <Badge variant="secondary" className="mb-3">{rate.serviceLevel}</Badge>
                          <div className="text-3xl font-bold text-green-600 mb-3">
                            ${rate.rateAmount.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Transit:</strong> {rate.transitTime}</p>
                            <p><strong>Insurance:</strong> {rate.insuranceOptions}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {selectedRate && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleBookLoad}
                      disabled={isLoading}
                      size="lg"
                      className="px-12 py-3 text-lg bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Booking...' : 'Book This Shipment'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Booking Confirmation */}
            {bookingConfirmation && (
              <div className="mt-8">
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 mr-2" />
                      Shipment Booked Successfully!
                      <Badge variant="outline" className="ml-2">Test Mode</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <p><strong>Booking ID:</strong> {bookingConfirmation.bookingId}</p>
                        <p><strong>Tracking Number:</strong> {bookingConfirmation.trackingNumber}</p>
                        <p><strong>Status:</strong> {bookingConfirmation.status}</p>
                      </div>
                      <div>
                        <p><strong>Carrier:</strong> {bookingConfirmation.carrier}</p>
                        <p><strong>Service:</strong> {bookingConfirmation.serviceLevel}</p>
                        <p><strong>Total Cost:</strong> ${bookingConfirmation.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 space-y-3">
                      <Button onClick={handleDirectLabel} className="w-full bg-blue-600 hover:bg-blue-700">
                        Download Test Labels & BOL
                      </Button>
                      <p className="text-sm text-gray-600">
                        📧 A confirmation email will be sent to {shipmentData.common.contactEmail}
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
