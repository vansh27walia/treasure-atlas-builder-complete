
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Package, Shield, Star, TrendingDown, Zap } from 'lucide-react';
import { useShippingRates, ShippingRate } from '@/hooks/useShippingRates';
import CarrierLogo from './shipping/CarrierLogo';
import ShippingRateDropdown from './shipping/ShippingRateDropdown';

interface ShippingRatesProps {
  rates: ShippingRate[];
  onRateSelected: (rate: ShippingRate | string) => void;
  loading?: boolean;
  selectedRateId?: string;
  showEnhancedUI?: boolean;
}

const ShippingRates: React.FC<ShippingRatesProps> = ({ 
  rates, 
  onRateSelected, 
  loading = false, 
  selectedRateId,
  showEnhancedUI = false 
}) => {
  const {
    handleCreateLabel,
    handleProceedToPayment,
    isLoading,
    isProcessingPayment
  } = useShippingRates();

  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedRateId || null);

  useEffect(() => {
    setLocalSelectedId(selectedRateId || null);
  }, [selectedRateId]);

  const handleRateSelect = (rateId: string) => {
    setLocalSelectedId(rateId);
    const selectedRate = rates.find(rate => rate.id === rateId);
    if (selectedRate) {
      onRateSelected(selectedRate);
    }
  };

  const handleCreateLabelClick = async () => {
    if (!localSelectedId) return;
    try {
      const selectedRate = rates.find(rate => rate.id === localSelectedId);
      if (selectedRate) {
        await handleCreateLabel(selectedRate.id, selectedRate.shipment_id);
      }
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  // Get best value and fastest rates
  const getBestValueRate = () => {
    if (rates.length === 0) return null;
    const sortedRates = [...rates].sort((a, b) => {
      const aPrice = parseFloat(a.rate);
      const bPrice = parseFloat(b.rate);
      if (aPrice !== bPrice) return aPrice - bPrice;
      return (a.delivery_days || 999) - (b.delivery_days || 999);
    });
    return sortedRates[0]?.id;
  };

  const getFastestRate = () => {
    if (rates.length === 0) return null;
    const sortedRates = [...rates].sort((a, b) => 
      (a.delivery_days || 999) - (b.delivery_days || 999)
    );
    return sortedRates[0]?.id;
  };

  const bestValueRateId = getBestValueRate();
  const fastestRateId = getFastestRate();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading shipping rates...</span>
        </div>
      </div>
    );
  }

  if (!rates || rates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No shipping rates available</h3>
        <p className="text-gray-500">Please fill out the shipping form to get rates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
      <div className="border-b-2 border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Shipping Rates</h2>
        <p className="text-gray-600">Choose the best shipping option for your package</p>
        <div className="mt-3 flex gap-2 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <TrendingDown className="w-4 h-4" />
            Best prices guaranteed
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <Shield className="w-4 h-4" />
            Secure shipping
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Rate Dropdown Selection */}
        <div className="space-y-4">
          <ShippingRateDropdown
            rates={rates}
            selectedRateId={localSelectedId}
            onSelectRate={handleRateSelect}
            bestValueRateId={bestValueRateId}
            fastestRateId={fastestRateId}
            isLoading={isLoading}
            onCreateLabel={handleCreateLabelClick}
          />
          
          {/* Payment Section */}
          {localSelectedId && (
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Options</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleCreateLabelClick}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white border-2 border-green-600"
                >
                  {isLoading ? 'Creating Label...' : 'Create Shipping Label'}
                </Button>
                
                <Button
                  onClick={handleProceedToPayment}
                  disabled={isProcessingPayment}
                  variant="outline"
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {isProcessingPayment ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShippingRates;
