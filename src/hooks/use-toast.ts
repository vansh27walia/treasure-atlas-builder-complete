
import { toast as sonnerToast } from "sonner";
import * as React from "react";

// Re-export the sonner toast function
export { sonnerToast as toast };

// Create a hook wrapper around the toast functionality
export const useToast = () => {
  return {
    toast: sonnerToast
  };
};
