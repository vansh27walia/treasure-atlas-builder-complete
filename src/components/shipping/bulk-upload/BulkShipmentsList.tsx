
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Package, Truck, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { toast } from '@/components/ui/sonner';

interface BulkShipmentsListProps {
  results: BulkUploadResult;
  onSelectRate: (shipmentId: string, rateId: string) => void;
  onRemoveShipment: (shipmentId: string) => void;
  onEditShipment: (shipmentId: string, updates: any) => void;
  onCreateLabels: () => void;
  isCreatingLabels: boolean;
  searchTerm: string;
  sortField: 'recipient' | 'carrier' | 'rate';
  sortDirection: 'asc' | 'desc';
  selectedCarrierFilter: string;
  filteredShipments: any[];
}

const BulkShipmentsList: React.FC<BulkShipmentsListProps> = ({
  results,
  onSelectRate,
  onRemoveShipment,
  onEditShipment,
  onCreateLabels,
  isCreatingLabels,
  filteredShipments
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Check if all shipments have rates and selected rates
  const shipmentsWithRates = filteredShipments.filter(s => s.availableRates && s.availableRates.length > 0);
  const shipmentsWithSelectedRates = filteredShipments.filter(s => s.selectedRateId);
  const allRatesReady = shipmentsWithRates.length === filteredShipments.length && shipmentsWithSelectedRates.length === filteredShipments.length;
  
  // Calculate total cost
  const totalCost = filteredShipments.reduce((sum, shipment) => {
    const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
    return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
  }, 0);

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      setPaymentCompleted(true);
      setShowPayment(false);
      toast.success('Payment successful! Creating labels...');
      
      // Trigger label creation after payment
      setTimeout(() => {
        onCreateLabels();
      }, 1000);
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method for bulk:', paymentMethodId);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Summary
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredShipments.length} shipments
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {shipmentsWithRates.length}
              </div>
              <div className="text-sm text-gray-600">Rates Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {shipmentsWithSelectedRates.length}
              </div>
              <div className="text-sm text-gray-600">Rates Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${totalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>

          {/* Payment Section - Show when all rates are ready */}
          {allRatesReady && !paymentCompleted && !isCreatingLabels && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Ready for Payment
                </h3>
                <div className="text-lg font-bold text-green-600">
                  ${totalCost.toFixed(2)}
                </div>
              </div>

              {!showPayment ? (
                <Button 
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Payment
                </Button>
              ) : (
                <div className="space-y-4">
                  <PaymentMethodSelector
                    selectedPaymentMethod={null}
                    onPaymentMethodChange={handlePaymentMethodChange}
                    onPaymentComplete={handlePaymentComplete}
                    amount={totalCost}
                    description={`Bulk Label Creation (${filteredShipments.length} labels)`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowPayment(false)}
                    className="w-full"
                  >
                    Cancel Payment
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator */}
          {!allRatesReady && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Please select rates for all shipments to proceed with payment
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment, index) => (
          <Card key={shipment.id} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {shipment.recipient || shipment.details?.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}
                  </p>
                </div>
                <Badge 
                  variant={shipment.status === 'completed' ? 'default' : 'secondary'}
                  className={shipment.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                >
                  {shipment.status}
                </Badge>
              </div>

              {/* Rate Selection */}
              {shipment.availableRates && shipment.availableRates.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Shipping Rate:
                  </label>
                  <div className="grid gap-2">
                    {shipment.availableRates.slice(0, 3).map((rate) => (
                      <div
                        key={rate.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          shipment.selectedRateId === rate.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => onSelectRate(shipment.id, rate.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              shipment.selectedRateId === rate.id
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {shipment.selectedRateId === rate.id && (
                                <CheckCircle className="w-3 h-3 text-white m-0.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {rate.carrier.toUpperCase()} {rate.service}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {rate.delivery_days} business days
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              ${parseFloat(rate.rate).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="h-4 w-4" />
                    <span className="text-sm">Loading rates...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BulkShipmentsList;
