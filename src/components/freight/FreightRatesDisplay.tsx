
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Truck, Info } from 'lucide-react';
import { FreightRate } from '@/types/freight';
import FreightBookingModal from './FreightBookingModal';

interface FreightRatesDisplayProps {
  rates: FreightRate[];
  onBooking: (rate: FreightRate) => void;
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
  const [selectedRate, setSelectedRate] = useState<FreightRate | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookNow = (rate: FreightRate) => {
    console.log('Book Now clicked for rate:', rate);
    setSelectedRate(rate);
    setShowBookingModal(true);
    onBooking(rate);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedRate(null);
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
                Quote Request Summary
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
                  <span className="font-medium">Weight:</span> {requestParams.weight}
                </div>
                <div>
                  <span className="font-medium">Dimensions:</span> {requestParams.dimensions}
                </div>
                <div>
                  <span className="font-medium">Load Type:</span> {requestParams.loadType}
                </div>
                <div>
                  <span className="font-medium">Quantity:</span> {requestParams.quantity}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rates Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Real Freight Rates from Freightos</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {rates.length} Live Quote{rates.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {/* Rates Grid */}
        <div className="grid gap-4">
          {rates.map((rate, index) => (
            <Card key={index} className="relative hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Truck className="w-5 h-5 mr-2 text-blue-600" />
                    {rate.carrier}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={rate.serviceType?.toLowerCase().includes('express') ? 'default' : 'secondary'}>
                      {rate.serviceType}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Live Rate
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Transit Time</p>
                      <p className="font-medium">{rate.transitTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Total Cost</p>
                      <p className="font-medium text-lg text-green-600">
                        ${rate.totalCost.toLocaleString()} {rate.currency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Service Level</p>
                      <p className="font-medium capitalize">{rate.serviceLevel || 'Standard'}</p>
                    </div>
                  </div>
                </div>

                {rate.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">{rate.notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Powered by Freightos API
                  </div>
                  <Button
                    onClick={() => handleBookNow(rate)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Book This Rate
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
                <p className="font-medium mb-1">About these rates:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Rates are fetched live from the Freightos network</li>
                  <li>• Prices may vary based on final booking details and current market conditions</li>
                  <li>• Additional fees may apply for special handling or services</li>
                  <li>• Transit times are estimates and may vary due to customs or weather</li>
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
