
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const usePaymentRedirect = () => {
  const navigate = useNavigate();
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);

  useEffect(() => {
    checkPaymentMethods();
  }, []);

  const checkPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('id')
        .limit(1);

      if (error) throw error;
      setHasPaymentMethod(data && data.length > 0);
    } catch (error) {
      console.error('Error checking payment methods:', error);
      setHasPaymentMethod(false);
    }
  };

  const redirectToPaymentIfNeeded = async (): Promise<boolean> => {
    if (hasPaymentMethod === null) {
      // Still loading, wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkPaymentMethods();
    }

    if (!hasPaymentMethod) {
      toast.info('Please add a payment method to continue');
      
      // Store current location for return
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('returnPath', currentPath);
      
      // Navigate to settings payment page
      navigate('/settings?tab=payment');
      return true; // Indicates redirect happened
    }

    return false; // No redirect needed
  };

  const handlePaymentAdded = () => {
    setHasPaymentMethod(true);
    
    // Return to original page if stored
    const returnPath = sessionStorage.getItem('returnPath');
    if (returnPath) {
      sessionStorage.removeItem('returnPath');
      navigate(returnPath);
      // Refresh the page to load new payment method
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return {
    hasPaymentMethod,
    redirectToPaymentIfNeeded,
    handlePaymentAdded,
    checkPaymentMethods
  };
};
