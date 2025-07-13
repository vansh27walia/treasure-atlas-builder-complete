
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useShippingRates } from '@/hooks/useShippingRates';
import { Clock, Truck, DollarSign, Shield, Star, Zap, Award } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const ShippingRates: React.FC = () => {
  const {
    rates,
    isLoading,
    selectedRateId,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    activeCarrierFilter,
    handleSelectRate,
    handleCreateLabel,
    handleFilterByCarrier
  } = useShippingRates();

  const [insuranceCharge, setInsuranceCharge] = useState(0);

  useEffect(() => {
    // Listen for insurance charge from the form
    const handleRatesReceived = (event: CustomEvent) => {
      if (event.detail?.insuranceCharge) {
        setInsuranceCharge(event.detail.insuranceCharge);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    
    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    };
  }, []);

  if (!rates || rates.length === 0) {
    return null;
  }

  const getRateBadge = (rateId: string) => {
    const badges = [];
    
    if (rateId === bestValueRateId) {
      badges.push(
        <Badge key="best-value" className="bg-green-100 text-green-800 hover:bg-green-200">
          <Award className="h-3 w-3 mr-1" />
          Best Value
        </Badge>
      );
    }
    
    if (rateId === fastestRateId) {
      badges.push(
        <Badge key="fastest" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Zap className="h-3 w-3 mr-1" />
          Fastest
        </Badge>
      );
    }
    
    return badges;
  };

  const formatDeliveryInfo = (rate: any) => {
    if (rate.delivery_date) {
      return `By ${new Date(rate.delivery_date).toLocaleDateString()}`;
    } else if (rate.delivery_days) {
      return `${rate.delivery_days} business day${rate.delivery_days > 1 ? 's' : ''}`;
    }
    return 'Delivery time varies';
  };

  const handleQuickLabel = async (rateId: string) => {
    try {
      await handleCreateLabel(rateId);
      toast.success('Label created successfully!');
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label. Please try again.');
    }
  };

  return (
    <div id="shipping-rates-section" className="w-full max-w-6xl mx-auto mt-8">
      <Card className="border border-gray-200 shadow-lg bg-white">
        <CardHeader className="text-center bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl font-bold mb-2 flex items-center justify-center">
            <Truck className="mr-2 h-6 w-6" />
            Available Shipping Rates
          </CardTitle>
          <p className="text-green-100">
            {rates.length} rate{rates.length !== 1 ? 's' : ''} found • 
            {insuranceCharge > 0 && ` Insurance: $${insuranceCharge.toFixed(2)} • `}
            Select the best option for your shipment
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Carrier Filter */}
          {uniqueCarriers.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 self-center mr-2">Filter by carrier:</span>
              <Button
                variant={activeCarrierFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterByCarrier('all')}
                className="text-xs"
              >
                All Carriers
              </Button>
              {uniqueCarriers.map((carrier) => (
                <Button
                  key={carrier}
                  variant={activeCarrierFilter === carrier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterByCarrier(carrier)}
                  className="text-xs"
                >
                  {carrier}
                </Button>
              ))}
            </div>
          )}

          {/* Rates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rates.map((rate) => {
              const totalRate = insuranceCharge > 0 
                ? (parseFloat(rate.rate) + insuranceCharge).toFixed(2)
                : rate.rate;
              
              return (
                <Card
                  key={rate.id}
                  data-rate-id={rate.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedRateId === rate.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectRate(rate.id)}
                >
                  <CardContent className="p-4">
                    {/* Rate badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {getRateBadge(rate.id)}
                    </div>

                    {/* Carrier and Service */}
                    <div className="mb-3">
                      <div className="font-semibold text-lg text-gray-900 uppercase">
                        {rate.carrier}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {rate.service?.replace(/_/g, ' ').toLowerCase()}
                      </div>
                    </div>

                    {/* Price Display */}
                    <div className="mb-3">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                        <span className="text-2xl font-bold text-green-600">
                          ${totalRate}
                        </span>
                      </div>
                      
                      {/* Insurance breakdown */}
                      {insuranceCharge > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          <div className="flex justify-between">
                            <span>Shipping:</span>
                            <span>${rate.rate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center">
                              <Shield className="h-3 w-3 mr-1" />
                              Insurance:
                            </span>
                            <span>${insuranceCharge.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Original rate if different */}
                      {rate.original_rate && parseFloat(rate.original_rate) > parseFloat(rate.rate) && (
                        <div className="text-sm text-gray-500 line-through">
                          Was: ${rate.original_rate}
                        </div>
                      )}
                    </div>

                    {/* Delivery Time */}
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDeliveryInfo(rate)}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRate(rate.id);
                        }}
                        className={`w-full ${
                          selectedRateId === rate.id
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                        size="sm"
                      >
                        {selectedRateId === rate.id ? 'Selected' : 'Select Rate'}
                      </Button>
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLabel(rate.id);
                        }}
                        variant="outline"
                        className="w-full text-green-600 border-green-600 hover:bg-green-50"
                        size="sm"
                      >
                        Quick Create Label
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Selected Rate Actions */}
          {selectedRateId && (
            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Ready to create your shipping label?
                </h3>
                <p className="text-blue-600 mb-4">
                  You've selected a rate. Click below to proceed with label creation.
                </p>
                <Button
                  onClick={() => handleCreateLabel()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold"
                  size="lg"
                >
                  Create Shipping Label
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingRates;
