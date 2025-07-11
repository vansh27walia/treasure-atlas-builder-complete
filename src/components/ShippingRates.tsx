
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Truck } from 'lucide-react';
import ShippingRateCard from '@/components/shipping/ShippingRateCard';
import { Badge } from '@/components/ui/badge';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days?: number;
  delivery_date?: string | null;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
}

interface ShippingRatesProps {
  rates: ShippingRate[];
  isLoading: boolean;
  error?: string;
  onRateSelect: (rateId: string) => void;
  selectedRateId?: string;
  onCreateLabel?: () => void;
  showCreateButton?: boolean;
}

const ShippingRates: React.FC<ShippingRatesProps> = ({
  rates,
  isLoading,
  error,
  onRateSelect,
  selectedRateId,
  onCreateLabel,
  showCreateButton = false
}) => {
  const [sortedRates, setSortedRates] = useState<ShippingRate[]>([]);

  useEffect(() => {
    if (rates && rates.length > 0) {
      const sorted = [...rates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
      setSortedRates(sorted);
    }
  }, [rates]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Shipping Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading shipping rates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Shipping Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sortedRates || sortedRates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Shipping Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No shipping rates available</p>
            <p className="text-sm text-gray-500 mt-2">
              Please check your shipping details and try again
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bestValueRate = sortedRates[0];
  const fastestRate = sortedRates.reduce((fastest, rate) => {
    const rateDays = rate.delivery_days || rate.est_delivery_days || 999;
    const fastestDays = fastest.delivery_days || fastest.est_delivery_days || 999;
    return rateDays < fastestDays ? rate : fastest;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Truck className="mr-2 h-5 w-5" />
            Shipping Rates
          </div>
          <Badge variant="outline">
            {sortedRates.length} option{sortedRates.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedRates.map((rate) => (
            <ShippingRateCard
              key={rate.id}
              rate={rate}
              isSelected={selectedRateId === rate.id}
              onSelect={onRateSelect}
              onLabelCreate={onCreateLabel}
              isBestValue={rate.id === bestValueRate?.id}
              isFastest={rate.id === fastestRate?.id}
              showCreateButton={showCreateButton && selectedRateId === rate.id}
            />
          ))}
        </div>
        
        {selectedRateId && showCreateButton && (
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={onCreateLabel}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Create Shipping Label
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingRates;
