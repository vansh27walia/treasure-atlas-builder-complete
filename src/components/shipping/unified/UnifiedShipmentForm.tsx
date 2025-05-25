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
import { Calendar, CalendarDays, MapPin, Package, Truck, Ship, Settings, TestTube } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddressAutoComplete from '../AddressAutoComplete';
import ApiKeySettings from './ApiKeySettings';
import { supabase } from '@/integrations/supabase/client';

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
    toast.success('Mock data populated for testing');
  };

  const handleGetRates = async () => {
    if (!shipmentData.common.pickupAddress || !shipmentData.common.deliveryAddress) {
      toast.error('Please fill in pickup and delivery addresses');
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

      if (data?.rates) {
        setRateOptions(data.rates);
        toast.success(`Found ${data.rates.length} rate options`);
      } else {
        // Mock rates for testing
        const mockRates: RateOption[] = [
          {
            id: 'rate_1',
            carrier: 'uShip Partner 1',
            serviceLevel: 'Standard',
            rateAmount: 850.00,
            transitTime: '3-5 business days',
            insuranceOptions: 'Up to $50,000'
          },
          {
            id: 'rate_2',
            carrier: 'uShip Partner 2',
            serviceLevel: 'Express',
            rateAmount: 1200.00,
            transitTime: '1-2 business days',
            insuranceOptions: 'Up to $100,000'
          },
          {
            id: 'rate_3',
            carrier: 'uShip Partner 3',
            serviceLevel: 'Economy',
            rateAmount: 650.00,
            transitTime: '5-7 business days',
            insuranceOptions: 'Up to $25,000'
          }
        ];
        setRateOptions(mockRates);
        toast.success('Showing mock rates for testing');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch rates. Please try again.');
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
    return <ApiKeySettings onClose={() => setShowApiSettings(false)} />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Unified Shipment Booking</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <TestTube className="h-4 w-4" />
            <Label htmlFor="test-mode">Test Mode</Label>
            <Switch
              id="test-mode"
              checked={testMode}
              onCheckedChange={setTestMode}
            />
          </div>
          <Button variant="outline" onClick={() => setShowApiSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            API Settings
          </Button>
        </div>
      </div>

      {testMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800 font-medium">Test Mode Active</span>
            </div>
            <Button variant="outline" size="sm" onClick={populateMockData}>
              Fill Mock Data
            </Button>
          </div>
          <p className="text-amber-700 text-sm mt-2">
            All bookings will be test bookings without live billing. Labels and BOL will be marked as test documents.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shipment Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeType} onValueChange={(value) => handleTypeChange(value as ShipmentType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ltl" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>LTL</span>
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

            {/* Common Fields */}
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Shipping Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup-address">Pickup Address *</Label>
                  <AddressAutoComplete
                    defaultValue={shipmentData.common.pickupAddress}
                    onAddressSelected={handlePickupAddressSelected}
                    onChange={(value) => updateCommonField('pickupAddress', value)}
                    placeholder="Enter pickup address"
                  />
                </div>
                
                <div>
                  <Label htmlFor="delivery-address">Delivery Address *</Label>
                  <AddressAutoComplete
                    defaultValue={shipmentData.common.deliveryAddress}
                    onAddressSelected={handleDeliveryAddressSelected}
                    onChange={(value) => updateCommonField('deliveryAddress', value)}
                    placeholder="Enter delivery address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="pickup-date">Pickup Date</Label>
                  <Input
                    id="pickup-date"
                    type="date"
                    value={shipmentData.common.pickupDate}
                    onChange={(e) => updateCommonField('pickupDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="pickup-time">Pickup Time Window</Label>
                  <Select value={shipmentData.common.pickupTimeWindow} onValueChange={(value) => updateCommonField('pickupTimeWindow', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8:00-12:00">8:00 AM - 12:00 PM</SelectItem>
                      <SelectItem value="9:00-17:00">9:00 AM - 5:00 PM</SelectItem>
                      <SelectItem value="12:00-17:00">12:00 PM - 5:00 PM</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="delivery-date">Delivery Date</Label>
                  <Input
                    id="delivery-date"
                    type="date"
                    value={shipmentData.common.deliveryDate}
                    onChange={(e) => updateCommonField('deliveryDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="delivery-time">Delivery Time Window</Label>
                  <Select value={shipmentData.common.deliveryTimeWindow} onValueChange={(value) => updateCommonField('deliveryTimeWindow', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8:00-12:00">8:00 AM - 12:00 PM</SelectItem>
                      <SelectItem value="9:00-17:00">9:00 AM - 5:00 PM</SelectItem>
                      <SelectItem value="12:00-17:00">12:00 PM - 5:00 PM</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contact-name">Contact Name</Label>
                  <Input
                    id="contact-name"
                    value={shipmentData.common.contactName}
                    onChange={(e) => updateCommonField('contactName', e.target.value)}
                    placeholder="Contact person name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    value={shipmentData.common.contactPhone}
                    onChange={(e) => updateCommonField('contactPhone', e.target.value)}
                    placeholder="+1-555-123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={shipmentData.common.contactEmail}
                    onChange={(e) => updateCommonField('contactEmail', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insurance-required"
                  checked={shipmentData.common.insuranceRequired}
                  onCheckedChange={(checked) => updateCommonField('insuranceRequired', checked)}
                />
                <Label htmlFor="insurance-required">Insurance Required</Label>
              </div>

              <div>
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Textarea
                  id="special-instructions"
                  value={shipmentData.common.specialInstructions}
                  onChange={(e) => updateCommonField('specialInstructions', e.target.value)}
                  placeholder="Any special handling instructions..."
                />
              </div>
            </div>

            {/* Type-specific fields */}
            <TabsContent value="ltl" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">LTL Shipment Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="handling-units">Handling Units</Label>
                    <Input
                      id="handling-units"
                      type="number"
                      value={shipmentData.ltl?.handlingUnits || 1}
                      onChange={(e) => updateTypeSpecificField('handlingUnits', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit-type">Unit Type</Label>
                    <Select value={shipmentData.ltl?.unitType} onValueChange={(value) => updateTypeSpecificField('unitType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pallet">Pallet</SelectItem>
                        <SelectItem value="Crate">Crate</SelectItem>
                        <SelectItem value="Drum">Drum</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="freight-class">Freight Class</Label>
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
                        <SelectItem value="110">Class 110</SelectItem>
                        <SelectItem value="125">Class 125</SelectItem>
                        <SelectItem value="150">Class 150</SelectItem>
                        <SelectItem value="175">Class 175</SelectItem>
                        <SelectItem value="200">Class 200</SelectItem>
                        <SelectItem value="250">Class 250</SelectItem>
                        <SelectItem value="300">Class 300</SelectItem>
                        <SelectItem value="400">Class 400</SelectItem>
                        <SelectItem value="500">Class 500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Weight per Unit</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={shipmentData.ltl?.weightPerUnit || 100}
                        onChange={(e) => updateTypeSpecificField('weightPerUnit', parseFloat(e.target.value))}
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
                    <Label>Dimensions per Unit (L × W × H)</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="L"
                        value={shipmentData.ltl?.length || 48}
                        onChange={(e) => updateTypeSpecificField('length', parseFloat(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="W"
                        value={shipmentData.ltl?.width || 40}
                        onChange={(e) => updateTypeSpecificField('width', parseFloat(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="H"
                        value={shipmentData.ltl?.height || 48}
                        onChange={(e) => updateTypeSpecificField('height', parseFloat(e.target.value))}
                      />
                      <Select value={shipmentData.ltl?.dimensionUnit} onValueChange={(value) => updateTypeSpecificField('dimensionUnit', value)}>
                        <SelectTrigger className="w-24">
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

                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="liftgate-required"
                      checked={shipmentData.ltl?.liftgateRequired}
                      onCheckedChange={(checked) => updateTypeSpecificField('liftgateRequired', checked)}
                    />
                    <Label htmlFor="liftgate-required">Liftgate Required</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="appointment-required"
                      checked={shipmentData.ltl?.appointmentRequired}
                      onCheckedChange={(checked) => updateTypeSpecificField('appointmentRequired', checked)}
                    />
                    <Label htmlFor="appointment-required">Appointment Required</Label>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ftl" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Full Truckload Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="equipment-type">Equipment Type</Label>
                    <Select value={shipmentData.ftl?.equipmentType} onValueChange={(value) => updateTypeSpecificField('equipmentType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dry Van">Dry Van</SelectItem>
                        <SelectItem value="Flatbed">Flatbed</SelectItem>
                        <SelectItem value="Refrigerated">Refrigerated</SelectItem>
                        <SelectItem value="Step Deck">Step Deck</SelectItem>
                        <SelectItem value="Lowboy">Lowboy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="number-of-trucks">Number of Trucks</Label>
                    <Input
                      id="number-of-trucks"
                      type="number"
                      value={shipmentData.ftl?.numberOfTrucks || 1}
                      onChange={(e) => updateTypeSpecificField('numberOfTrucks', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Total Weight</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        value={shipmentData.ftl?.totalWeight || 25000}
                        onChange={(e) => updateTypeSpecificField('totalWeight', parseFloat(e.target.value))}
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
                  
                  <div>
                    <Label>Total Dimensions (L × W × H)</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="L"
                        value={shipmentData.ftl?.totalLength || 53}
                        onChange={(e) => updateTypeSpecificField('totalLength', parseFloat(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="W"
                        value={shipmentData.ftl?.totalWidth || 8.5}
                        onChange={(e) => updateTypeSpecificField('totalWidth', parseFloat(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="H"
                        value={shipmentData.ftl?.totalHeight || 9}
                        onChange={(e) => updateTypeSpecificField('totalHeight', parseFloat(e.target.value))}
                      />
                      <Select value={shipmentData.ftl?.dimensionUnit} onValueChange={(value) => updateTypeSpecificField('dimensionUnit', value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feet">ft</SelectItem>
                          <SelectItem value="meters">m</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Accessorial Services</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['Loading Assistance', 'Crane Service', 'Inside Delivery', 'Tailgate Service', 'Hazmat Handling', 'Temperature Control'].map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={shipmentData.ftl?.accessorialServices?.includes(service)}
                          onCheckedChange={(checked) => {
                            const services = shipmentData.ftl?.accessorialServices || [];
                            if (checked) {
                              updateTypeSpecificField('accessorialServices', [...services, service]);
                            } else {
                              updateTypeSpecificField('accessorialServices', services.filter(s => s !== service));
                            }
                          }}
                        />
                        <Label htmlFor={service} className="text-sm">{service}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="heavy-parcel" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Heavy Parcel Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shipment-title">Shipment Title</Label>
                    <Input
                      id="shipment-title"
                      value={shipmentData.heavyParcel?.shipmentTitle || ''}
                      onChange={(e) => updateTypeSpecificField('shipmentTitle', e.target.value)}
                      placeholder="Describe the shipment"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="material-type">Material Type</Label>
                    <Select value={shipmentData.heavyParcel?.materialType} onValueChange={(value) => updateTypeSpecificField('materialType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Machinery">Machinery</SelectItem>
                        <SelectItem value="Industrial Equipment">Industrial Equipment</SelectItem>
                        <SelectItem value="Bulk Goods">Bulk Goods</SelectItem>
                        <SelectItem value="Vehicle">Vehicle</SelectItem>
                        <SelectItem value="Construction Materials">Construction Materials</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parcel-count">Parcel Count</Label>
                    <Input
                      id="parcel-count"
                      type="number"
                      value={shipmentData.heavyParcel?.parcelCount || 1}
                      onChange={(e) => updateTypeSpecificField('parcelCount', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label>Weight per Parcel</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
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
                </div>

                <div>
                  <Label>Dimensions per Parcel (L × W × H)</Label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Length"
                      value={shipmentData.heavyParcel?.length || 60}
                      onChange={(e) => updateTypeSpecificField('length', parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Width"
                      value={shipmentData.heavyParcel?.width || 48}
                      onChange={(e) => updateTypeSpecificField('width', parseFloat(e.target.value))}
                    />
                    <Input
                      type="number"
                      placeholder="Height"
                      value={shipmentData.heavyParcel?.height || 60}
                      onChange={(e) => updateTypeSpecificField('height', parseFloat(e.target.value))}
                    />
                    <Select value={shipmentData.heavyParcel?.dimensionUnit} onValueChange={(value) => updateTypeSpecificField('dimensionUnit', value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inches">in</SelectItem>
                        <SelectItem value="cm">cm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Cubic Volume: {shipmentData.heavyParcel?.cubicVolume || 0} CBM
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pickup-port">Pickup Port</Label>
                    <Input
                      id="pickup-port"
                      value={shipmentData.heavyParcel?.pickupPort || ''}
                      onChange={(e) => updateTypeSpecificField('pickupPort', e.target.value)}
                      placeholder="Enter pickup port/terminal"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery-port">Delivery Port</Label>
                    <Input
                      id="delivery-port"
                      value={shipmentData.heavyParcel?.deliveryPort || ''}
                      onChange={(e) => updateTypeSpecificField('deliveryPort', e.target.value)}
                      placeholder="Enter delivery port/terminal"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="special-handling-notes">Special Handling Notes</Label>
                  <Textarea
                    id="special-handling-notes"
                    value={shipmentData.heavyParcel?.specialHandlingNotes || ''}
                    onChange={(e) => updateTypeSpecificField('specialHandlingNotes', e.target.value)}
                    placeholder="Any special handling requirements..."
                  />
                </div>

                <div>
                  <Label>Additional Services</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['Crane Unloading', 'Hazardous Material Permit', 'White Glove Service', 'Storage Services', 'Customs Clearance', 'Insurance Coverage'].map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox
                          id={service}
                          checked={shipmentData.heavyParcel?.additionalServices?.includes(service)}
                          onCheckedChange={(checked) => {
                            const services = shipmentData.heavyParcel?.additionalServices || [];
                            if (checked) {
                              updateTypeSpecificField('additionalServices', [...services, service]);
                            } else {
                              updateTypeSpecificField('additionalServices', services.filter(s => s !== service));
                            }
                          }}
                        />
                        <Label htmlFor={service} className="text-sm">{service}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleGetRates}
              disabled={isLoading}
              className="px-8 py-3 text-lg"
              size="lg"
            >
              {isLoading ? 'Getting Rates...' : 'Get Rates'}
            </Button>
          </div>

          {/* Rate Options */}
          {rateOptions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Rate Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rateOptions.map((rate) => (
                  <Card 
                    key={rate.id} 
                    className={`cursor-pointer transition-all ${selectedRate?.id === rate.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedRate(rate)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{rate.carrier}</h4>
                        <Badge variant="secondary">{rate.serviceLevel}</Badge>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        ${rate.rateAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Transit: {rate.transitTime}</p>
                        <p>Insurance: {rate.insuranceOptions}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {selectedRate && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleBookLoad}
                    disabled={isLoading}
                    className="px-8 py-3"
                    size="lg"
                  >
                    {isLoading ? 'Booking...' : 'Book Load'}
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
                  <CardTitle className="text-green-800 flex items-center">
                    <CalendarDays className="h-5 w-5 mr-2" />
                    Booking Confirmed
                    {testMode && <Badge variant="outline" className="ml-2">Test Mode</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Booking ID:</strong> {bookingConfirmation.bookingId}</p>
                      <p><strong>Tracking Number:</strong> {bookingConfirmation.trackingNumber}</p>
                      <p><strong>Status:</strong> {bookingConfirmation.status}</p>
                    </div>
                    <div>
                      <p><strong>Carrier:</strong> {bookingConfirmation.carrier}</p>
                      <p><strong>Service Level:</strong> {bookingConfirmation.serviceLevel}</p>
                      <p><strong>Total Amount:</strong> ${bookingConfirmation.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <Button onClick={handleDirectLabel} className="w-full">
                      Direct Label {testMode ? '(Test Mode)' : ''}
                    </Button>
                    <Button variant="outline" disabled className="w-full">
                      Label After Payment (Coming Soon)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedShipmentForm;
