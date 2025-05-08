
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { userProfileService } from '@/services/UserProfileService';

interface OnboardingContextType {
  hasCompletedOnboarding: boolean | null;
  isCheckingStatus: boolean;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  hasCompletedOnboarding: null,
  isCheckingStatus: true,
  completeOnboarding: async () => {},
});

export const useOnboarding = () => useContext(OnboardingContext);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
        // Auto-complete onboarding without showing the modal
        if (!await userProfileService.hasCompletedOnboarding()) {
          await userProfileService.completeOnboarding();
        }
        setHasCompletedOnboarding(true);
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
  
  const completeOnboarding = async () => {
    try {
      await userProfileService.completeOnboarding();
      setHasCompletedOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };
  
  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isCheckingStatus,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export default OnboardingProvider;
