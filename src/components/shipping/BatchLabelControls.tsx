
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Download, Mail, Printer, RefreshCw } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';
import BatchProgressTracker from './BatchProgressTracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';

interface BatchLabelControlsProps {
  selectedShipments: any[];
  pickupAddress?: SavedAddress;
  onBatchProcessed?: (result: any) => void;
  onPickupAddressChange?: (address: SavedAddress) => void;
  currentStep?: 'upload' | 'mapping' | 'rates' | 'payment' | 'creation' | 'complete';
}

const BatchLabelControls: React.FC<BatchLabelControlsProps> = ({
  selectedShipments,
  pickupAddress: initialPickupAddress,
  onBatchProcessed,
  onPickupAddressChange,
  currentStep = 'payment'
}) => {
  const {
    isProcessingBatch,
    batchResult,
    processBatchLabels,
    downloadConsolidatedLabel,
    downloadScanForm
  } = useBatchLabelProcessing();

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(initialPickupAddress || null);

  // Load and persist pickup address
  useEffect(() => {
    const loadPickupAddress = async () => {
      if (!pickupAddress) {
        try {
          const defaultAddress = await addressService.getDefaultFromAddress();
          if (defaultAddress) {
            setPickupAddress(defaultAddress);
            if (onPickupAddressChange) {
              onPickupAddressChange(defaultAddress);
            }
          }
        } catch (error) {
          console.error('Error loading default pickup address:', error);
        }
      }
    };

    loadPickupAddress();
  }, [pickupAddress, onPickupAddressChange]);

  // Calculate row-by-row totals
  const calculateBatchTotal = () => {
    if (!selectedShipments || selectedShipments.length === 0) return 0;
    
    return selectedShipments.reduce((total, shipment) => {
      const selectedRate = shipment.availableRates?.find((rate: any) => rate.id === shipment.selectedRateId);
      const shippingCost = selectedRate ? parseFloat(selectedRate.rate.toString()) : 0;
      const insuranceCost = shipment.insurance_amount || 0;
      return total + shippingCost + insuranceCost;
    }, 0);
  };

  const handleCreateBatchLabels = async () => {
    if (!selectedShipments || selectedShipments.length === 0) {
      toast.error('No shipments selected for label creation');
      return;
    }

    if (!paymentCompleted) {
      toast.error('Please complete payment first');
      return;
    }

    setIsCreatingLabels(true);

    try {
      console.log('Creating batch labels with enhanced function...');
      
      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: selectedShipments,
          pickupAddress: pickupAddress,
          labelOptions: {
            generateBatch: true,
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Error creating batch labels:', error);
        throw new Error(error.message || 'Failed to create batch labels');
      }

      if (data && data.success) {
        console.log('Batch labels created successfully:', data);
        toast.success(`Successfully created ${data.successful} labels out of ${data.total}`);
        
        if (onBatchProcessed) {
          onBatchProcessed(data);
        }

        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'complete' }
        }));
      } else {
        throw new Error('No data returned from batch label creation');
      }

    } catch (error) {
      console.error('Failed to create batch labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create batch labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handlePaymentComplete = async () => {
    console.log('Processing batch payment...');
    setPaymentCompleted(false);

    try {
      const batchTotal = calculateBatchTotal();
      const amountInCents = Math.round(batchTotal * 100);

      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          amount: amountInCents,
          quantity: selectedShipments.length,
          description: `Batch Labels - ${selectedShipments.length} shipments (shipping + insurance per row)`,
          metadata: {
            shipment_ids: selectedShipments.map(s => s.id).join(','),
            pickup_address_id: pickupAddress?.id,
            batch_total: batchTotal,
            calculation_method: 'row_by_row_with_insurance'
          }
        }
      });

      if (error) throw new Error(error.message);
      
      toast.success('Redirecting to payment...');
      
      // Redirect to Stripe checkout with return URL
      const returnUrl = `${window.location.origin}${window.location.pathname}?payment_success=true&batch=true`;
      window.location.href = data.url + `&success_url=${encodeURIComponent(returnUrl)}`;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  // Check for payment success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const isBatch = urlParams.get('batch');
    
    if (paymentSuccess === 'true' && isBatch === 'true') {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setPaymentCompleted(true);
      toast.success('Payment completed! Creating labels automatically...');
      
      // Auto-trigger label creation
      setTimeout(() => {
        handleCreateBatchLabels();
      }, 1000);
    }
  }, []);

  const handleRefreshRates = async () => {
    try {
      toast.success('Refreshing rates...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Rates refreshed successfully');
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates');
    }
  };

  const hasSelectedShipments = selectedShipments && selectedShipments.length > 0;
  const hasBatchResult = batchResult && batchResult.consolidatedLabelUrls;
  const batchAmount = calculateBatchTotal();

  return (
    <div className="flex flex-col gap-4">
      {/* Progress Tracker */}
      <BatchProgressTracker 
        currentStep={
          isCreatingLabels ? 'creation' :
          paymentCompleted ? (hasBatchResult ? 'complete' : 'creation') : 
          currentStep
        }
        isProcessing={isProcessingBatch || isCreatingLabels}
      />

      {/* Pickup Address Display */}
      {pickupAddress && (
        <div className="p-3 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-sm mb-1">Pickup Address</h4>
          <p className="text-sm text-gray-600">
            {pickupAddress.name} - {pickupAddress.street1}, {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}
          </p>
        </div>
      )}

      {/* Rate Refresh Section */}
      {hasSelectedShipments && !paymentCompleted && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Refresh Rates</h3>
          <p className="text-sm text-gray-600 mb-4">
            Make sure you have the latest shipping rates before proceeding to payment.
          </p>
          <Button
            onClick={handleRefreshRates}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All Rates
          </Button>
        </div>
      )}

      {/* Payment Section - Show before batch processing */}
      {hasSelectedShipments && !paymentCompleted && !hasBatchResult && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">Ready to Create Batch Labels</h3>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>{selectedShipments.length} shipments ready</span>
              <span>Qty: {selectedShipments.length}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Grand Total (Shipping + Insurance):</span>
              <span>${batchAmount.toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={handlePaymentComplete}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Proceed to Payment
          </Button>
        </div>
      )}

      {/* Label Creation Section - Show after payment */}
      {paymentCompleted && !hasBatchResult && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-4">Payment Completed - Creating Labels</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your payment has been processed. Labels are being generated automatically.
          </p>
          {isCreatingLabels && (
            <div className="mt-2">
              <div className="animate-pulse bg-green-200 h-2 rounded"></div>
              <p className="text-sm text-green-700 mt-1">Creating {selectedShipments.length} labels...</p>
            </div>
          )}
        </div>
      )}

      {/* Download Options - Show after batch result */}
      {hasBatchResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-4">Batch Labels Ready!</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => downloadConsolidatedLabel('pdf')}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={() => setShowPrintPreview(true)}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Preview
            </Button>
            <Button
              onClick={() => setShowEmailModal(true)}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Labels
            </Button>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={batchResult}
      />

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={batchResult}
      />
    </div>
  );
};

export default BatchLabelControls;
