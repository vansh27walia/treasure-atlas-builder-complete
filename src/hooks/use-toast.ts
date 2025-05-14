
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

const useToast = () => {
  const toast = ({ title, description, variant = "default", action }: ToastProps) => {
    sonnerToast(title || "", {
      description,
      action,
      className: variant === "destructive" ? "bg-red-100" : "",
    });
  };

  // For compatibility with the Toaster component
  const toasts: any[] = [];

  return {
    toast,
    toasts
  };
};

// Export the toast function directly
export { useToast, sonnerToast as toast };
