
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

interface UsePaymentRedirectOptions {
  onPaymentRequired?: () => void;
  onPaymentSaved?: () => void;
  requiresPaymentCard?: boolean;
}

export const usePaymentRedirect = ({
  onPaymentRequired,
  onPaymentSaved,
  requiresPaymentCard = false
}: UsePaymentRedirectOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle redirect back from payment settings
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fromPayment = urlParams.get('from') === 'payment';
    const paymentSaved = urlParams.get('payment_saved') === 'true';

    if (fromPayment && paymentSaved) {
      // Payment card was saved, refresh the page to load new payment method
      toast.success('Payment method saved successfully!');
      if (onPaymentSaved) {
        onPaymentSaved();
      }
      
      // Clean up URL and refresh
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Auto-refresh to load new payment method
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [location.search, onPaymentSaved]);

  const redirectToPaymentSettings = (returnUrl?: string) => {
    const currentUrl = returnUrl || location.pathname + location.search;
    const settingsUrl = `/settings?tab=payment&return_url=${encodeURIComponent(currentUrl)}`;
    
    if (onPaymentRequired) {
      onPaymentRequired();
    }
    
    toast.info('Please add a payment method to continue');
    navigate(settingsUrl);
  };

  const checkPaymentAndProceed = async (hasPaymentCard: boolean, proceedCallback: () => void) => {
    if (!hasPaymentCard && requiresPaymentCard) {
      redirectToPaymentSettings();
      return false;
    }
    
    proceedCallback();
    return true;
  };

  return {
    redirectToPaymentSettings,
    checkPaymentAndProceed
  };
};
