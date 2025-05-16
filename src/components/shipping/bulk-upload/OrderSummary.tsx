
import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Download, Printer } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const handlePrintAllLabels = () => {
    // This will trigger the download format modal, which will have a print option
    onDownloadAllLabels();
  };

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline"
              disabled={isCreatingLabels}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={onDownloadAllLabels}
              className="cursor-pointer"
            >
              <Download className="h-4 w-4 mr-2" />
              <span>Download PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handlePrintAllLabels}
              className="cursor-pointer"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span>Print All Labels</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          onClick={onProceedToPayment}
          disabled={isPaying}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ${totalCost.toFixed(2)}
        </Button>
      </div>
    </div>
  );
};

export default OrderSummary;
