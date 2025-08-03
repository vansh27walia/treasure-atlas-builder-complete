
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Loader, Shield } from 'lucide-react';

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
  const finalTotal = totalCost + totalInsurance;

  return (
    <div className="bg-white p-6 rounded-lg border border-green-100 shadow-lg">
      <h5 className="font-semibold mb-4 text-lg text-gray-800">Order Summary</h5>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Number of labels:</span>
          <span className="font-medium">{successfulCount}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping cost:</span>
          <span className="font-medium">${totalCost.toFixed(2)}</span>
        </div>
        
        {totalInsurance > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Insurance cost:
            </span>
            <span className="font-medium">${totalInsurance.toFixed(2)}</span>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total Amount:</span>
            <span className="text-green-600">${finalTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totalInsurance > 0 ? 'Including shipping and insurance costs' : 'Shipping costs only'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={onProceedToPayment}
          disabled={isPaying}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 text-lg font-semibold"
          size="lg"
        >
          {isPaying ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ${finalTotal.toFixed(2)}
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onDownloadAllLabels}
          disabled={isCreatingLabels}
          className="w-full py-2"
        >
          <Download className="mr-2 h-4 w-4" />
          Download All Labels
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;
