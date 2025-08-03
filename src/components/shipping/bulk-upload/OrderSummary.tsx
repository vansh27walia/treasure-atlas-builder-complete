
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Loader, Shield } from 'lucide-react';

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
  const shippingCost = totalCost - (successfulCount * 2.00); // Subtract insurance
  const insuranceCost = successfulCount * 2.00; // $2 per shipment insurance

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h5 className="font-semibold text-lg mb-4 text-gray-900">Order Summary</h5>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700">Number of labels:</span>
          <span className="font-medium">{successfulCount}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-700">Shipping costs:</span>
          <span className="font-medium">${shippingCost.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm text-green-700">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span>Insurance ({successfulCount} × $2.00):</span>
          </div>
          <span className="font-medium">${insuranceCost.toFixed(2)}</span>
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center font-semibold text-lg">
            <span className="text-gray-900">Total:</span>
            <span className="text-blue-600">${totalCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-800 mb-1">Insurance Included</p>
            <p>All shipments include $100 insurance coverage for lost or damaged packages.</p>
          </div>
        </div>
      </div>
    
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={onDownloadAllLabels}
          disabled={isCreatingLabels || isPaying}
          className="border-gray-300 hover:bg-gray-50"
        >
          <Download className="mr-2 h-4 w-4" />
          Download All Labels
        </Button>
        <Button 
          onClick={onProceedToPayment}
          disabled={isPaying || isCreatingLabels}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          size="lg"
        >
          {isPaying ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${totalCost.toFixed(2)}
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Payment includes shipping + insurance. Labels will be generated automatically after payment.</p>
      </div>
    </div>
  );
};

export default OrderSummary;
