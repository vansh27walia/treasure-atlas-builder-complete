
import { toast as toastSonner } from "sonner";
import { type ToastProps } from "@/components/ui/toast";

// Create a wrapper for the toast function
export const toast = (props: ToastProps) => {
  return toastSonner({
    title: props.title,
    description: props.description,
  });
};

// Create a useToast hook 
export const useToast = () => {
  return {
    toast,
    toasts: [], // This matches the expected interface but we're using sonner
  };
};
