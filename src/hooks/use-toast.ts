
import { toast as toastSonner } from "sonner";

export const toast = (props: { title: string; description: string }) => {
  return toastSonner(props);
};

// Create a useToast hook 
export const useToast = () => {
  return {
    toast,
    toasts: [], // This matches the expected interface but we're using sonner
  };
};
