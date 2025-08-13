
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Loader, Shield, Calculator, DollarSign, Plus } from 'lucide-react';

interface OrderSummaryProps {
  successfulCount: number;
  totalCost: number;
  totalInsurance: number;
  onDownloadAllLabels: () => void;
  onProceedToPayment: () => void;
  onAddPaymentMethod?: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  successfulCount,
  totalCost,
  totalInsurance = 0,
  onDownloadAllLabels,
  onProceedToPayment,
  onAddPaymentMethod,
  isPaying,
  isCreatingLabels
}) => {
  // FIXED: Calculate the final total correctly - totalCost (shipping) + totalInsurance
  const shippingTotal = totalCost;
  const insuranceTotal = totalInsurance;
  const finalTotal = shippingTotal + insuranceTotal;
  
  const averageCostPerLabel = successfulCount > 0 ? finalTotal / successfulCount : 0;

  console.log('OrderSummary - Payment calculation:', {
    successfulCount,
    shippingTotal,
    insuranceTotal,
    finalTotal,
    averageCostPerLabel
  });

  return (
    <div className="bg-white p-8 rounded-xl border-2 border-green-100 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-6 w-6 text-green-600" />
        <h5 className="font-bold text-xl text-gray-800">Payment Summary</h5>
      </div>
      
      <div className="space-y-4 mb-6">
        {/* Label Count */}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600 font-medium">Number of labels:</span>
          <span className="font-bold text-lg text-gray-900">{successfulCount}</span>
        </div>
        
        {/* Shipping Cost Breakdown */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 font-medium">Shipping costs (sum of all row rates):</span>
            <span className="font-semibold text-blue-800">${shippingTotal.toFixed(2)}</span>
          </div>
          {successfulCount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Average per label:</span>
              <span className="text-gray-600">${(shippingTotal / successfulCount).toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {/* Insurance Cost Breakdown */}
        {insuranceTotal > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700 font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                Insurance costs (sum of all row insurance):
              </span>
              <span className="font-semibold text-amber-800">${insuranceTotal.toFixed(2)}</span>
            </div>
            {successfulCount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Average per label:</span>
                <span className="text-gray-600">${(insuranceTotal / successfulCount).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced Total Amount Payment Box */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-8 rounded-2xl border-3 border-green-300 shadow-xl">
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-3 mb-3">
              <DollarSign className="h-10 w-10 text-green-600" />
              <span className="font-bold text-3xl text-green-800">Total Payment Amount</span>
            </div>
            <div className="text-center mb-4">
              <span className="font-bold text-6xl text-green-700 tracking-tight">${finalTotal.toFixed(2)}</span>
            </div>
            
            <div className="bg-white/90 p-6 rounded-xl border-2 border-green-200 shadow-lg">
              <div className="text-center text-sm text-green-700 space-y-2">
                <p className="font-semibold text-lg">
                  {insuranceTotal > 0 
                    ? `Shipping: $${shippingTotal.toFixed(2)} + Insurance: $${insuranceTotal.toFixed(2)}`
                    : `Total of all row rates: $${shippingTotal.toFixed(2)}`
                  }
                </p>
                {successfulCount > 0 && (
                  <p className="text-sm text-green-600 font-medium">
                    Average cost per label: ${averageCostPerLabel.toFixed(2)}
                  </p>
                )}
                <p className="text-xs text-green-500 mt-3 font-medium bg-green-100 px-3 py-2 rounded-lg">
                  ✓ All {successfulCount} rows calculated: Rate + Insurance for each row
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Enhanced Payment Button with Add Payment Option */}
        <div className="space-y-3">
          <Button 
            onClick={onProceedToPayment}
            disabled={isPaying || successfulCount === 0}
            className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 text-white w-full py-8 text-3xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-2xl"
            size="lg"
          >
            {isPaying ? (
              <>
                <Loader className="mr-4 h-10 w-10 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-4 h-10 w-10" />
                Pay ${finalTotal.toFixed(2)}
                {insuranceTotal > 0 && (
                  <span className="ml-3 text-xl opacity-90">
                    (incl. ${insuranceTotal.toFixed(2)} insurance)
                  </span>
                )}
              </>
            )}
          </Button>
          
          {/* Add Payment Method Button */}
          {onAddPaymentMethod && (
            <Button 
              variant="outline" 
              onClick={onAddPaymentMethod}
              className="w-full py-4 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-semibold transition-all duration-300 rounded-xl"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Payment Method
            </Button>
          )}
        </div>
        
        {/* Download Button */}
        <Button 
          variant="outline" 
          onClick={onDownloadAllLabels}
          disabled={isCreatingLabels}
          className="w-full py-4 border-2 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-300 rounded-xl"
        >
          {isCreatingLabels ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              Generating Labels...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Download All Labels
            </>
          )}
        </Button>
        
        {/* Enhanced Summary Info */}
        <div className="text-center text-sm text-gray-500 pt-6 border-t-2 border-gray-100">
          <p className="font-semibold text-gray-700 text-lg mb-2">🔒 Secure Payment Processing</p>
          <p className="text-gray-600">Real-time rate calculation • Each row total calculated</p>
          {insuranceTotal > 0 && (
            <p className="text-amber-600 font-medium mt-3 flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 rounded-lg">
              <Shield className="h-5 w-5" />
              Insurance coverage included for all {successfulCount} shipments
            </p>
          )}
          <p className="text-xs text-gray-400 mt-3 bg-gray-50 px-3 py-2 rounded-lg">
            Payment Calculation: Sum of (Rate + Insurance) for each row = Final Total
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
