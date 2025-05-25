
import React, { useState } from 'react';
import UnifiedShippingForm from '@/components/shipping/UnifiedShippingForm';
import UShipRatesDisplay from '@/components/shipping/UShipRatesDisplay';
import { Separator } from '@/components/ui/separator';
import { Truck, Package } from 'lucide-react';

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

const UnifiedShippingPage: React.FC = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [shipmentType, setShipmentType] = useState<string>('');

  const handleRatesReceived = (newRates: ShippingRate[], type: string) => {
    setRates(newRates);
    setShipmentType(type);
  };

  const handleSelectRate = (rate: ShippingRate) => {
    console.log('Selected rate:', rate);
    // Here you could navigate to a booking page or handle the selection
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <Truck className="mr-3 h-8 w-8 text-blue-600" />
          Freight Shipping Quotes
        </h1>
        <p className="text-gray-600 text-lg">
          Get instant quotes for LTL and FTL shipping from trusted carriers across the network
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <UnifiedShippingForm onRatesReceived={handleRatesReceived} />
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 text-blue-900">
              Shipping Types
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Package className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800">LTL Shipping</h4>
                  <p className="text-sm text-blue-700">
                    Less Than Truckload shipping for smaller freight that doesn't require a full truck. 
                    Cost-effective for shipments under 15,000 lbs.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Truck className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-purple-800">FTL Shipping</h4>
                  <p className="text-sm text-purple-700">
                    Full Truckload shipping for larger shipments that require dedicated trailer space. 
                    Ideal for 15,000+ lbs or time-sensitive deliveries.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-lg mb-3 text-yellow-900">
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• Accurate dimensions and weight ensure better pricing</li>
              <li>• Flexible pickup dates often result in lower rates</li>
              <li>• Consider freight class carefully for LTL shipments</li>
              <li>• Book early for the best carrier availability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {rates.length > 0 && (
        <>
          <Separator className="my-8" />
          <UShipRatesDisplay 
            rates={rates} 
            shipmentType={shipmentType}
            onSelectRate={handleSelectRate}
          />
        </>
      )}
    </div>
  );
};

export default UnifiedShippingPage;
