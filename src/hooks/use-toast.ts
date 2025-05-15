
import { toast as toastSonner } from "sonner";

export const toast = {
  // Use the standard sonner toast function
  ...toastSonner,
  // Add custom methods with typed parameters
  success: (message: string) => toastSonner.success(message),
  error: (message: string) => toastSonner.error(message),
  info: (message: string) => toastSonner.info(message),
  warning: (message: string) => toastSonner.warning(message),
  // Support the { title, description } format
  custom: (props: { title: string; description: string }) => toastSonner(props.title, { description: props.description }),
};

// Make direct calls with { title, description } work
export const useToast = () => {
  return {
    toast: (props: { title: string; description: string }) => {
      toastSonner(props.title, { description: props.description });
    },
    toasts: [], // This matches the expected interface but we're using sonner
  };
};
