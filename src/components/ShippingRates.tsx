
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, Shield, Star } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import InlinePaymentSection from './shipping/InlinePaymentSection';
import CarrierLogo from './shipping/CarrierLogo';

interface ShippingRate {
  id: string;
  rate: string;
  original_rate?: string;
  discount_percentage?: number;
  carrier: string;
  service: string;
  delivery_days: number;
  currency: string;
  isPremium?: boolean;
  estimated_delivery_date?: string;
}

interface ShippingRatesProps {
  rates: ShippingRate[];
  onRateSelected: (rate: ShippingRate) => void;
  loading?: boolean;
  selectedRateId?: string;
  shipmentDetails?: any;
  insuranceAmount?: number;
}

const ShippingRatesDisplay: React.FC<ShippingRatesProps> = ({
  rates,
  onRateSelected,
  loading = false,
  selectedRateId,
  shipmentDetails,
  insuranceAmount = 0
}) => {
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<any>();
  const [showLabelModal, setShowLabelModal] = useState(false);

  useEffect(() => {
    const handleRatesReceived = (event: any) => {
      console.log('Rates received event:', event.detail);
      if (event.detail?.shipment) {
        setShipmentDetails(event.detail.shipment);
      }
    };
    
    document.addEventListener('ratesReceived', handleRatesReceived);
    return () => document.removeEventListener('ratesReceived', handleRatesReceived);
  }, []);

  // Calculate estimated delivery date
  const calculateEstimatedDelivery = (deliveryDays: number): string => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get carrier brand colors
  const getCarrierColors = (carrier: string) => {
    const carrierUpper = carrier.toUpperCase();
    switch (carrierUpper) {
      case 'UPS':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          accent: 'bg-amber-600'
        };
      case 'FEDEX':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          accent: 'bg-purple-600'
        };
      case 'DHL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          accent: 'bg-red-600'
        };
      case 'USPS':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          accent: 'bg-blue-600'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          accent: 'bg-gray-600'
        };
    }
  };

  const handleRateSelection = (rate: ShippingRate) => {
    console.log('Rate selected:', rate);
    setSelectedRate(rate);
    onRateSelected(rate);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment successful, creating label...', paymentData);
    setIsCreatingLabel(true);
    
    try {
      // Navigate to label success page with the payment data
      window.location.href = `/label-success?labelUrl=${encodeURIComponent(paymentData.labelUrl || '')}&trackingCode=${encodeURIComponent(paymentData.trackingCode || '')}&shipmentId=${encodeURIComponent(paymentData.shipmentId || '')}`;
    } catch (error) {
      console.error('Error after payment:', error);
      toast.error('Payment successful but there was an issue creating the label');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-600">Loading shipping rates...</div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!rates || rates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rates available</h3>
        <p className="text-gray-600">Please check your shipping details and try again.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Shipping Method</h3>
        
        {rates.map((rate) => {
          const colors = getCarrierColors(rate.carrier);
          const isSelected = selectedRateId === rate.id || selectedRate?.id === rate.id;
          const estimatedDelivery = calculateEstimatedDelivery(rate.delivery_days);
          
          return (
            <Card
              key={rate.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? `ring-2 ring-offset-2 ${colors.border.replace('border-', 'ring-')}`
                  : colors.border
              } ${colors.bg}`}
              onClick={() => handleRateSelection(rate)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-semibold ${colors.text}`}>
                          {rate.carrier}
                        </h4>
                        {rate.isPremium && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        {rate.service}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>Estimated Delivery: {estimatedDelivery}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      {rate.original_rate && rate.discount_percentage && rate.discount_percentage > 0 && (
                        <div className="text-right">
                          <div className="text-sm text-gray-500 line-through">
                            ${parseFloat(rate.original_rate).toFixed(2)}
                          </div>
                          <Badge variant="destructive" className="text-xs mb-1">
                            Save {rate.discount_percentage}%
                          </Badge>
                        </div>
                      )}
                      <div className={`text-xl font-bold ${colors.text}`}>
                        ${parseFloat(rate.rate).toFixed(2)}
                      </div>
                    </div>
                    
                    {rate.delivery_days <= 2 && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        Express Delivery
                      </div>
                    )}
                  </div>
                </div>
                
                {isSelected && (
                  <div className={`absolute inset-0 rounded-lg ring-2 ring-offset-2 ${colors.border.replace('border-', 'ring-')} pointer-events-none`} />
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {showPayment && selectedRate && (
        <div className="mt-8">
          <InlinePaymentSection
            selectedRate={selectedRate}
            shipmentDetails={shipmentDetails}
            onPaymentSuccess={handlePaymentSuccess}
            insuranceAmount={insuranceAmount}
            isCreatingLabel={isCreatingLabel}
          />
        </div>
      )}
    </div>
  );
};

export default ShippingRatesDisplay;
