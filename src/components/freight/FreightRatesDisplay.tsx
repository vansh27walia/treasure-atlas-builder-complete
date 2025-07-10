
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Truck } from 'lucide-react';
import { FreightRate } from '@/types/freight';
import FreightBookingModal from './FreightBookingModal';

interface FreightRatesDisplayProps {
  rates: FreightRate[];
  onBooking: (rate: FreightRate) => void;
  originData?: any;
  destinationData?: any;
  loadDetails?: any;
}

const FreightRatesDisplay: React.FC<FreightRatesDisplayProps> = ({
  rates,
  onBooking,
  originData,
  destinationData,
  loadDetails
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
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Available Freight Options</h3>
        
        <div className="grid gap-4">
          {rates.map((rate, index) => (
            <Card key={index} className="relative hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Truck className="w-5 h-5 mr-2 text-blue-600" />
                    {rate.carrier}
                  </CardTitle>
                  <Badge variant={rate.serviceType === 'express' ? 'default' : 'secondary'}>
                    {rate.serviceType}
                  </Badge>
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
                      <p className="font-medium text-lg">${rate.totalCost.toLocaleString()}</p>
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

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleBookNow(rate)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
