import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Truck, Clock, Shield, Star, Loader2 } from 'lucide-react';
import { ShipmentType, ShippingRate } from '@/types/unified-shipping';

interface RateDisplayProps {
  rates: ShippingRate[];
  shipmentType: ShipmentType;
  onRateSelect: (rate: ShippingRate) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  testMode: boolean;
}

const RateDisplay: React.FC<RateDisplayProps> = ({
  rates,
  shipmentType,
  onRateSelect,
  onBack,
  isLoading,
  testMode
}) => {
  const [selectedRateId, setSelectedRateId] = React.useState<string | null>(null);

  const handleRateSelect = async (rate: ShippingRate) => {
    setSelectedRateId(rate.id);
    await onRateSelect(rate);
    setSelectedRateId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-green-200">
        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Available {shipmentType} Rates
              </h2>
              <p className="text-green-700">
                Found {rates.length} competitive rates for your shipment
              </p>
              {testMode && (
                <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800 border-green-300">
                  TEST MODE - No billing will occur
                </Badge>
              )}
            </div>
            
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Form</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Rate Cards */}
      <div className="grid gap-4">
        {rates.map((rate, index) => (
          <Card 
            key={rate.id} 
            className={`border-2 transition-all duration-200 hover:shadow-lg ${
              index === 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-800">{rate.carrier}</h3>
                    {index === 0 && (
                      <Badge className="bg-blue-600 text-white flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>Best Value</span>
                      </Badge>
                    )}
                    {testMode && (
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        Test Rate
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Service</p>
                      <p className="font-medium">{rate.service}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Transit Time</p>
                        <p className="font-medium">{rate.transitTime}</p>
                      </div>
                    </div>
                    
                    {rate.insuranceOptions && rate.insuranceOptions.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Insurance</p>
                          <p className="font-medium">{rate.insuranceOptions[0]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-6">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${rate.rate.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{rate.currency}</p>
                  
                  <Button 
                    onClick={() => handleRateSelect(rate)}
                    disabled={isLoading}
                    className={`min-w-32 ${
                      selectedRateId === rate.id 
                        ? 'bg-blue-700 hover:bg-blue-800' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {selectedRateId === rate.id ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Booking...</span>
                      </div>
                    ) : (
                      'Select Rate'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* No Rates State */}
      {rates.length === 0 && (
        <Card className="border-2 border-gray-200">
          <div className="p-12 text-center">
            <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No rates available
            </h3>
            <p className="text-gray-500 mb-6">
              We couldn't find any rates for this shipment. Please try adjusting your requirements.
            </p>
            <Button variant="outline" onClick={onBack}>
              Modify Shipment Details
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RateDisplay;
