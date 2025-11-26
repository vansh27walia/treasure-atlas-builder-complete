import React, { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CancelLabelDialogProps {
  shipmentId: string;
  trackingCode: string;
  carrier: string;
  service?: string;
  fromAddress: string;
  toAddress: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const CancelLabelDialog: React.FC<CancelLabelDialogProps> = ({
  shipmentId,
  trackingCode,
  carrier,
  service,
  fromAddress,
  toAddress,
  onSuccess,
  trigger
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsCancelling(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-label', {
        body: { shipment_id: shipmentId }
      });

      if (error) {
        console.error('Cancel label error:', error);
        const message = error.message || 'Failed to cancel label. Please try again.';
        setErrorMessage(message);
        return;
      }

      if (data?.error) {
        setErrorMessage(data.error);
        return;
      }

      // Success message with details
      toast.success(
        <div className="space-y-2">
          <div className="font-semibold">Label Cancelled Successfully</div>
          <div className="text-sm space-y-1">
            <div><strong>Tracking:</strong> {trackingCode}</div>
            <div><strong>Carrier:</strong> {carrier}</div>
            <div><strong>From:</strong> {fromAddress}</div>
            <div><strong>To:</strong> {toAddress}</div>
          </div>
        </div>,
        { duration: 8000 }
      );

      setIsOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error cancelling label:', error);
      setErrorMessage(error.message || 'An error occurred while cancelling the label.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Cancel Label
        </Button>
      )}

      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl">Cancel Shipping Label</AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-1">
                This action cannot be reversed
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Warning Notice */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Important: This Label Will Be Permanently Cancelled
            </h4>
            <p className="text-sm text-muted-foreground">
              Once cancelled, this shipping label cannot be reused or reactivated. This action is permanent and irreversible.
            </p>
          </div>

          {/* Shipment Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground">SHIPMENT DETAILS</h4>
            
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Tracking Number:</span>
                <span className="text-sm col-span-2 font-mono">{trackingCode}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <span className="text-sm font-medium">Carrier:</span>
                <span className="text-sm col-span-2">{carrier}</span>
              </div>
              
              {service && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm font-medium">Service:</span>
                  <span className="text-sm col-span-2">{service}</span>
                </div>
              )}
              
              <div className="border-t pt-3 mt-2">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-sm font-medium">Pickup Address:</span>
                  <span className="text-sm col-span-2">{fromAddress}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm font-medium">Delivery Address:</span>
                  <span className="text-sm col-span-2">{toAddress}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Information */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Refund Information</h4>
            <div className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
              <p className="flex items-start gap-2">
                <span className="font-medium mt-0.5">•</span>
                <span><strong>Processing Time:</strong> Your refund will be processed and returned to your account within <strong>48 hours</strong></span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium mt-0.5">•</span>
                <span><strong>Payment Method:</strong> Refund will be credited back to your original payment method (credit card or debit card)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="font-medium mt-0.5">•</span>
                <span><strong>Terms &amp; Conditions:</strong> Standard refund terms and conditions apply. Additional processing time may be required by your financial institution.</span>
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <strong>Error:</strong> {errorMessage}
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isCancelling}>
            Keep Label
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={isCancelling}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Yes, Cancel Label
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
