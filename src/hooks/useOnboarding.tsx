
import { useOnboarding as useOnboardingContext } from '@/contexts/OnboardingContext';

export function useOnboarding() {
  // Use the existing context from OnboardingContext
  return useOnboardingContext();
}
