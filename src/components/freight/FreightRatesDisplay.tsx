
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Ship, Plane, Truck, Clock, DollarSign, MapPin, Package, Info, BookOpen } from 'lucide-react';
import FreightBookingModal from './FreightBookingModal';

interface FreightRate {
  mode: string;
  minPrice: number;
  maxPrice: number;
  minTransitTime: number;
  maxTransitTime: number;
  originPort?: string;
  destinationPort?: string;
}

interface FreightRatesDisplayProps {
  rates: FreightRate[];
  onBooking: (rate: FreightRate) => void;
  originData: { address: string };
  destinationData: { address: string };
  loadDetails: any;
  requestParams?: any;
}

const FreightRatesDisplay: React.FC<FreightRatesDisplayProps> = ({
  rates,
  onBooking,
  originData,
  destinationData,
  loadDetails,
  requestParams
}) => {
  const [selectedRate, setSelectedRate] = useState<FreightRate | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const getModeIcon = (mode: string) => {
    const modeUpper = mode.toUpperCase();
    if (modeUpper.includes('OCEAN') || modeUpper.includes('SEA')) {
      return <Ship className="w-5 h-5 text-blue-600" />;
    } else if (modeUpper.includes('AIR')) {
      return <Plane className="w-5 h-5 text-green-600" />;
    } else if (modeUpper.includes('ROAD') || modeUpper.includes('TRUCK')) {
      return <Truck className="w-5 h-5 text-orange-600" />;
    }
    return <Package className="w-5 h-5 text-gray-600" />;
  };

  const getModeColor = (mode: string) => {
    const modeUpper = mode.toUpperCase();
    if (modeUpper.includes('OCEAN') || modeUpper.includes('SEA')) {
      return 'bg-blue-100 text-blue-800';
    } else if (modeUpper.includes('AIR')) {
      return 'bg-green-100 text-green-800';
    } else if (modeUpper.includes('ROAD') || modeUpper.includes('TRUCK')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (min: number, max: number) => {
    if (min === max) {
      return `$${min.toLocaleString()}`;
    }
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  };

  const formatTransitTime = (min: number, max: number) => {
    if (min === max) {
      return `${min} day${min !== 1 ? 's' : ''}`;
    }
    return `${min}-${max} days`;
  };

  const handleBookNow = (rate: FreightRate) => {
    setSelectedRate(rate);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedRate(null);
  };

  if (!rates || rates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Route Information */}
      {requestParams?.routeInfo && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-gray-900">Route Information</span>
            </div>
            <div className="text-sm text-gray-600">
              <div><strong>Origin:</strong> {requestParams.routeInfo.origin}</div>
              <div><strong>Destination:</strong> {requestParams.routeInfo.destination}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rates Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Available Freight Rates
        </h3>
        <p className="text-gray-600">
          Live estimates from Freightos API • {rates.length} option{rates.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Rate Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {rates.map((rate, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getModeIcon(rate.mode)}
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {rate.mode.charAt(0) + rate.mode.slice(1).toLowerCase()} Freight
                    </CardTitle>
                    <Badge className={getModeColor(rate.mode)}>
                      {rate.mode}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Price */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Cost</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatPrice(rate.minPrice, rate.maxPrice)}
                  </div>
                </div>
              </div>
              
              {/* Transit Time */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Transit Time</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTransitTime(rate.minTransitTime, rate.maxTransitTime)}
                  </div>
                </div>
              </div>

              <Separator />
              
              {/* Action Button */}
              <Button 
                onClick={() => handleBookNow(rate)}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Book This Service
              </Button>
              
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                <Info className="w-3 h-3" />
                <span>Prices are estimates and may vary</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Important Information:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Rates are estimates and subject to change</li>
                <li>Final pricing will be confirmed during booking</li>
                <li>Transit times may vary based on customs clearance and weather conditions</li>
                <li>Additional fees may apply for special handling or documentation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && selectedRate && (
        <FreightBookingModal
          isOpen={showBookingModal}
          onClose={closeBookingModal}
          rate={selectedRate}
          originData={originData}
          destinationData={destinationData}
          loadDetails={loadDetails}
        />
      )}
    </div>
  );
};

export default FreightRatesDisplay;
