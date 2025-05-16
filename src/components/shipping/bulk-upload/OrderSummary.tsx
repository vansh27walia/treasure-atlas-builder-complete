
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Loader, Printer } from 'lucide-react';

interface OrderSummaryProps {
  successfulCount: number;
  totalCost: number;
  onDownloadAllLabels: () => void;
  onProceedToPayment: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  successfulCount,
  totalCost,
  onDownloadAllLabels,
  onProceedToPayment,
  isPaying,
  isCreatingLabels
}) => {
  return (
    <div className="bg-white p-4 rounded-md border border-green-100">
      <h5 className="font-medium mb-2">Order Summary</h5>
      <div className="flex justify-between mb-1 text-sm">
        <span>Number of labels:</span>
        <span>{successfulCount}</span>
      </div>
      <div className="flex justify-between mb-1 text-sm">
        <span>Price per label:</span>
        <span>$4.99</span>
      </div>
      <div className="flex justify-between font-medium mt-2 pt-2 border-t border-green-100">
        <span>Total:</span>
        <span>${totalCost.toFixed(2)}</span>
      </div>
    
      <div className="flex justify-end gap-3 mt-4">
        <Button 
          variant="outline" 
          onClick={onDownloadAllLabels}
          disabled={isCreatingLabels}
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Download Labels
        </Button>
        <Button 
          onClick={onProceedToPayment}
          disabled={isPaying}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          {isPaying ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Pay ${totalCost.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;
