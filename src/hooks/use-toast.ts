
import { toast as sonnerToast } from "sonner";

export function useToast() {
  return {
    toast: (message: string) => {
      return sonnerToast(message);
    },
    error: (message: string) => {
      return sonnerToast.error(message);
    },
    success: (message: string) => {
      return sonnerToast.success(message);
    },
    info: (message: string) => {
      return sonnerToast.info(message);
    },
    warning: (message: string) => {
      return sonnerToast.warning(message);
    },
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId);
      } else {
        sonnerToast.dismiss();
      }
    },
    custom: (props: any) => {
      return sonnerToast(props);
    }
  };
}
