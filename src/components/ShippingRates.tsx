
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, DollarSign, Package } from 'lucide-react';
import { Rate } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import CarrierLogo from '@/components/shipping/CarrierLogo';

interface ShippingRatesProps {
  rates: Rate[];
  isLoading: boolean;
  onSelectRate: (rate: Rate) => void;
  selectedRateId?: string;
  labelUrl?: string;
  trackingCode?: string;
  shipmentId?: string;
  fromAddress?: string;
  toAddress?: string;
  weight?: string;
  dimensions?: string;
  service?: string;
  carrier?: string;
}

const ShippingRates: React.FC<ShippingRatesProps> = ({
  rates,
  isLoading,
  onSelectRate,
  selectedRateId,
  labelUrl,
  trackingCode,
  shipmentId,
  fromAddress,
  toAddress,
  weight,
  dimensions,
  service,
  carrier
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Loading Shipping Rates...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-20 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rates || rates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            No Shipping Rates Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No shipping rates found for this shipment. Please check your package details and addresses.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Shipping Rates ({rates.length} options)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rates.map((rate) => (
              <div
                key={rate.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedRateId === rate.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onSelectRate(rate)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CarrierLogo carrier={rate.carrier} size="sm" />
                    <div>
                      <h3 className="font-semibold text-lg">{rate.carrier}</h3>
                      <p className="text-sm text-gray-600">{rate.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        ${parseFloat(rate.rate).toFixed(2)}
                      </span>
                    </div>
                    {rate.delivery_days && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {rate.delivery_days} business days
                      </div>
                    )}
                  </div>
                </div>
                
                {rate.delivery_days && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <Package className="h-3 w-3 mr-1" />
                    Estimated delivery: {rate.delivery_days} business days
                  </div>
                )}
                
                {selectedRateId === rate.id && (
                  <Badge className="mt-2" variant="default">
                    Selected
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Print Preview Modal */}
      {labelUrl && trackingCode && shipmentId && (
        <PrintPreview
          isOpenProp={isPreviewOpen}
          onOpenChangeProp={setIsPreviewOpen}
          labelUrl={labelUrl}
          trackingCode={trackingCode}
          shipmentDetails={{
            fromAddress: fromAddress || '',
            toAddress: toAddress || '',
            weight: weight || '',
            dimensions,
            service: service || '',
            carrier: carrier || ''
          }}
          shipmentId={shipmentId}
        />
      )}
    </div>
  );
};

export default ShippingRates;
