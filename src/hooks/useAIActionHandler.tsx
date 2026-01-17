import { useCallback } from 'react';
import { toast } from 'sonner';

export interface AIAction {
  action: string;
  data: any;
  currentStep?: string;
}

export interface AIActionHandlerCallbacks {
  onFillAddress?: (data: { pickup_address?: any; dropoff_address?: any }) => void;
  onFillDimensions?: (data: { weight?: number; length?: number; width?: number; height?: number; packageType?: string }) => void;
  onFetchRates?: () => void;
  onConfirmRate?: (data: { carrier_name?: string; service_type?: string; price?: number }) => void;
  onTriggerPayment?: (data: { method_type?: string }) => void;
  onGenerateLabel?: (data: { label_type?: string; format?: string }) => void;
  onStepChange?: (step: string) => void;
}

export const useAIActionHandler = (callbacks: AIActionHandlerCallbacks) => {
  const handleAIAction = useCallback((aiResponse: AIAction) => {
    const { action, data, currentStep } = aiResponse;
    
    console.log('AI Action received:', { action, data, currentStep });
    
    // Update current step if provided
    if (currentStep && callbacks.onStepChange) {
      callbacks.onStepChange(currentStep);
    }
    
    switch (action) {
      case 'FILL_ADDRESS':
        if (callbacks.onFillAddress) {
          // Dispatch event for address filling with visual feedback
          document.dispatchEvent(new CustomEvent('ai-fill-address', {
            detail: {
              pickupAddress: data.pickup_address,
              dropoffAddress: data.dropoff_address
            }
          }));
          
          // Also handle dimensions if included
          if (data.weight || data.length) {
            document.dispatchEvent(new CustomEvent('ai-fill-dimensions', {
              detail: {
                weight: data.weight,
                length: data.length,
                width: data.width,
                height: data.height,
                packageType: data.packageType || 'box'
              }
            }));
          }
          
          callbacks.onFillAddress(data);
          toast.success('AI has updated your shipping addresses', {
            description: 'Fields highlighted in blue were auto-filled'
          });
        }
        break;
        
      case 'FILL_DIMENSIONS':
        if (callbacks.onFillDimensions) {
          document.dispatchEvent(new CustomEvent('ai-fill-dimensions', {
            detail: {
              weight: data.weight,
              length: data.length,
              width: data.width,
              height: data.height,
              packageType: data.packageType
            }
          }));
          
          callbacks.onFillDimensions(data);
          toast.success('AI has updated your package dimensions', {
            description: 'Fields highlighted in blue were auto-filled'
          });
        }
        break;
        
      case 'FETCH_RATES':
        if (callbacks.onFetchRates) {
          // Trigger the "Get Rates" button click
          document.dispatchEvent(new CustomEvent('ai-trigger-get-rates'));
          callbacks.onFetchRates();
          toast.info('AI is fetching shipping rates...', {
            description: 'Please wait while we find the best options'
          });
        }
        break;
        
      case 'CONFIRM_RATE':
        if (callbacks.onConfirmRate) {
          // Highlight and scroll to the selected rate
          document.dispatchEvent(new CustomEvent('ai-select-rate', {
            detail: {
              carrier: data.carrier_name,
              service: data.service_type,
              price: data.price
            }
          }));
          
          callbacks.onConfirmRate(data);
          toast.success(`AI selected ${data.carrier_name} for you`, {
            description: 'The rate card is highlighted'
          });
        }
        break;
        
      case 'TRIGGER_PAYMENT':
        if (callbacks.onTriggerPayment) {
          // Trigger the payment modal
          document.dispatchEvent(new CustomEvent('ai-trigger-payment', {
            detail: {
              methodType: data.method_type
            }
          }));
          
          callbacks.onTriggerPayment(data);
          toast.info('AI is opening payment options...', {
            description: `Using ${data.method_type} payment method`
          });
        }
        break;
        
      case 'GENERATE_LABEL':
        if (callbacks.onGenerateLabel) {
          // Show label generation options
          document.dispatchEvent(new CustomEvent('ai-generate-label', {
            detail: {
              labelType: data.label_type,
              format: data.format
            }
          }));
          
          callbacks.onGenerateLabel(data);
          toast.success('Generating your shipping label...', {
            description: `Format: ${data.format || '4x6'}`
          });
        }
        break;
        
      case 'ASK_QUESTION':
        // Just show the message, no action needed
        console.log('AI is asking for more info:', data.question_type);
        break;
        
      case 'SHOW_INFO':
        // Just informational, no action
        console.log('AI showing info:', data.info_type);
        break;
        
      default:
        console.log('Unknown AI action:', action);
    }
    
    // Return system message for chat display
    return getSystemMessage(action, data);
  }, [callbacks]);
  
  return { handleAIAction };
};

function getSystemMessage(action: string, data: any): string | null {
  switch (action) {
    case 'FILL_ADDRESS':
      return '📍 System: Shipping addresses updated';
    case 'FILL_DIMENSIONS':
      return '📦 System: Package dimensions updated';
    case 'FETCH_RATES':
      return '🔍 System: Fetching shipping rates...';
    case 'CONFIRM_RATE':
      return `✅ System: Selected ${data.carrier_name || 'carrier'}`;
    case 'TRIGGER_PAYMENT':
      return '💳 System: Opening payment options';
    case 'GENERATE_LABEL':
      return '🏷️ System: Generating shipping label';
    default:
      return null;
  }
}
