
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Truck, Info, Ship, Plane } from 'lucide-react';
import { FreightRate } from '@/types/freight';
import FreightBookingModal from './FreightBookingModal';

interface FreightRatesDisplayProps {
  rates: any[];
  onBooking: (rate: any) => void;
  originData?: any;
  destinationData?: any;
  loadDetails?: any;
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
  const [selectedRate, setSelectedRate] = useState<any | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookNow = (rate: any) => {
    console.log('Book Now clicked for rate:', rate);
    setSelectedRate(rate);
    setShowBookingModal(true);
    onBooking(rate);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedRate(null);
  };

  const getModeIcon = (mode: string) => {
    switch (mode.toUpperCase()) {
      case 'OCEAN':
        return <Ship className="w-5 h-5 text-blue-600" />;
      case 'AIR':
        return <Plane className="w-5 h-5 text-blue-600" />;
      default:
        return <Truck className="w-5 h-5 text-blue-600" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode.toUpperCase()) {
      case 'OCEAN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'AIR':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (rates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">No freight rates available for your route.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Request Summary */}
        {requestParams && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg text-blue-900">
                <Info className="w-5 h-5 mr-2" />
                Freight Estimate Request Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Origin:</span> {requestParams.origin}
                </div>
                <div>
                  <span className="font-medium">Destination:</span> {requestParams.destination}
                </div>
                <div>
                  <span className="font-medium">Origin Port:</span> {requestParams.originCode}
                </div>
                <div>
                  <span className="font-medium">Destination Port:</span> {requestParams.destinationCode}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rates Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Freight Rate Estimates from Freightos</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {rates.length} Live Estimate{rates.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {/* Rates Grid */}
        <div className="grid gap-4">
          {rates.map((rate, index) => (
            <Card key={index} className="relative hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    {getModeIcon(rate.mode)}
                    <span className="ml-2 capitalize">{rate.mode.toLowerCase()} Freight</span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getModeColor(rate.mode)}>
                      {rate.mode}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Live Estimate
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Price Range</p>
                      <p className="font-medium text-lg text-green-600">
                        ${rate.minPrice?.toLocaleString()} - ${rate.maxPrice?.toLocaleString()} USD
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Transit Time</p>
                      <p className="font-medium">
                        {rate.minTransitTime} - {rate.maxTransitTime} days
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    This is an estimate based on current market rates. Final pricing may vary based on 
                    exact route, timing, and additional services required.
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Powered by Freightos API
                  </div>
                  <Button
                    onClick={() => handleBookNow(rate)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Request Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">About these estimates:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Rates are estimated based on current market conditions via Freightos network</li>
                  <li>• Final pricing may vary based on exact routing, documentation, and additional services</li>
                  <li>• Transit times are estimates and may vary due to customs, weather, or operational factors</li>
                  <li>• Additional fees may apply for special handling, insurance, or premium services</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <FreightBookingModal
        isOpen={showBookingModal}
        onClose={handleCloseModal}
        rate={selectedRate}
        originData={originData}
        destinationData={destinationData}
        loadDetails={loadDetails}
      />
    </>
  );
};

export default FreightRatesDisplay;
