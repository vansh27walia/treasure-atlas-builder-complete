
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, Ship, Settings, TestTube, Play } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import ShippingForm from '@/components/shipping/unified/ShippingForm';
import RateDisplay from '@/components/shipping/unified/RateDisplay';
import BookingConfirmation from '@/components/shipping/unified/BookingConfirmation';
import ApiKeySettings from '@/components/shipping/unified/ApiKeySettings';

export type ShipmentType = 'LTL' | 'FTL' | 'HEAVY_PARCEL';

export interface ShippingFormData {
  // Common fields
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

  // LTL specific
  handlingUnits?: number;
  unitType?: string;
  weightPerUnit?: number;
  dimensionsPerUnit?: {
    length: number;
    width: number;
    height: number;
  };
  freightClass?: string;
  liftgateRequired?: boolean;
  appointmentRequired?: boolean;

  // FTL specific
  equipmentType?: string;
  numberOfTrucks?: number;
  totalWeight?: number;
  totalDimensions?: {
    length: number;
    width: number;
    height: number;
  };
  accessorialServices?: string[];

  // Heavy Parcel specific
  shipmentTitle?: string;
  materialType?: string;
  parcelCount?: number;
  weightPerParcel?: number;
  dimensionsPerParcel?: {
    length: number;
    width: number;
    height: number;
  };
  pickupPort?: string;
  deliveryPort?: string;
  specialHandlingNotes?: string;
  additionalServices?: string[];
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  transitTime: string;
  insuranceOptions?: string[];
}

const UnifiedShippingPage: React.FC = () => {
  const [shipmentType, setShipmentType] = useState<ShipmentType>('LTL');
  const [testMode, setTestMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'rates' | 'booking'>('form');
  const [formData, setFormData] = useState<ShippingFormData | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleShipmentTypeChange = (type: ShipmentType) => {
    setShipmentType(type);
    setCurrentStep('form');
    setFormData(null);
    setRates([]);
    setSelectedRate(null);
    setBookingData(null);
  };

  const handleFormSubmit = async (data: ShippingFormData) => {
    setIsLoading(true);
    setFormData(data);
    
    try {
      // Mock rates for demonstration - replace with actual uShip API call
      const mockRates: ShippingRate[] = [
        {
          id: '1',
          carrier: 'Express Freight',
          service: 'Standard LTL',
          rate: 1250.00,
          currency: 'USD',
          transitTime: '3-5 business days',
          insuranceOptions: ['Basic Coverage', 'Full Value Protection']
        },
        {
          id: '2',
          carrier: 'National Transport',
          service: 'Expedited LTL',
          rate: 1850.00,
          currency: 'USD',
          transitTime: '1-2 business days',
          insuranceOptions: ['Basic Coverage', 'Full Value Protection']
        }
      ];

      // Simulate API delay
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
      // Mock booking data - replace with actual uShip API call
      const mockBooking = {
        bookingId: `${testMode ? 'TEST-' : ''}BK-${Date.now()}`,
        trackingNumber: `${testMode ? 'TEST-' : ''}TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        carrier: rate.carrier,
        service: rate.service,
        totalCost: rate.rate,
        estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        labelUrl: testMode ? '/mock-test-label.pdf' : '/label.pdf',
        bolUrl: testMode ? '/mock-test-bol.pdf' : '/bol.pdf',
        isTestMode: testMode
      };

      // Simulate API delay
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
              <span className="text-sm text-gray-600">Test Mode</span>
              <Switch 
                checked={testMode} 
                onCheckedChange={setTestMode}
                className="data-[state=checked]:bg-green-600"
              />
              <Play className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Live Mode</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-1"
            >
              <Settings className="h-4 w-4" />
              <span>API Settings</span>
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

      {/* API Settings */}
      {showSettings && (
        <div className="mb-6">
          <ApiKeySettings onClose={() => setShowSettings(false)} />
        </div>
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

      {/* Main Content */}
      {currentStep === 'form' && (
        <ShippingForm
          shipmentType={shipmentType}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
          testMode={testMode}
        />
      )}

      {currentStep === 'rates' && (
        <RateDisplay
          rates={rates}
          shipmentType={shipmentType}
          onRateSelect={handleRateSelect}
          onBack={() => setCurrentStep('form')}
          isLoading={isLoading}
          testMode={testMode}
        />
      )}

      {currentStep === 'booking' && bookingData && (
        <BookingConfirmation
          booking={bookingData}
          shipmentType={shipmentType}
          formData={formData}
          selectedRate={selectedRate}
          onNewShipment={() => {
            setCurrentStep('form');
            setFormData(null);
            setRates([]);
            setSelectedRate(null);
            setBookingData(null);
          }}
          testMode={testMode}
        />
      )}
    </div>
  );
};

export default UnifiedShippingPage;
