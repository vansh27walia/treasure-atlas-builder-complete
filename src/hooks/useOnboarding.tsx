
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService } from '@/services/UserProfileService';

export function useOnboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setHasCompletedOnboarding(null);
        setIsCheckingStatus(false);
        return;
      }
      
      try {
        setIsCheckingStatus(true);
        const completed = await userProfileService.hasCompletedOnboarding();
        setHasCompletedOnboarding(completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [user, authLoading]);
  
  return {
    hasCompletedOnboarding,
    isCheckingStatus,
    isLoading: authLoading || isCheckingStatus,
  };
}
