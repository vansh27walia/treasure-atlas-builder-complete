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
import { Package, Truck, Ship, Key, TestTube, Play, MapPin, CheckCircle, Save, Shield } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import ApiKeyManagement from '@/components/shipping/unified/ApiKeyManagement';
import { userProfileService } from '@/services/UserProfileService';
import { supabase } from '@/integrations/supabase/client';
import { ShipmentType, ShippingFormData, ShippingRate } from '@/types/unified-shipping';

const UnifiedShippingPage: React.FC = () => {
  const [shipmentType, setShipmentType] = useState<ShipmentType>('LTL');
  const [testMode, setTestMode] = useState(true);
  const [showApiModal, setShowApiModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'rates' | 'booking'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  const [formData, setFormData] = useState<ShippingFormData>({
    pickupAddress: '',
    deliveryAddress: '',
    pickupDate: '',
    deliveryDate: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    insuranceRequired: false,
    specialInstructions: ''
  });

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

  const handleApiKeySaved = () => {
    checkApiKey();
    setShowApiModal(false);
    toast.success('🔐 API key configured! You can now get shipping rates.');
  };

  const handleShipmentTypeChange = (type: ShipmentType) => {
    setShipmentType(type);
    setCurrentStep('form');
    setRates([]);
    setSelectedRate(null);
    setBookingData(null);
  };

  const updateFormField = (field: keyof ShippingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const populateSampleData = () => {
    setFormData(prev => ({
      ...prev,
      pickupAddress: '123 Warehouse St, Los Angeles, CA 90210',
      deliveryAddress: '456 Distribution Ave, Phoenix, AZ 85001',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      contactName: 'John Smith',
      contactPhone: '+1-555-123-4567',
      contactEmail: 'john.smith@example.com',
      insuranceRequired: true,
      specialInstructions: 'Please call before delivery. Loading dock access required.',
      handlingUnits: 2,
      unitType: 'Pallet',
      weightPerUnit: 1500,
      freightClass: '70',
      equipmentType: 'Dry Van',
      totalWeight: 25000,
      shipmentTitle: 'Industrial Machinery',
      materialType: 'Machinery',
      parcelCount: 1,
      weightPerParcel: 5000
    }));
    toast.success('Sample data loaded for testing');
  };

  const handleGetRates = async () => {
    if (!formData.pickupAddress || !formData.deliveryAddress) {
      toast.error('Please enter pickup and delivery addresses');
      return;
    }

    if (!hasApiKey) {
      toast.error('Please configure your uShip API key first');
      setShowApiModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const mockRates: ShippingRate[] = [
        {
          id: '1',
          carrier: 'Express Freight Solutions',
          service: 'Standard',
          rate: 850.00,
          transitTime: '3-5 business days',
          currency: 'USD',
          insuranceOptions: 'Up to $50,000 coverage'
        },
        {
          id: '2',
          carrier: 'Premium Logistics',
          service: 'Express',
          rate: 1200.00,
          transitTime: '1-2 business days',
          currency: 'USD',
          insuranceOptions: 'Up to $100,000 coverage'
        },
        {
          id: '3',
          carrier: 'Economy Transport',
          service: 'Economy',
          rate: 650.00,
          transitTime: '5-7 business days',
          currency: 'USD',
          insuranceOptions: 'Up to $25,000 coverage'
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 2000));
      setRates(mockRates);
      setCurrentStep('rates');
      toast.success(`Found ${mockRates.length} ${shipmentType} rates!`);
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch shipping rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelect = async (rate: ShippingRate) => {
    setIsLoading(true);
    setSelectedRate(rate);
    
    try {
      const mockBooking = {
        bookingId: `${testMode ? 'TEST-' : ''}BK-${Date.now()}`,
        trackingNumber: `${testMode ? 'TEST-' : ''}TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        carrier: rate.carrier,
        service: rate.service,
        totalCost: rate.rate,
        estimatedDelivery: formData.deliveryDate,
        labelUrl: testMode ? '/mock-test-label.pdf' : '/label.pdf',
        bolUrl: testMode ? '/mock-test-bol.pdf' : '/bol.pdf',
        isTestMode: testMode
      };

      await new Promise(resolve => setTimeout(resolve, 1500));
      setBookingData(mockBooking);
      setCurrentStep('booking');
      toast.success(testMode ? 'Test booking created successfully!' : 'Booking confirmed!');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getShipmentTypeIcon = (type: ShipmentType) => {
    switch (type) {
      case 'LTL': return <Package className="h-5 w-5" />;
      case 'FTL': return <Truck className="h-5 w-5" />;
      case 'HEAVY_PARCEL': return <Ship className="h-5 w-5" />;
    }
  };

  const getShipmentTypeLabel = (type: ShipmentType) => {
    switch (type) {
      case 'LTL': return 'Less Than Truckload';
      case 'FTL': return 'Full Truckload';
      case 'HEAVY_PARCEL': return 'Heavy Parcel';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ApiKeyManagement 
        isOpen={showApiModal} 
        onClose={() => setShowApiModal(false)}
        onApiKeySaved={handleApiKeySaved}
      />

      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-4xl font-bold text-blue-800 flex items-center">
            <Truck className="mr-3 h-10 w-10 text-blue-600" />
            Unified Shipping Platform
          </h1>
          <div className="ml-6 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <TestTube className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Test</span>
              <Switch 
                checked={testMode} 
                onCheckedChange={setTestMode}
                className="data-[state=checked]:bg-green-600"
              />
              <Play className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Live</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiModal(true)}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 hover:from-blue-100 hover:to-indigo-100"
            >
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700">Secure API</span>
            </Button>
          </div>
        </div>
        
        {testMode && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
            TEST MODE - No billing will occur
          </Badge>
        )}
        
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-4">
          Complete shipping solution for LTL, Full Truckload, and Heavy Parcel shipments. 
          Get instant quotes, book loads, and generate shipping labels.
        </p>
      </div>

      {/* API Key Status */}
      {!hasApiKey && (
        <Card className="mb-6 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-800">Secure Setup Required</h3>
                  <p className="text-amber-700 text-sm">
                    Configure your uShip API key securely to get live shipping rates and book shipments
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowApiModal(true)} 
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-6 py-2 shadow-lg"
              >
                <Shield className="h-4 w-4 mr-2" />
                Secure Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipment Type Toggle */}
      <Card className="mb-8 border-2 border-blue-200">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-center mb-6 text-blue-800">
            Select Shipment Type
          </h2>
          
          <div className="flex justify-center space-x-6">
            {(['LTL', 'FTL', 'HEAVY_PARCEL'] as ShipmentType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleShipmentTypeChange(type)}
                className={`flex flex-col items-center space-y-2 p-4 rounded-lg border-2 transition-all duration-200 ${
                  shipmentType === type
                    ? 'border-blue-500 bg-blue-100 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {getShipmentTypeIcon(type)}
                <span className="font-medium">{type}</span>
                <span className="text-xs text-center">{getShipmentTypeLabel(type)}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Form */}
      {currentStep === 'form' && (
        <Card className="mb-6 shadow-lg border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl text-blue-800">Shipment Details</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={populateSampleData}
                className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              >
                <Package className="h-4 w-4 mr-2" />
                Fill Sample Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Common Fields */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-semibold mb-6 flex items-center text-blue-800">
                <MapPin className="h-6 w-6 mr-3 text-blue-600" />
                Shipping Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    From (Pickup Address) *
                  </Label>
                  <AddressAutoComplete
                    defaultValue={formData.pickupAddress}
                    onAddressSelected={(place) => {
                      if (place?.formatted_address) {
                        updateFormField('pickupAddress', place.formatted_address);
                      }
                    }}
                    onChange={(value) => updateFormField('pickupAddress', value)}
                    placeholder="Enter pickup address"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    To (Delivery Address) *
                  </Label>
                  <AddressAutoComplete
                    defaultValue={formData.deliveryAddress}
                    onAddressSelected={(place) => {
                      if (place?.formatted_address) {
                        updateFormField('deliveryAddress', place.formatted_address);
                      }
                    }}
                    onChange={(value) => updateFormField('deliveryAddress', value)}
                    placeholder="Enter delivery address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Pickup Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.pickupDate}
                    onChange={(e) => updateFormField('pickupDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="border-2 border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Delivery Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => updateFormField('deliveryDate', e.target.value)}
                    min={formData.pickupDate || new Date().toISOString().split('T')[0]}
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
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Contact Name
                  </Label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => updateFormField('contactName', e.target.value)}
                    placeholder="Your name"
                    className="border-2 border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Phone Number
                  </Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => updateFormField('contactPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="border-2 border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormField('contactEmail', e.target.value)}
                    placeholder="your@email.com"
                    className="border-2 border-gray-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Shipment Type Specific Fields */}
            {shipmentType === 'LTL' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-xl font-semibold mb-6 text-green-800">LTL Freight Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Units</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.handlingUnits || 1}
                      onChange={(e) => updateFormField('handlingUnits', parseInt(e.target.value))}
                      className="border-2 border-gray-300 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Unit Type</Label>
                    <Select value={formData.unitType} onValueChange={(value) => updateFormField('unitType', value)}>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-green-500">
                        <SelectValue placeholder="Select unit type" />
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
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Weight/Unit (lbs)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.weightPerUnit || 100}
                      onChange={(e) => updateFormField('weightPerUnit', parseFloat(e.target.value))}
                      className="border-2 border-gray-300 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Freight Class</Label>
                    <Select value={formData.freightClass} onValueChange={(value) => updateFormField('freightClass', value)}>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-green-500">
                        <SelectValue placeholder="Class" />
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

                <div className="mt-4 flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.liftgateRequired || false}
                      onCheckedChange={(checked) => updateFormField('liftgateRequired', checked)}
                    />
                    <Label className="text-sm">Liftgate Required</Label>
                  </div>
                </div>
              </div>
            )}

            {shipmentType === 'FTL' && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-semibold mb-6 text-blue-800">Full Truckload Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Equipment Type</Label>
                    <Select value={formData.equipmentType} onValueChange={(value) => updateFormField('equipmentType', value)}>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder="Select equipment" />
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
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Total Weight (lbs)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.totalWeight || 25000}
                      onChange={(e) => updateFormField('totalWeight', parseFloat(e.target.value))}
                      className="border-2 border-gray-300 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {shipmentType === 'HEAVY_PARCEL' && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <h3 className="text-xl font-semibold mb-6 text-purple-800">Heavy Parcel Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Shipment Description</Label>
                    <Input
                      value={formData.shipmentTitle || ''}
                      onChange={(e) => updateFormField('shipmentTitle', e.target.value)}
                      placeholder="Describe what you're shipping"
                      className="border-2 border-gray-300 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Material Type</Label>
                    <Select value={formData.materialType} onValueChange={(value) => updateFormField('materialType', value)}>
                      <SelectTrigger className="border-2 border-gray-300 focus:border-purple-500">
                        <SelectValue placeholder="Select material" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Number of Pieces</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.parcelCount || 1}
                      onChange={(e) => updateFormField('parcelCount', parseInt(e.target.value))}
                      className="border-2 border-gray-300 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">Weight per Piece (lbs)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.weightPerParcel || 500}
                      onChange={(e) => updateFormField('weightPerParcel', parseFloat(e.target.value))}
                      className="border-2 border-gray-300 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Options */}
            <div className="space-y-4 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.insuranceRequired}
                  onCheckedChange={(checked) => updateFormField('insuranceRequired', checked)}
                />
                <Label className="text-sm font-semibold text-gray-700">
                  Add insurance coverage
                </Label>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Special Instructions (Optional)
                </Label>
                <Textarea
                  value={formData.specialInstructions}
                  onChange={(e) => updateFormField('specialInstructions', e.target.value)}
                  placeholder="Any special handling requirements, delivery instructions, etc."
                  rows={3}
                  className="border-2 border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleGetRates}
                disabled={isLoading || !hasApiKey}
                size="lg"
                className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
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
          </CardContent>
        </Card>
      )}

      {/* Rate Options Display */}
      {currentStep === 'rates' && rates.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Choose Your Rate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rates.map((rate) => (
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
                      {rate.service}
                    </Badge>
                    <div className="text-4xl font-bold text-green-600 mb-4">
                      ${rate.rate.toFixed(2)}
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
                onClick={() => handleRateSelect(selectedRate)}
                disabled={isLoading}
                size="lg"
                className="px-12 py-4 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
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

      {/* Booking Confirmation */}
      {currentStep === 'booking' && bookingData && (
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
                  <p className="text-lg"><strong>Booking ID:</strong> {bookingData.bookingId}</p>
                  <p className="text-lg"><strong>Tracking Number:</strong> {bookingData.trackingNumber}</p>
                  <p className="text-lg"><strong>Status:</strong> 
                    <Badge className="ml-2 bg-green-600 text-white">
                      Confirmed
                    </Badge>
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-lg"><strong>Carrier:</strong> {bookingData.carrier}</p>
                  <p className="text-lg"><strong>Service:</strong> {bookingData.service}</p>
                  <p className="text-lg"><strong>Total Cost:</strong> 
                    <span className="text-green-600 font-bold text-xl ml-2">
                      ${bookingData.totalCost.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="pt-6 space-y-4">
                <Button 
                  onClick={() => {
                    window.open(bookingData.labelUrl, '_blank');
                    window.open(bookingData.bolUrl, '_blank');
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-lg shadow-lg"
                >
                  <Save className="h-5 w-5 mr-3" />
                  Download {testMode ? 'Test ' : ''}Labels & BOL
                </Button>
                <p className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                  📧 A confirmation email will be sent to <strong>{formData.contactEmail}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UnifiedShippingPage;
