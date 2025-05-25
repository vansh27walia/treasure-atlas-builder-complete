
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, DollarSign, Calendar } from 'lucide-react';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days: string | number;
  delivery_date?: string;
  rate_id?: string;
}

interface UShipRatesDisplayProps {
  rates: ShippingRate[];
  shipmentType: string;
  onSelectRate?: (rate: ShippingRate) => void;
}

const UShipRatesDisplay: React.FC<UShipRatesDisplayProps> = ({ 
  rates, 
  shipmentType, 
  onSelectRate 
}) => {
  if (!rates || rates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Rates Available</h3>
        <p className="text-gray-500">
          No shipping rates were found for your request. Please try adjusting your search criteria.
        </p>
      </Card>
    );
  }

  const formatDeliveryTime = (days: string | number) => {
    if (typeof days === 'number') {
      return days === 1 ? '1 day' : `${days} days`;
    }
    return days === 'N/A' ? 'Contact carrier' : days;
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">
          {shipmentType} Shipping Rates ({rates.length} found)
        </h3>
        <Badge variant="outline" className="text-sm">
          {shipmentType === 'LTL' ? 'Less Than Truckload' : 'Full Truckload'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {rates.map((rate, index) => (
          <Card key={rate.id || index} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Truck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{rate.carrier}</h4>
                    <p className="text-gray-600">{rate.service}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-500">Total Cost</p>
                      <p className="font-semibold text-lg">
                        {formatCurrency(rate.rate, rate.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Transit Time</p>
                      <p className="font-medium">
                        {formatDeliveryTime(rate.delivery_days)}
                      </p>
                    </div>
                  </div>

                  {rate.delivery_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Est. Delivery</p>
                        <p className="font-medium">
                          {new Date(rate.delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4 flex flex-col space-y-2">
                {onSelectRate && (
                  <Button 
                    onClick={() => onSelectRate(rate)}
                    className="min-w-[120px]"
                  >
                    Select Rate
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://uship.com', '_blank')}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">About These Rates</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Rates are estimates and may vary based on actual shipment details</li>
          <li>• Additional fees may apply for special services or handling</li>
          <li>• Contact carriers directly for final pricing and booking</li>
          <li>• Transit times are estimates and not guaranteed</li>
        </ul>
      </div>
    </div>
  );
};

export default UShipRatesDisplay;
