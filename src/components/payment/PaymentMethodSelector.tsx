
import React from 'react';
import PaymentDropdown from './PaymentDropdown';

interface PaymentMethodSelectorProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (methodId: string) => void;
  onPaymentComplete: (success: boolean) => void;
  amount: number;
  description: string;
  onClose?: () => void;
  shippingDetails?: any;
  disabled?: boolean;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  description,
  onPaymentComplete,
  onClose,
  shippingDetails,
  disabled = false,
  className = ""
}) => {
  const handlePaymentSuccess = () => {
    onPaymentComplete(true);
    if (onClose) {
      onClose();
    }
  };

  return (
    <PaymentDropdown
      amount={amount}
      description={description}
      shippingDetails={shippingDetails}
      onPaymentSuccess={handlePaymentSuccess}
      disabled={disabled}
      className={className}
    />
  );
};

export default PaymentMethodSelector;
