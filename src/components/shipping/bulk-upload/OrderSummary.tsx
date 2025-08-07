
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Loader, Shield, Calculator, DollarSign } from 'lucide-react';

interface OrderSummaryProps {
  successfulCount: number;
  totalCost: number;
  totalInsurance: number;
  onDownloadAllLabels: () => void;
  onProceedToPayment: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  successfulCount,
  totalCost,
  totalInsurance = 0,
  onDownloadAllLabels,
  onProceedToPayment,
  isPaying,
  isCreatingLabels
}) => {
  // Properly calculate the final total including both shipping and insurance
  const shippingTotal = totalCost;
  const insuranceTotal = totalInsurance;
  const finalTotal = shippingTotal + insuranceTotal;
  
  const averageCostPerLabel = successfulCount > 0 ? finalTotal / successfulCount : 0;

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
            <span className="text-gray-700 font-medium">Shipping costs:</span>
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
                Insurance costs:
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
        
        {/* Total Amount - Prominently Displayed */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              <span className="font-bold text-lg text-green-800">Total Amount:</span>
            </div>
            <span className="font-bold text-3xl text-green-700">${finalTotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 text-right">
            <p className="text-sm text-green-600">
              {insuranceTotal > 0 
                ? `Shipping: $${shippingTotal.toFixed(2)} + Insurance: $${insuranceTotal.toFixed(2)}`
                : 'Shipping costs only'
              }
            </p>
            {successfulCount > 0 && (
              <p className="text-xs text-green-500 mt-1">
                Average: ${averageCostPerLabel.toFixed(2)} per label
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Payment Button - Enhanced */}
        <Button 
          onClick={onProceedToPayment}
          disabled={isPaying || successfulCount === 0}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full py-4 text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
          size="lg"
        >
          {isPaying ? (
            <>
              <Loader className="mr-3 h-6 w-6 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-3 h-6 w-6" />
              Pay ${finalTotal.toFixed(2)}
              {insuranceTotal > 0 && (
                <span className="ml-2 text-sm opacity-90">
                  (incl. insurance)
                </span>
              )}
            </>
          )}
        </Button>
        
        {/* Download Button - Enhanced */}
        <Button 
          variant="outline" 
          onClick={onDownloadAllLabels}
          disabled={isCreatingLabels}
          className="w-full py-3 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
        >
          {isCreatingLabels ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Generating Labels...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download All Labels
            </>
          )}
        </Button>
        
        {/* Summary Info */}
        <div className="text-center text-sm text-gray-500 pt-2 border-t">
          <p>Secure payment processing • All costs calculated in real-time</p>
          {insuranceTotal > 0 && (
            <p className="text-amber-600 font-medium mt-1">
              ✓ Insurance coverage included for all shipments
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
