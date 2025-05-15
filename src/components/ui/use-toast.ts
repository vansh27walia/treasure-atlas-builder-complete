
import { useToast as useShadcnToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "@/components/ui/sonner";

// Re-export both toast implementations
export const useToast = useShadcnToast;
export const toast = sonnerToast;
