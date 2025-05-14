
import { toast as sonnerToast } from "sonner";

export type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

export function useToast() {
  function toast({ title, description, variant = "default", action }: ToastProps) {
    sonnerToast(title, {
      description,
      action,
      className: variant === "destructive" ? "bg-red-100" : "",
    });
  }

  return { toast };
}

// Export toast function directly for convenience
export { sonnerToast as toast };
