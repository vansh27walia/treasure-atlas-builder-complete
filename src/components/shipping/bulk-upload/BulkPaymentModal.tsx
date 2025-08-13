
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EnhancedAddPaymentMethodModal from '@/components/payment/EnhancedAddPaymentMethodModal';

interface BulkPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BulkPaymentModal: React.FC<BulkPaymentModalProps> = ({
  open,
  onOpenChange
}) => {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <EnhancedAddPaymentMethodModal 
            isOpen={open}
            onClose={() => onOpenChange(false)}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkPaymentModal;
