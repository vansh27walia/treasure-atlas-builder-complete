
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Truck, Tag, Shield } from 'lucide-react';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  price: number;
  estimatedDelivery: string;
  deliveryDays: string;
  features: string[];
}

const sampleRates: ShippingRate[] = [
  {
    id: '1',
    carrier: 'USPS',
    service: 'Priority Mail',
    price: 7.85,
    estimatedDelivery: 'Wed, Apr 28',
    deliveryDays: '1-3 business days',
    features: ['Tracking included', 'Insurance up to $50'],
  },
  {
    id: '2',
    carrier: 'USPS',
    service: 'First Class Package',
    price: 4.20,
    estimatedDelivery: 'Fri, Apr 30',
    deliveryDays: '2-5 business days',
    features: ['Tracking included'],
  },
  {
    id: '3',
    carrier: 'UPS',
    service: 'Ground',
    price: 9.65,
    estimatedDelivery: 'Thu, Apr 29',
    deliveryDays: '1-5 business days',
    features: ['Tracking included', 'Insurance up to $100'],
  },
  {
    id: '4',
    carrier: 'FedEx',
    service: 'Ground',
    price: 10.75,
    estimatedDelivery: 'Thu, Apr 29',
    deliveryDays: '1-5 business days',
    features: ['Tracking included', 'Insurance up to $100'],
  },
];

const ShippingRates: React.FC = () => {
  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Available Shipping Rates</h2>
          
          <div className="space-y-4">
            {sampleRates.map((rate) => (
              <div 
                key={rate.id} 
                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-semibold text-lg">{rate.carrier} {rate.service}</div>
                    {rate.id === '2' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Best Value
                      </span>
                    )}
                    {rate.id === '1' && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Fastest
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Est. delivery: {rate.estimatedDelivery} ({rate.deliveryDays})</span>
                    </div>
                    <div className="flex flex-wrap mt-2 gap-2">
                      {rate.features.map((feature, index) => (
                        <span key={index} className="inline-flex items-center text-xs bg-gray-100 px-2 py-0.5 rounded">
                          <Shield className="h-3 w-3 mr-1" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center">
                  <div className="mr-6 text-right">
                    <div className="text-2xl font-bold">${rate.price.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Retail: ${(rate.price * 1.4).toFixed(2)}</div>
                  </div>
                  <Button>Select</Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>* Rates shown are for demonstration purposes only.</p>
            <p>Actual rates may vary based on origin, destination, and package details.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingRates;
