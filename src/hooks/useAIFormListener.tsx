import { useEffect, useCallback, useState } from 'react';

interface AIFormListenerOptions {
  onAddressUpdate?: (pickup: any, dropoff: any) => void;
  onDimensionsUpdate?: (dimensions: { weight?: number; length?: number; width?: number; height?: number; packageType?: string }) => void;
  onTriggerRates?: () => void;
  onSelectRate?: (carrier: string, service?: string) => void;
  onTriggerPayment?: (methodType: string) => void;
  onGenerateLabel?: (labelType: string, format: string) => void;
}

export const useAIFormListener = (options: AIFormListenerOptions) => {
  const [aiHighlightedFields, setAiHighlightedFields] = useState<string[]>([]);
  const [isAIActing, setIsAIActing] = useState(false);

  useEffect(() => {
    // Listen for AI address fill
    const handleFillAddress = (e: CustomEvent) => {
      setIsAIActing(true);
      const { pickupAddress, dropoffAddress } = e.detail;
      
      console.log('AI Fill Address event:', e.detail);
      
      // Highlight the address fields
      setAiHighlightedFields(prev => [...prev, 'pickup-address', 'dropoff-address']);
      
      if (options.onAddressUpdate) {
        options.onAddressUpdate(pickupAddress, dropoffAddress);
      }
      
      // Remove highlight after animation
      setTimeout(() => {
        setAiHighlightedFields(prev => prev.filter(f => f !== 'pickup-address' && f !== 'dropoff-address'));
        setIsAIActing(false);
      }, 3000);
    };

    // Listen for AI dimensions fill
    const handleFillDimensions = (e: CustomEvent) => {
      setIsAIActing(true);
      const { weight, length, width, height, packageType } = e.detail;
      
      console.log('AI Fill Dimensions event:', e.detail);
      
      // Highlight the dimension fields
      setAiHighlightedFields(prev => [...prev, 'weight', 'length', 'width', 'height', 'packageType']);
      
      if (options.onDimensionsUpdate) {
        options.onDimensionsUpdate({ weight, length, width, height, packageType });
      }
      
      // Remove highlight after animation
      setTimeout(() => {
        setAiHighlightedFields([]);
        setIsAIActing(false);
      }, 3000);
    };

    // Listen for AI trigger rates
    const handleTriggerRates = () => {
      setIsAIActing(true);
      console.log('AI Trigger Rates event');
      
      if (options.onTriggerRates) {
        options.onTriggerRates();
      }
      
      setTimeout(() => setIsAIActing(false), 1000);
    };

    // Listen for AI rate selection
    const handleSelectRate = (e: CustomEvent) => {
      setIsAIActing(true);
      const { carrier, service, price } = e.detail;
      
      console.log('AI Select Rate event:', e.detail);
      
      if (options.onSelectRate) {
        options.onSelectRate(carrier, service);
      }
      
      // Scroll to rates section
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      setTimeout(() => setIsAIActing(false), 1000);
    };

    // Listen for AI trigger payment
    const handleTriggerPayment = (e: CustomEvent) => {
      setIsAIActing(true);
      const { methodType } = e.detail;
      
      console.log('AI Trigger Payment event:', e.detail);
      
      if (options.onTriggerPayment) {
        options.onTriggerPayment(methodType);
      }
      
      setTimeout(() => setIsAIActing(false), 1000);
    };

    // Listen for AI generate label
    const handleGenerateLabel = (e: CustomEvent) => {
      setIsAIActing(true);
      const { labelType, format } = e.detail;
      
      console.log('AI Generate Label event:', e.detail);
      
      if (options.onGenerateLabel) {
        options.onGenerateLabel(labelType, format);
      }
      
      setTimeout(() => setIsAIActing(false), 1000);
    };

    // Register all event listeners
    document.addEventListener('ai-fill-address', handleFillAddress as EventListener);
    document.addEventListener('ai-fill-dimensions', handleFillDimensions as EventListener);
    document.addEventListener('ai-trigger-get-rates', handleTriggerRates);
    document.addEventListener('ai-select-rate', handleSelectRate as EventListener);
    document.addEventListener('ai-trigger-payment', handleTriggerPayment as EventListener);
    document.addEventListener('ai-generate-label', handleGenerateLabel as EventListener);

    return () => {
      document.removeEventListener('ai-fill-address', handleFillAddress as EventListener);
      document.removeEventListener('ai-fill-dimensions', handleFillDimensions as EventListener);
      document.removeEventListener('ai-trigger-get-rates', handleTriggerRates);
      document.removeEventListener('ai-select-rate', handleSelectRate as EventListener);
      document.removeEventListener('ai-trigger-payment', handleTriggerPayment as EventListener);
      document.removeEventListener('ai-generate-label', handleGenerateLabel as EventListener);
    };
  }, [options]);

  // Helper to check if a field is highlighted
  const isFieldHighlighted = useCallback((fieldName: string) => {
    return aiHighlightedFields.includes(fieldName);
  }, [aiHighlightedFields]);

  // Get CSS classes for AI-highlighted fields
  const getHighlightClasses = useCallback((fieldName: string) => {
    if (aiHighlightedFields.includes(fieldName)) {
      return 'ring-2 ring-blue-400 ring-offset-2 animate-pulse border-blue-400 bg-blue-50/50 transition-all duration-300';
    }
    return '';
  }, [aiHighlightedFields]);

  return {
    aiHighlightedFields,
    isAIActing,
    isFieldHighlighted,
    getHighlightClasses
  };
};
