
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
  onEmailAllLabels?: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  successfulCount,
  totalCost,
  totalInsurance = 0,
  onDownloadAllLabels,
  onProceedToPayment,
  onAddPaymentMethod,
  isPaying,
  isCreatingLabels,
  onEmailAllLabels
}) => {
  // FIXED: totalCost now already includes shipping + insurance from BulkUploadView calculation
  const finalTotal = totalCost; // This is the sum of all row totals (shipping + insurance)
  const insuranceTotal = totalInsurance; // Keep for breakdown display
  
  const averageCostPerLabel = successfulCount > 0 ? finalTotal / successfulCount : 0;

  console.log('OrderSummary - Row totals calculation:', {
    successfulCount,
    totalCost: totalCost, // Already includes shipping + insurance
    totalInsurance: totalInsurance, // Individual insurance totals for breakdown
    finalTotal: finalTotal,
    averageCostPerLabel,
    calculationBreakdown: `${successfulCount} rows: Each row total (rate + insurance) summed = $${finalTotal.toFixed(2)}`
  });

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-10 rounded-2xl border-2 border-blue-200 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
          <Calculator className="h-8 w-8 text-white" />
        </div>
        <div>
          <h5 className="font-bold text-2xl text-gray-800">Payment Summary</h5>
          <p className="text-gray-600">Complete breakdown of all shipment costs</p>
        </div>
      </div>
      
      <div className="space-y-6 mb-8">
        {/* Label Count with Enhanced Styling */}
        <div className="flex justify-between items-center py-4 px-6 bg-white/80 rounded-xl border border-blue-200 shadow-sm">
          <span className="text-gray-700 font-semibold text-lg flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Number of shipments:
          </span>
          <span className="font-bold text-2xl text-blue-800 bg-blue-100 px-4 py-2 rounded-lg">{successfulCount}</span>
        </div>
        
        {/* Enhanced Row Totals Breakdown */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
          <h6 className="font-bold text-lg text-blue-800 mb-4 flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            Shipping Costs Breakdown
          </h6>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-base">
              <span className="text-gray-700 font-medium">Sum of all row totals (shipping + insurance):</span>
              <span className="font-bold text-blue-800 text-lg">${finalTotal.toFixed(2)}</span>
            </div>
            {successfulCount > 0 && (
              <div className="flex justify-between text-sm bg-blue-100/50 p-3 rounded-lg">
                <span className="text-blue-600">Average total per row:</span>
                <span className="text-blue-700 font-semibold">${(finalTotal / successfulCount).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Insurance Cost Breakdown */}
        {insuranceTotal > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-200 shadow-lg">
            <h6 className="font-bold text-lg text-amber-800 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-600" />
              Insurance Coverage Breakdown
            </h6>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-700 font-medium">Sum of all row insurance costs:</span>
                <span className="font-bold text-amber-800 text-lg">${insuranceTotal.toFixed(2)}</span>
              </div>
              {successfulCount > 0 && (
                <div className="flex justify-between text-sm bg-amber-100/50 p-3 rounded-lg">
                  <span className="text-amber-600">Average insurance per row:</span>
                  <span className="text-amber-700 font-semibold">${(insuranceTotal / successfulCount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* ENHANCED Total Payment Amount - Sum of All Row Totals */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-10 rounded-3xl border-3 border-green-300 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/20 to-emerald-100/20"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-xl">
                  <DollarSign className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-3xl text-green-800">Total Payment Amount</h3>
                  <p className="text-green-600 text-lg">Sum of all individual row totals</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="inline-block bg-white/90 px-8 py-6 rounded-2xl border-3 border-green-300 shadow-2xl">
                  <span className="font-bold text-6xl text-green-700 tracking-tight">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-white/95 p-8 rounded-2xl border-2 border-green-200 shadow-xl">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                    <p className="font-bold text-xl text-green-800">
                      Final Total: ${finalTotal.toFixed(2)}
                    </p>
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <p className="text-green-700 font-semibold mb-2">Calculation Method:</p>
                      <p className="text-green-600">
                        {insuranceTotal > 0 
                          ? `Row 1 (Rate + Insurance) + Row 2 (Rate + Insurance) + ... = Total`
                          : `Row 1 Rate + Row 2 Rate + Row 3 Rate + ... = Total`
                        }
                      </p>
                    </div>
                    
                    {successfulCount > 0 && (
                      <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                        <p className="text-green-700 font-semibold mb-2">Average per Row:</p>
                        <p className="text-green-600 text-lg font-bold">
                          ${averageCostPerLabel.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-300">
                    <p className="text-sm text-green-700 font-medium flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      ✓ All {successfulCount} row totals calculated and summed correctly
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Enhanced Payment Section */}
        <div className="space-y-4">
          {/* Main Payment Button */}
          <Button 
            onClick={onProceedToPayment}
            disabled={isPaying || successfulCount === 0 || finalTotal <= 0}
            className="bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 text-white w-full py-10 text-4xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] rounded-2xl border-2 border-green-400"
            size="lg"
          >
            {isPaying ? (
              <div className="flex items-center justify-center gap-4">
                <Loader className="h-12 w-12 animate-spin" />
                <span>Processing Payment...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <CreditCard className="h-12 w-12" />
                <div className="text-center">
                  <div>Pay ${finalTotal.toFixed(2)}</div>
                  {successfulCount > 0 && (
                    <div className="text-2xl opacity-90 font-normal">
                      ({successfulCount} shipment{successfulCount !== 1 ? 's' : ''})
                    </div>
                  )}
                </div>
              </div>
            )}
          </Button>
          
          {/* Enhanced Add Payment Method Button */}
          {onAddPaymentMethod && (
            <Button 
              variant="outline" 
              onClick={onAddPaymentMethod}
              className="w-full py-6 border-3 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-bold text-xl transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl bg-white/80"
            >
              <Plus className="mr-3 h-6 w-6" />
              Add New Payment Method
            </Button>
          )}
        </div>
        
        {/* Enhanced Download and Email Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={onDownloadAllLabels}
            disabled={isCreatingLabels}
            className="w-full py-6 border-3 border-gray-300 hover:border-green-400 hover:bg-green-50 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl bg-white/80 text-lg font-semibold"
          >
            {isCreatingLabels ? (
              <>
                <Loader className="mr-3 h-6 w-6 animate-spin" />
                Generating Labels...
              </>
            ) : (
              <>
                <Download className="mr-3 h-6 w-6" />
                Download All Labels
              </>
            )}
          </Button>
          
          {onEmailAllLabels && (
            <Button 
              variant="outline" 
              onClick={onEmailAllLabels}
              disabled={isCreatingLabels}
              className="w-full py-6 border-3 border-blue-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl bg-white/80 text-lg font-semibold"
            >
              <svg className="mr-3 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.2a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email All Labels
            </Button>
          )}
        </div>
        
        {/* Enhanced Security & Summary Footer */}
        <div className="text-center text-sm bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
          <div className="space-y-4">
            <p className="font-bold text-gray-800 text-lg flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              🔒 Secure Payment Processing
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Row-by-row calculation
              </p>
              <p className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Sum of all row totals
              </p>
            </div>
            
            {insuranceTotal > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-amber-700 font-semibold flex items-center justify-center gap-2">
                  <Shield className="h-5 w-5" />
                  Insurance coverage included for all {successfulCount} shipments
                </p>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 font-medium">
                Payment Total = Sum of (Row 1 Total + Row 2 Total + Row 3 Total + ...)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
